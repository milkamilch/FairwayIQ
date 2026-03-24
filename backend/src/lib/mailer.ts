import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? 'noreply@faiway-iq.com';
const APP_URL = process.env.APP_URL ?? 'https://api.faiway-iq.com';

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const firstName = name.trim().split(/\s+/)[0];
  const link = `${APP_URL}/api/auth/verify-email?token=${token}`;

  const result = await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'FairwayIQ – E-Mail bestätigen',
    html: `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0F0F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F0F0;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px">

        <!-- Logo / Header -->
        <tr><td style="padding:0 0 24px 0;text-align:center">
          <span style="font-size:22px;font-weight:800;color:#0A0A0A;letter-spacing:-0.5px">Fairway<span style="color:#FF6535">IQ</span></span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#FFFFFF;border-radius:16px;padding:40px 36px;border:1px solid #E8E8E8">

          <!-- Icon -->
          <div style="width:52px;height:52px;background:#FF653520;border-radius:14px;margin:0 0 24px 0;display:flex;align-items:center;justify-content:center">
            <span style="font-size:26px;line-height:52px;display:block;text-align:center">⛳</span>
          </div>

          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0A0A0A;letter-spacing:-0.3px">Willkommen, ${firstName}!</h1>
          <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#555555">
            Bestätige deine E-Mail-Adresse, um FairwayIQ vollständig nutzen zu können und dein Golfspiel auf das nächste Level zu bringen.
          </p>

          <!-- CTA Button -->
          <a href="${link}" style="display:block;background:#FF6535;color:#FFFFFF;font-weight:700;font-size:15px;text-align:center;padding:16px 28px;border-radius:12px;text-decoration:none;letter-spacing:0.1px">
            E-Mail bestätigen
          </a>

          <!-- Divider -->
          <div style="border-top:1px solid #E8E8E8;margin:32px 0 24px"></div>

          <p style="margin:0;font-size:12px;line-height:1.6;color:#AAAAAA">
            Dieser Link ist 24 Stunden gültig. Falls du dich nicht bei FairwayIQ registriert hast, kannst du diese E-Mail ignorieren.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0 0;text-align:center">
          <p style="margin:0;font-size:12px;color:#AAAAAA">© 2026 FairwayIQ · <a href="https://faiway-iq.com" style="color:#AAAAAA;text-decoration:none">faiway-iq.com</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
  console.log('Resend result:', JSON.stringify(result));
  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }
}
