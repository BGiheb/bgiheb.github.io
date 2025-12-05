const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { sendEmail } = require("../services/emailService.js");

exports.getAllStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: true,
        classes: {
          include: { class: true },
        },
      },
    });
    res.status(200).json(students.map(student => ({
      id: student.id.toString(),
      name: `${student.user.firstName} ${student.user.lastName}`,
      email: student.user.email,
      avatar: "",
      classes: student.classes.map(c => c.class.code),
      lastActive: student.lastActive ? `Il y a ${Math.floor((new Date() - new Date(student.lastActive)) / 3600000)}h` : "Inconnu",
      status: student.status,
      messages: student.messagesCount,
      participation: student.participation,
    })));
  } catch (error) {
    console.error("Erreur lors de la récupération des étudiants:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des étudiants" });
  }
};

exports.inviteStudent = async (req, res) => {
  const { email, classId } = req.body;

  try {
    const classExists = await prisma.class.findUnique({ where: { id: parseInt(classId) } });
    if (!classExists) {
      return res.status(404).json({ error: "Classe introuvable" });
    }

    const existingInvitation = await prisma.classInvitation.findFirst({
      where: { classId: parseInt(classId), invitedEmail: email },
    });

    if (existingInvitation) {
      const inviteLink = `${process.env.FRONTEND_URL}/accept-class-invitation/${existingInvitation.inviteToken}`;
      try {
        await sendEmail(email, "Invitation to Join a Class", {
          className: classExists.title,
          inviteLink,
          tempPassword: null,
        });
        return res.status(200).json({ message: "Re-invitation envoyée avec succès", inviteToken: existingInvitation.inviteToken });
      } catch (emailError) {
        console.error(`Erreur d'envoi de l'email à ${email}:`, emailError.message);
      }
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'STUDENT',
          firstName: email.split('@')[0],
          lastName: 'Student',
          organization: req.user.organization,
        },
      });

      await prisma.student.create({
        data: { id: user.id, userId: user.id },
      });
    } else {
      const existingStudent = await prisma.student.findUnique({ where: { id: user.id } });
      if (!existingStudent) {
        await prisma.student.create({
          data: { id: user.id, userId: user.id },
        });
      }
    }

    await prisma.classInvitation.create({
      data: {
        inviteToken,
        invitedEmail: email,
        classId: parseInt(classId),
        status: false,
      },
    });

    const inviteLink = `${process.env.FRONTEND_URL}/accept-class-invitation/${inviteToken}`;
    try {
      await sendEmail(email, "Invitation to Join a Class", {
        className: classExists.title,
        inviteLink,
        tempPassword,
      });
      console.log(`Invitation envoyée à ${email} avec mot de passe temporaire: ${tempPassword}`);
    } catch (emailError) {
      console.error(`Erreur d'envoi de l'email à ${email}:`, emailError.message);
    }

    res.status(201).json({ message: "Invitation envoyée avec succès", inviteToken });
  } catch (error) {
    console.error("Erreur lors de l'invitation:", error);
    res.status(500).json({ error: "Erreur serveur lors de l'invitation", details: error.message });
  }
};