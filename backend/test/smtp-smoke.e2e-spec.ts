/**
 * SMTP Smoke Test — verifies that the nodemailer transport can authenticate
 * and connect to the configured SMTP server. Uses the real .env credentials
 * to call `transporter.verify()`, which performs an SMTP EHLO handshake
 * without actually sending an email.
 *
 * Run:  npx jest --testPathPattern smtp-smoke
 *
 * Guards: skips gracefully if SMTP_HOST is not configured (CI without secrets).
 */
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load the real .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const hasSmtp = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

(hasSmtp ? describe : describe.skip)(
  'SMTP Smoke Test (real transport)',
  () => {
    let transporter: nodemailer.Transporter;

    beforeAll(() => {
      transporter = nodemailer.createTransport({
        host: SMTP_HOST!,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER!, pass: SMTP_PASS! },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
      });
    });

    afterAll(() => {
      transporter.close();
    });

    it('connects and authenticates to SMTP server (transporter.verify)', async () => {
      // verify() performs EHLO + AUTH without sending mail
      const ok = await transporter.verify();
      expect(ok).toBe(true);
    }, 15_000);

    it('transport config matches expected host/port/auth', () => {
      expect(SMTP_HOST).toBe('smtp.gmail.com');
      expect(SMTP_PORT).toBe(465);
      expect(SMTP_USER).toMatch(/@gmail\.com$/);
      expect(SMTP_PASS).toBeTruthy();
      expect(SMTP_PASS!.length).toBeGreaterThanOrEqual(16); // App passwords are 16 chars
    });
  },
);
