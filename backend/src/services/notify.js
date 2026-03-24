/**
 * Notification Service — DEMO MODE ONLY
 * Logs OTP to console and returns it in response. No external services needed.
 */

export async function sendSms(mobile, otp) {
  console.log(`\n📱 [OTP] Mobile: ${mobile} | OTP: ${otp} | Expires: 2 min\n`);
  return { success: true, demo: true };
}

export async function sendEmail(email, otp, name) {
  console.log(`\n📧 [OTP] Email: ${email} | Name: ${name} | OTP: ${otp} | Expires: 2 min\n`);
  return { success: true, demo: true };
}
