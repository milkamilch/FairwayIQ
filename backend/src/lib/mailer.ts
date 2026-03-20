import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? 'noreply@fairway-iq.de';
const APP_URL = process.env.APP_URL ?? 'https://api.fairway-iq.de';

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const link = `${APP_URL}/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'FairwayIQ – E-Mail bestätigen',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#07070f;color:#f0f0ff;border-radius:12px">
        <h2 style="margin:0 0 8px;color:#00e87a">Willkommen bei FairwayIQ, ${name}!</h2>
        <p style="color:#8888aa;margin:0 0 24px">Bitte bestätige deine E-Mail-Adresse, um loszulegen.</p>
        <a href="${link}" style="display:inline-block;background:#00e87a;color:#07070f;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px">
          E-Mail bestätigen
        </a>
        <p style="color:#44445a;font-size:12px;margin:24px 0 0">
          Dieser Link ist 24 Stunden gültig. Falls du dich nicht registriert hast, kannst du diese Mail ignorieren.
        </p>
      </div>
    `,
  });
}
