const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

async function sendResetEmail(email, resetUrl) {
  await transporter.sendMail({
    from: `Parchi <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your Parchi password',
    html: `<p>Click the link below to reset your password. This link expires in 30 minutes.</p>
           <a href="${resetUrl}">${resetUrl}</a>`
  });
}

module.exports = { sendResetEmail };