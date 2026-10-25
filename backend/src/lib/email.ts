import { env } from '../config/env.js';

export interface Email {
  to: string;
  subject: string;
  text: string;
}

const SENDGRID_URL = 'https://api.sendgrid.com/v3/mail/send';

/** Envía correos vía SendGrid. Nunca lanza: un fallo de correo no rompe la request.
 *  Sin SENDGRID_API_KEY (desarrollo) solo registra el asunto. */
export async function sendEmails(emails: Email[]): Promise<void> {
  for (const email of emails) {
    if (!env.SENDGRID_API_KEY) {
      console.info('[email:dev] no enviado (sin SENDGRID_API_KEY):', email.subject);
      continue;
    }
    try {
      const res = await fetch(SENDGRID_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: email.to }] }],
          from: { email: env.EMAIL_FROM, name: 'PAWVET' },
          subject: email.subject,
          content: [{ type: 'text/plain', value: email.text }],
        }),
      });
      if (!res.ok) console.error('[email] SendGrid respondió', res.status, email.subject);
    } catch (err) {
      console.error('[email] fallo al enviar:', email.subject, err);
    }
  }
}
