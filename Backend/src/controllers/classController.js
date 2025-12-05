const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require("crypto");
const bcrypt = require('bcrypt');
const { sendEmail } = require("../services/emailService.js");

// Configuration pour optimiser les performances
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
  return result;
});

// Statuts possibles pour les demandes de sortie de classe
const LEAVE_REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

exports.createClass = async (req, res) => {
  const { title, code, schedule, emails } = req.body;

  try {
    console.log("Requête reçue:", { title, code, schedule, emails });
    console.log("Utilisateur authentifié:", req.user);

    if (!title || !code || !schedule || !emails || !Array.isArray(emails)) {
      return res
        .status(400)
        .json({ error: "Title, code, schedule, and emails (array) are required" });
    }

    const emailSet = new Set(emails);
    if (emailSet.size !== emails.length) {
      return res
        .status(400)
        .json({ error: "Each email can only be entered once." });
    }

    const teacherId = req.user?.id;
    if (!teacherId) return res.status(401).json({ error: "User not authenticated" });

    const classExists = await prisma.class.findUnique({ where: { code } });
    if (classExists) return res.status(400).json({ error: "Class code already exists" });

    const classData = await prisma.class.create({
      data: { title, code, teacherId, schedule },
    });
    console.log("Classe créée:", classData);

    for (const email of emails) {
      const existingInvitation = await prisma.classInvitation.findFirst({
        where: { classId: classData.id, invitedEmail: email },
      });

      if (!existingInvitation) {
        const token = crypto.randomBytes(32).toString("hex");
        const tempPassword = crypto.randomBytes(8).toString("hex");
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
              organization: req.user.organization || 'default_organization', // Fallback value added
            },
          });

          await prisma.student.create({
            data: { id: user.id, userId: user.id },
          });
        }

        await prisma.classInvitation.create({
          data: { classId: classData.id, invitedEmail: email, inviteToken: token },
        });

        const inviteLink = `${process.env.FRONTEND_URL}/accept-class-invitation/${token}`;
        try {
          await sendEmail(email, "Invitation to Join a Class", {
            className: classData.title,
            inviteLink,
            tempPassword,
          });
          console.log(`Invitation envoyée à ${email} avec mot de passe temporaire: ${tempPassword}`);
        } catch (emailError) {
          console.error(`Erreur d'envoi de l'email à ${email}:`, emailError.message);
        }
      } else {
        console.log(`Email déjà invité: ${email}`);
        const inviteLink = `${process.env.FRONTEND_URL}/accept-class-invitation/${existingInvitation.inviteToken}`;
        try {
          await sendEmail(email, "Invitation to Join a Class", {
            className: classData.title,
            inviteLink,
            tempPassword: null,
          });
          console.log(`Re-invitation envoyée à ${email}`);
        } catch (emailError) {
          console.error(`Erreur d'envoi de l'email à ${email}:`, emailError.message);
        }
      }
    }

    res.status(201).json(classData);
  } catch (error) {
    console.error("Erreur détaillée lors de la création de la classe:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

exports.acceptClassInvitation = async (req, res) => {
  const { token } = req.params;

  console.log("Token reçu:", token);
  console.log("User from request:", req.user);

  try {
    const invitation = await prisma.classInvitation.findUnique({
      where: { inviteToken: token },
      include: { class: true },
    });
    if (!invitation) return res.status(404).json({ error: "Invitation invalide ou expirée" });

    if (!req.user) {
      return res.status(401).json({
        error: "Veuillez vous connecter pour accepter cette invitation",
        redirect: `/?token=${token}`,
      });
    }

    if (req.user.email !== invitation.invitedEmail) {
      return res.status(403).json({
        error: `Cette invitation est destinée à ${invitation.invitedEmail}. Veuillez utiliser le bon compte.`,
      });
    }

    const existingStudent = await prisma.student.findUnique({
      where: { id: req.user.id },
    });
    if (!existingStudent) {
      await prisma.student.create({ data: { id: req.user.id, userId: req.user.id } });
    }

    const studentId = existingStudent ? existingStudent.id : req.user.id;

    const existingClassStudent = await prisma.classStudent.findUnique({
      where: { classId_studentId: { classId: invitation.classId, studentId } },
    });

    if (existingClassStudent) {
      return res.status(400).json({ error: "Vous êtes déjà inscrit à cette classe" });
    }

    await prisma.classStudent.create({
      data: { classId: invitation.classId, studentId },
    });

    await prisma.classInvitation.update({
      where: { inviteToken: token },
      data: { status: true },
    });

    res.status(200).json({
      classId: invitation.classId,
      message: "Invitation acceptée avec succès",
      redirect: `/classes/${invitation.classId}`,
    });
  } catch (error) {
    console.error("Erreur lors de l’acceptation de l’invitation:", error);
    res.status(500).json({ error: "Erreur serveur lors de l’acceptation de l’invitation" });
  }
};

exports.getMyClasses = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let classes;
    
    if (userRole === 'STUDENT') {
      // For students, get classes they are enrolled in
      const student = await prisma.student.findUnique({
        where: { userId: userId },
        include: {
          classes: {
            include: {
              class: {
                include: {
                  teacher: true,
                  messages: true,
                  ClassInvitation: true,
                },
              },
            },
          },
        },
      });
      
      if (!student) {
        return res.status(200).json([]);
      }
      
      classes = student.classes.map(cs => cs.class);
    } else {
      // For teachers, get classes they teach
      classes = await prisma.class.findMany({
        where: { teacherId: userId },
        include: {
          students: true,
          teacher: true,
          messages: true,
          ClassInvitation: true,
        },
      });
    }

    const formattedClasses = classes.map((classItem) => ({
      id: classItem.id,
      title: classItem.title,
      code: classItem.code,
      students: classItem.students.length,
      messages: classItem.messages.length,
      lastActivity: classItem.lastActivity ? `Il y a ${Math.floor((new Date() - new Date(classItem.lastActivity)) / (1000 * 60 * 60))}h` : "Il y a 1j",
      status: classItem.status || "active",
      schedule: classItem.schedule,
    }));

    res.status(200).json(formattedClasses);
  } catch (error) {
    console.error("Erreur lors de la récupération des classes:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des classes" });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const classId = parseInt(id);
    console.log("Requête pour classId:", classId, "avec token:", req.headers.authorization);

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        students: {
          include: {
            student: {
              select: {
                id: true,
                userId: true,
                lastActive: true,
                status: true,
                participation: true,
                messagesCount: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        messages: {
          select: {
            id: true,
            content: true,
            role: true,
            timestamp: true,
          },
        },
        documents: {
          select: {
            id: true,
            name: true,
            type: true,
            size: true,
            uploadedBy: true,
            uploadedAt: true,
            downloads: true,
            uploader: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    console.log("Données brutes de la classe:", classData);
    if (!classData) {
      return res.status(404).json({ error: "Classe non trouvée" });
    }

    const now = new Date();
    const studentsWithDetails = classData.students.map((cs) => {
      const student = cs.student;
      return {
        id: student.id,
        userId: student.userId,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        avatar: student.user.avatar || `/api/placeholder/40/40`,
        status: student.status,
        joinedAt: cs.createdAt ? `Il y a ${Math.floor((now - new Date(cs.createdAt)) / (1000 * 60 * 60 * 24))}j` : "Inconnu",
        messagesCount: student.messagesCount || 0,
        lastActivity: student.lastActive ? `Il y a ${Math.floor((now - new Date(student.lastActive)) / (1000 * 60))}m` : "Inconnu",
        participation: student.participation,
      };
    });

    const documentsWithDetails = classData.documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      uploadedBy: `${doc.uploader.firstName} ${doc.uploader.lastName}`,
      uploadedAt: `Il y a ${Math.floor((now - new Date(doc.uploadedAt)) / (1000 * 60 * 60 * 24))}j`,
      downloads: doc.downloads,
    }));

    const formattedClass = {
      id: classData.id,
      title: classData.title,
      code: classData.code,
      status: classData.status,
      schedule: classData.schedule,
      teacher: classData.teacher,
      students: studentsWithDetails,
      messages: classData.messages,
      documents: documentsWithDetails,
      lastActivity: classData.lastActivity ? `Il y a ${Math.floor((now - new Date(classData.lastActivity)) / (1000 * 60 * 60))}h` : "Il y a 1j",
    };

    console.log("Données formatées:", formattedClass);
    res.status(200).json(formattedClass);
  } catch (error) {
    console.error("Erreur lors de la récupération des détails de la classe:", error.message, error.stack);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des détails de la classe", details: error.message });
  }
};

exports.inviteStudents = async (req, res) => {
  const { id: classId } = req.params;
  const { emails } = req.body;

  try {
    const classData = await prisma.class.findUnique({
      where: { id: parseInt(classId) },
      include: { students: { include: { student: { include: { user: true } } } } },
    });
    if (!classData) return res.status(404).json({ error: "Classe non trouvée" });

    const teacherId = req.user?.id;
    if (!teacherId || classData.teacherId !== teacherId) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: "Emails (array non vide) sont requis" });
    }

    const existingStudentEmails = new Set(classData.students.map(cs => cs.student.user.email));
    const invitationsSent = [];

    for (const email of emails) {
      if (existingStudentEmails.has(email)) {
        console.log(`Étudiant déjà membre: ${email}`);
        continue;
      }

      const existingInvitation = await prisma.classInvitation.findFirst({
        where: { classId: parseInt(classId), invitedEmail: email },
      });

      let token;
      if (!existingInvitation) {
        token = crypto.randomBytes(32).toString("hex");
        const tempPassword = crypto.randomBytes(8).toString("hex");
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
              organization: req.user.organization || 'default_organization', // Fallback value added
            },
          });

          await prisma.student.create({
            data: { id: user.id, userId: user.id },
          });
        }

        await prisma.classInvitation.create({
          data: { classId: parseInt(classId), invitedEmail: email, inviteToken: token },
        });

        const inviteLink = `${process.env.FRONTEND_URL}/accept-class-invitation/${token}`;
        try {
          await sendEmail(email, "Invitation to Join a Class", {
            className: classData.title,
            inviteLink,
            tempPassword,
          });
          invitationsSent.push(email);
          console.log(`Invitation envoyée à ${email} avec mot de passe temporaire: ${tempPassword}`);
        } catch (emailError) {
          console.error(`Erreur d'envoi de l'email à ${email}:`, emailError.message);
        }
      } else {
        console.log(`Email déjà invité: ${email}`);
        token = existingInvitation.inviteToken;
        const inviteLink = `${process.env.FRONTEND_URL}/accept-class-invitation/${token}`;
        try {
          await sendEmail(email, "Invitation to Join a Class", {
            className: classData.title,
            inviteLink,
            tempPassword: null,
          });
          invitationsSent.push(email);
          console.log(`Re-invitation envoyée à ${email}`);
        } catch (emailError) {
          console.error(`Erreur d'envoi de l'email à ${email}:`, emailError.message);
        }
      }
    }

    res.status(200).json({
      message: `Invitations envoyées avec succès à ${invitationsSent.length} adresses: ${invitationsSent.join(", ")}`,
      skipped: Array.from(existingStudentEmails).filter(e => emails.includes(e)),
    });
  } catch (error) {
    console.error("Erreur lors de l'invitation des étudiants:", error);
    res.status(500).json({ error: "Erreur serveur lors de l'invitation des étudiants", details: error.message });
  }
};

