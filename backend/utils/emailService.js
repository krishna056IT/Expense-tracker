const nodemailer = require("nodemailer");

const sendVerificationCode = async (email, code) => {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !Number.isInteger(port)) {
    throw new Error("Email delivery is not configured");
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || SMTP_USER,
    to: email,
    subject: "Verify your MoneyMate email",
    text: `Your MoneyMate verification code is ${code}. It expires in 10 minutes.`,
  });
};

module.exports = { sendVerificationCode };