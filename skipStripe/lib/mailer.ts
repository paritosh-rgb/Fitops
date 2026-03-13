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

export async function sendPortalOtpEmail(email: string, code: string) {
  if (!hasSmtpConfig()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured for portal OTP delivery");
    }

    return { delivered: false, debugCode: code };
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
    subject: "Your Stripe Invoice Portal verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`
  });

  return { delivered: true };
}
