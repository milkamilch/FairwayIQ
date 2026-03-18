import axios from 'axios';

export interface OsmCourse {
  id: number;
  name: string;
  location: string;
  lat: number;
  lon: number;
}

export async function searchGolfCourses(query: string): Promise<OsmCourse[]> {
  const overpassQuery = `
[out:json][timeout:15];
(
  way["leisure"="golf_course"]["name"~"${query}",i];
  relation["leisure"="golf_course"]["name"~"${query}",i];
  node["leisure"="golf_course"]["name"~"${query}",i];
);
out center tags;
`;

  const response = await axios.post(
    'https://overpass-api.de/api/interpreter',
    `data=${encodeURIComponent(overpassQuery)}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
  );

  const elements: any[] = response.data.elements ?? [];

  return elements
    .filter((el) => el.tags?.name)
    .map((el) => {
      const lat = el.center?.lat ?? el.lat ?? 0;
      const lon = el.center?.lon ?? el.lon ?? 0;
      const city =
        el.tags['addr:city'] ??
        el.tags['addr:municipality'] ??
        el.tags['is_in:city'] ??
        el.tags['addr:state'] ??
        '';
      const country = el.tags['addr:country'] ?? '';
      const location = [city, country].filter(Boolean).join(', ') || 'Standort unbekannt';

      return { id: el.id, name: el.tags.name, location, lat, lon };
    })
    .slice(0, 20);
}
