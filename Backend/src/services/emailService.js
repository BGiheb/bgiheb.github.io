const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendEmail = async (to, subject, data) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: `
        <h1>Invitation à rejoindre la classe ${data.className}</h1>
        <p>Bonjour,</p>
        <p>Vous avez été invité à rejoindre la classe "${data.className}".</p>
        <p>Cliquez sur le lien suivant pour accepter l'invitation :</p>
        <a href="${data.inviteLink}">Accepter l'invitation</a>
        ${data.tempPassword ? `
          <p>Vos identifiants de connexion :</p>
          <p><strong>Adresse email (pour la connexion) :</strong> ${to}</p>
          <p><strong>Mot de passe temporaire :</strong> ${data.tempPassword}</p>
          <p>Veuillez utiliser ces identifiants pour vous connecter et réinitialiser votre mot de passe après avoir rejoint la classe.</p>
        ` : ''}
        <p>Si vous n'attendiez pas cette invitation, veuillez ignorer cet email.</p>
        <p>Cordialement,<br>L'équipe EduPlatform</p>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Email envoyé à ${to} avec tempPassword: ${data.tempPassword || 'none'}`);
  } catch (error) {
    console.error(`Erreur lors de l'envoi de l'email à ${to}:`, error);
    throw error;
  }
};

module.exports = { sendEmail };