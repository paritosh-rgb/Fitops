import { serverEnv } from "@/lib/env";

function hasSmtpConfig() {
  return Boolean(
    serverEnv.SMTP_HOST &&
      serverEnv.SMTP_PORT &&
      serverEnv.SMTP_USER &&
      serverEnv.SMTP_PASS &&
      serverEnv.SMTP_FROM
  );
}

export async function sendPortalMagicLinkEmail(email: string, magicLink: string) {
  if (!hasSmtpConfig()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured for portal magic-link delivery");
    }

    return { delivered: false, debugLink: magicLink };
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: serverEnv.SMTP_HOST,
    port: serverEnv.SMTP_PORT,
    secure: Number(serverEnv.SMTP_PORT) === 465,
    auth: {
      user: serverEnv.SMTP_USER,
      pass: serverEnv.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: serverEnv.SMTP_FROM,
    to: email,
    subject: "Your Stripe Invoice Portal sign-in link",
    text: `Open this secure link to access your invoices: ${magicLink}`,
    html: `<p>Open this secure link to access your invoices:</p><p><a href="${magicLink}">${magicLink}</a></p>`
  });

  return { delivered: true };
}
