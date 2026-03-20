/**
 * GolfCourseAPI Import-Script — Deutschland, Österreich, Schweiz
 *
 * Strategie:
 *  Die API sucht NUR nach Club-/Course-Namen (kein Länder-Filter).
 *  Deutsche/österreichische/schweizer Clubs enthalten fast immer den
 *  Stadtnamen → wir suchen nach ~80 Städten und deduplizieren per apiId.
 *
 * Ausführen:
 *   cd backend
 *   npx tsx src/scripts/importCourses.ts            (echter Import)
 *   npx tsx src/scripts/importCourses.ts --dry-run  (nur anzeigen)
 */

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_KEY = process.env.GOLF_COURSE_API_KEY!;
const API_BASE = 'https://api.golfcourseapi.com/v1';
const MAX_REQUESTS = 270;
const DELAY_MS = 350;
const DRY_RUN = process.argv.includes('--dry-run');

// ── Exakte API-Typen laut OpenAPI-Spec ────────────────────────────────
interface ApiHole {
  par: number;
  yardage: number;
  handicap: number; // = Stroke Index
}

interface ApiTeeBox {
  tee_name: string;
  course_rating: number;
  slope_rating: number;
  par_total: number;
  total_yards?: number;
  total_meters?: number;
  number_of_holes?: number;
  holes: ApiHole[];
}

interface ApiCourse {
  id: number;
  club_name: string;
  course_name: string;
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  tees?: {
    male?: ApiTeeBox[];
    female?: ApiTeeBox[];
  };
}

interface SearchResponse {
  courses: ApiCourse[];
}

// ── Suchbegriffe: Städte in DE / AT / CH ─────────────────────────────
// Deutsche, österreichische und Schweizer Clubs haben fast immer
// den Stadtnamen im Club- oder Course-Namen.
const SEARCH_TERMS = [
  // Deutschland — Großstädte & bekannte Golfregionen
  'München Golf', 'Hamburg Golf', 'Berlin Golf', 'Frankfurt Golf',
  'Köln Golf', 'Stuttgart Golf', 'Düsseldorf Golf', 'Leipzig Golf',
  'Dortmund Golf', 'Bremen Golf', 'Dresden Golf', 'Hannover Golf',
  'Nürnberg Golf', 'Duisburg Golf', 'Bochum Golf', 'Wiesbaden Golf',
  'Münster Golf', 'Augsburg Golf', 'Karlsruhe Golf', 'Mannheim Golf',
  'Freiburg Golf', 'Heidelberg Golf', 'Bonn Golf', 'Aachen Golf',
  'Kiel Golf', 'Lübeck Golf', 'Rostock Golf', 'Erfurt Golf',
  'Potsdam Golf', 'Magdeburg Golf', 'Mainz Golf', 'Saarbrücken Golf',
  'Regensburg Golf', 'Ingolstadt Golf', 'Würzburg Golf', 'Ulm Golf',
  'Osnabrück Golf', 'Kassel Golf', 'Paderborn Golf', 'Halle Golf',
  'Bayreuth Golf', 'Bamberg Golf', 'Konstanz Golf', 'Memmingen Golf',
  'Starnberg Golf', 'Bad Griesbach Golf', 'Berchtesgaden Golf',
  'Garmisch Golf', 'Oberstdorf Golf', 'Sylt Golf', 'Rügen Golf',
  // Österreich
  'Wien Golf', 'Graz Golf', 'Salzburg Golf', 'Innsbruck Golf',
  'Linz Golf', 'Klagenfurt Golf', 'Villach Golf', 'Wels Golf',
  'St. Pölten Golf', 'Bregenz Golf', 'Kitzbühel Golf', 'Seefeld Golf',
  'Bad Ischl Golf', 'Zell am See Golf', 'Lech Golf',
  // Schweiz
  'Zürich Golf', 'Bern Golf', 'Basel Golf', 'Geneva Golf',
  'Lausanne Golf', 'Luzern Golf', 'Lugano Golf', 'St. Gallen Golf',
  'Davos Golf', 'St. Moritz Golf', 'Verbier Golf', 'Crans-Montana Golf',
  'Interlaken Golf', 'Ascona Golf',
  // Generische Suchen als Fallback
  'Golfclub Deutschland', 'Golf Club Germany',
];

