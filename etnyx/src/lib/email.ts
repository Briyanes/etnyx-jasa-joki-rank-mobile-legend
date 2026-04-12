import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@etnyx.com";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "ETNYX";

export async function sendVerificationEmail(
  to: string,
  name: string,
  verifyUrl: string
): Promise<boolean> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set. Email not sent. Verify URL:", verifyUrl);
    return false;
  }

  try {
    await resend.emails.send({
      from: `${SITE_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `Verifikasi Email - ${SITE_NAME}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6366f1;">Halo ${name}!</h2>
          <p>Terima kasih sudah mendaftar di <strong>${SITE_NAME}</strong>.</p>
          <p>Klik tombol di bawah untuk memverifikasi email kamu:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" 
               style="background: #6366f1; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Verifikasi Email
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Atau copy link ini ke browser:</p>
          <p style="color: #6366f1; font-size: 14px; word-break: break-all;">${verifyUrl}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">Jika kamu tidak mendaftar di ${SITE_NAME}, abaikan email ini.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<boolean> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set. Email not sent. Reset URL:", resetUrl);
    return false;
  }

  try {
    await resend.emails.send({
      from: `${SITE_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `Reset Password - ${SITE_NAME}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6366f1;">Reset Password</h2>
          <p>Halo <strong>${name}</strong>,</p>
          <p>Kamu meminta reset password untuk akun ${SITE_NAME}.</p>
          <p>Klik tombol di bawah untuk membuat password baru:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #6366f1; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Link ini akan kedaluwarsa dalam 1 jam.</p>
          <p style="color: #666; font-size: 14px;">Atau copy link ini ke browser:</p>
          <p style="color: #6366f1; font-size: 14px; word-break: break-all;">${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">Jika kamu tidak meminta reset password, abaikan email ini.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}
