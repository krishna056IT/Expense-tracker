const nodemailer = require("nodemailer");

const sendVerificationCode = async (email, code) => {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !Number.isInteger(port)) {
    throw new Error("Email delivery is not configured");
  }

  const smtpPassword =
    SMTP_HOST.toLowerCase() === "smtp.gmail.com"
      ? SMTP_PASS.replace(/\s+/g, "")
      : SMTP_PASS;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user: SMTP_USER, pass: smtpPassword },
  });

  let info;
  try {
    info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || SMTP_USER,
      to: email,
      subject: "Verify your MoneyMate email",
      text: `Your MoneyMate verification code is ${code}. It expires in 10 minutes.`,
    });
  } catch (error) {
    console.error("EMAIL DELIVERY ERROR:", {
      code: error.code,
      responseCode: error.responseCode,
      command: error.command,
      response: error.response,
    });
    throw error;
  }

  console.info("EMAIL DELIVERY RESULT:", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  });

  const recipientAccepted = info.accepted?.some((recipient) => {
    const address = typeof recipient === "string" ? recipient : recipient?.address;
    return address?.toLowerCase() === email.toLowerCase();
  });

  if (!recipientAccepted) {
    const error = new Error("SMTP server did not accept the recipient");
    error.code = "EMAIL_RECIPIENT_REJECTED";
    throw error;
  }

  return { accepted: true, messageId: info.messageId };
};

module.exports = { sendVerificationCode };