// ── Request-Zähler & Hilfsfunktionen ─────────────────────────────────
let requestCount = 0;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function apiGet<T>(path: string): Promise<T> {
  requestCount++;
  if (requestCount > MAX_REQUESTS) {
    throw new Error(`LIMIT: ${MAX_REQUESTS} Requests erreicht. Morgen fortfahren.`);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Key ${API_KEY}` },
  });
  if (res.status === 429) throw new Error('RATE_LIMIT: 429 Too Many Requests');
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ── Bestes Tee-Set wählen (White/Gelb für HCP-Berechnung) ─────────────
function chooseTee(tees: ApiCourse['tees']): ApiTeeBox | null {
  const male = tees?.male ?? [];
  const female = tees?.female ?? [];
  const all = [...male, ...female];
  if (!all.length) return null;

  // Priorität: White → Yellow → Blue → erstes verfügbares
  const priority = ['white', 'yellow', 'gelb', 'weiß', 'blue', 'blau'];
  for (const prio of priority) {
    const found = all.find((t) => t.tee_name?.toLowerCase().includes(prio));
    if (found && found.holes?.length >= 9) return found;
  }
  return all.find((t) => t.holes?.length >= 9) ?? null;
}

function yardToMeter(y: number) {
  return Math.round(y * 0.9144);
}

function isInDACH(course: ApiCourse): boolean {
  const country = course.location?.country?.toLowerCase() ?? '';
  const addr = course.location?.address?.toLowerCase() ?? '';
  const dach = ['germany', 'deutschland', 'austria', 'österreich',
                'switzerland', 'schweiz', 'suisse', 'svizzera'];
  return dach.some((c) => country.includes(c) || addr.includes(c));
}

// ── Haupt-Import ──────────────────────────────────────────────────────
async function main() {
  if (!API_KEY) {
    console.error('❌  GOLF_COURSE_API_KEY fehlt in .env'); process.exit(1);
  }

  console.log(`\n🏌️  FairwayIQ — Course Import DE/AT/CH`);
  console.log(`   Modus  : ${DRY_RUN ? '🔍 DRY RUN' : '💾 LIVE'}`);
  console.log(`   API-Key: ${API_KEY.slice(0, 6)}…${API_KEY.slice(-4)}`);
  console.log(`   Suchen : ${SEARCH_TERMS.length}\n`);

  const seen = new Set<number>();
  let saved = 0, skipped = 0, noTees = 0;

  for (const term of SEARCH_TERMS) {
    if (requestCount >= MAX_REQUESTS) {
      console.log(`\n⛔ Request-Limit (${MAX_REQUESTS}) erreicht — morgen weiterführen.`);
      break;
    }

    let courses: ApiCourse[] = [];
    try {
      process.stdout.write(`🔍 "${term}" (#${requestCount + 1}) … `);
      const data = await apiGet<SearchResponse>(`/search?search_query=${encodeURIComponent(term)}`);
      courses = data.courses ?? [];
      console.log(`${courses.length} Treffer`);
    } catch (err: any) {
      console.log(`❌ ${err.message}`);
      if (err.message.startsWith('LIMIT') || err.message.startsWith('RATE')) break;
      await sleep(DELAY_MS);
      continue;
    }

    for (const course of courses) {
      if (seen.has(course.id)) { skipped++; continue; }
      seen.add(course.id);

      // Nur DACH-Plätze speichern
      if (!isInDACH(course)) { skipped++; continue; }

      const tee = chooseTee(course.tees);
      const name = course.course_name && course.course_name !== course.club_name
        ? `${course.club_name} – ${course.course_name}`
        : course.club_name;
      const locationParts = [course.location?.city, course.location?.state, course.location?.country].filter(Boolean);
      const location = locationParts.join(', ') || course.location?.address || '';

      if (DRY_RUN) {
        console.log(`   ✓ [${course.id}] ${name} · ${location}` +
          (tee ? ` · Par ${tee.par_total} · CR ${tee.course_rating}/${tee.slope_rating}` : ' · (keine Tees)'));
        saved++;
        continue;
      }

      try {
        const existingCourse = await prisma.course.findFirst({
          where: { apiId: String(course.id) },
        });

        if (existingCourse) {
          await prisma.course.update({
            where: { id: existingCourse.id },
            data: {
              name,
              location,
              totalPar: tee?.par_total ?? 72,
              rating: tee?.course_rating ?? undefined,
              slope: tee?.slope_rating ?? undefined,
            },
          });
        } else {
          await prisma.course.create({
            data: {
              apiId: String(course.id),
              name,
              location,
              totalPar: tee?.par_total ?? 72,
              rating: tee?.course_rating ?? null,
              slope: tee?.slope_rating ?? null,
              holesImported: tee?.holes?.length ? true : false,
              createdBy: null,
              ...(tee?.holes?.length
                ? {
                    holes: {
                      create: tee.holes.map((h, i) => ({
                        number: i + 1,
                        par: h.par,
                        strokeIndex: h.handicap ?? 0,
                        distanceMeters: yardToMeter(h.yardage ?? 0),
                      })),
                    },
                  }
                : {}),
            },
          });
        }
        saved++;
        process.stdout.write('.');
      } catch (err: any) {
        console.error(`\n❌ DB-Fehler [${course.id}] ${name}: ${err.message}`);
      }
    }

    await sleep(DELAY_MS);
  }

  // ── Zusammenfassung ─────────────────────────────────────────────────
  const totalInDb = DRY_RUN ? '—' : await prisma.course.count({ where: { apiId: { not: null } } });
  console.log('\n' + '─'.repeat(55));
  console.log(`✅  Import fertig`);
  console.log(`    API-Requests: ${requestCount} / 300 (${300 - requestCount} übrig)`);
  console.log(`    Gespeichert : ${saved}`);
  console.log(`    Duplikate   : ${skipped}`);
  console.log(`    In DB gesamt: ${totalInDb}`);
  console.log('─'.repeat(55) + '\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