exports.requestLeaveClass = async (req, res) => {
  const { classId } = req.params;
  const userId = req.user?.id;

  try {
    // Validate inputs
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    if (!classId) {
      return res.status(400).json({ error: "Class ID is required" });
    }

    // Check if the user is a student in the class
    const classStudent = await prisma.classStudent.findUnique({
      where: { classId_studentId: { classId: parseInt(classId), studentId: userId } },
    });

    if (!classStudent) {
      return res.status(403).json({ error: "You are not enrolled in this class" });
    }

    // Check if a leave request already exists
    const existingRequest = await prisma.classLeaveRequest.findFirst({
      where: {
        classId: parseInt(classId),
        studentId: userId,
        status: LEAVE_REQUEST_STATUS.PENDING,
      },
    });

    if (existingRequest) {
      return res.status(400).json({ error: "You already have a pending leave request for this class" });
    }

    // Create a new leave request
    const leaveRequest = await prisma.classLeaveRequest.create({
      data: {
        classId: parseInt(classId),
        studentId: userId,
        status: LEAVE_REQUEST_STATUS.PENDING,
      },
    });

    res.status(201).json({
      message: "Leave request submitted successfully",
      leaveRequest,
    });
  } catch (error) {
    console.error("Error creating leave request:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

exports.getMyLeaveRequests = async (req, res) => {
  const userId = req.user?.id;

  try {
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Fetch all leave requests for the authenticated student
    const leaveRequests = await prisma.classLeaveRequest.findMany({
      where: { studentId: userId },
      include: {
        class: {
          select: { id: true, title: true, code: true },
        },
      },
    });

    // Format the response
    const formattedRequests = leaveRequests.map((request) => ({
      id: request.id,
      classId: request.classId,
      classTitle: request.class.title,
      classCode: request.class.code,
      status: request.status,
      createdAt: request.createdAt,
    }));

    res.status(200).json(formattedRequests);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};