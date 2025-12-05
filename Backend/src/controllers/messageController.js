const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getStudentsByClasses = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Récupération des étudiants pour userId:", userId);
    const classes = await prisma.class.findMany({
      where: { teacherId: userId },
      include: { students: { include: { student: { include: { user: true } } } } }
    });
    const students = classes.flatMap(cls =>
      cls.students.map(cs => ({
        id: cs.student.id,
        name: `${cs.student.user.firstName} ${cs.student.user.lastName}`,
        classCode: cls.code
      }))
    );
    console.log("Étudiants trouvés:", students);
    res.status(200).json(students);
  } catch (error) {
    console.error("Erreur lors de la récupération des étudiants:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des étudiants" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    console.log("Requête reçue:", req.body);
    const { content, recipientId, recipientType, conversationId } = req.body;
    const userId = req.user.id;
    console.log("Utilisateur connecté:", userId);

    // Valider les champs requis
    if (!content || content.trim() === "") {
      console.log("Contenu du message manquant ou vide");
      return res.status(400).json({ error: "Le contenu du message est requis" });
    }
    if (!recipientType || !["user", "student"].includes(recipientType)) {
      console.log("Type de destinataire invalide:", recipientType);
      return res.status(400).json({ error: "Type de destinataire invalide (doit être 'user' ou 'student')" });
    }
    if (!recipientId || isNaN(parseInt(recipientId))) {
      console.log("recipientId manquant ou invalide:", recipientId);
      return res.status(400).json({ error: "ID du destinataire manquant ou invalide" });
    }

    // Vérifier l'existence du destinataire
    let recipient;
    if (recipientType === "user") {
      recipient = await prisma.user.findUnique({ where: { id: parseInt(recipientId) } });
      console.log("Destinataire (user) trouvé:", recipient);
      if (!recipient) return res.status(404).json({ error: "Utilisateur introuvable" });
    } else if (recipientType === "student") {
      recipient = await prisma.student.findUnique({ where: { id: parseInt(recipientId) } });
      console.log("Destinataire (student) trouvé:", recipient);
      if (!recipient) return res.status(404).json({ error: "Étudiant introuvable" });
    }

    // Déterminer le participant actuel
    const senderStudent = await prisma.student.findFirst({ where: { userId } });
    const isSenderStudent = !!senderStudent;

    // Gérer la conversation
    let numericConversationId;
    if (conversationId && conversationId.startsWith("student-")) {
      const participantId = parseInt(conversationId.split("-")[1]);
      if (isNaN(participantId)) {
        console.log("conversationId invalide:", conversationId);
        return res.status(400).json({ error: "ID de conversation invalide" });
      }
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          isIndividual: true,
          participants: {
            some: {
              OR: [{ studentId: participantId }, { userId: participantId }],
            },
          },
        },
        include: { participants: true },
      });

      if (!existingConversation) {
        console.log("Conversation introuvable pour participantId:", participantId);
        return res.status(404).json({ error: "Conversation introuvable" });
      }

      // Vérifier que l'utilisateur ou l'étudiant est un participant
      const isParticipant = existingConversation.participants.some(
        p => p.userId === userId || (isSenderStudent && p.studentId === senderStudent.id)
      );
      if (!isParticipant) {
        console.log("Utilisateur non autorisé dans cette conversation:", userId);
        return res.status(403).json({ error: "Vous n'êtes pas autorisé à envoyer un message dans cette conversation" });
      }

      // Vérifier que le destinataire est un participant
      const isRecipientValid = existingConversation.participants.some(
        p => (recipientType === "user" && p.userId === parseInt(recipientId)) ||
             (recipientType === "student" && p.studentId === parseInt(recipientId))
      );
      if (!isRecipientValid) {
        console.log("Destinataire non valide pour cette conversation:", recipientId);
        return res.status(400).json({ error: "Destinataire non valide pour cette conversation" });
      }

      numericConversationId = existingConversation.id;
    } else {
      // Créer une nouvelle conversation
      const newConversation = await prisma.conversation.create({
        data: {
          isIndividual: true,
          participants: {
            create: [
              { userId: userId },
              { studentId: parseInt(recipientId), userId: null }, // Assurer que userId est null si studentId est défini
            ],
          },
        },
      });
      numericConversationId = newConversation.id;
    }

    // Créer le message
    const messageData = {
      content,
      role: isSenderStudent ? "student" : "user",
      userId: isSenderStudent ? null : userId,
      studentId: isSenderStudent ? senderStudent.id : (recipientType === "student" ? parseInt(recipientId) : null),
      conversationId: numericConversationId,
      timestamp: new Date(),
    };
    console.log("Données du message:", messageData);

    const message = await prisma.message.create({ data: messageData });
    console.log("Message créé:", message);

    // Mettre à jour messagesCount si le destinataire est un étudiant
    if (recipientType === "student") {
      await prisma.student.update({
        where: { id: parseInt(recipientId) },
        data: { messagesCount: { increment: 1 } },
      });
      console.log("messagesCount mis à jour pour student:", recipientId);
    }

    res.status(201).json({ ...message, conversationId: `student-${recipientId}` });
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error);
    res.status(500).json({ error: "Erreur serveur lors de l'envoi du message" });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Récupération des conversations pour userId:", userId);

    const senderStudent = await prisma.student.findFirst({ where: { userId } });
    const isSenderStudent = !!senderStudent;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            OR: [
              { userId: userId },
              ...(isSenderStudent ? [{ studentId: senderStudent.id }] : []),
            ],
          },
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            student: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
          },
        },
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          include: {
            user: { select: { firstName: true, lastName: true, avatar: true } },
            student: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } } },
          },
        },
        class: { select: { code: true } },
      },
    });

    console.log("Conversations brutes:", JSON.stringify(conversations, null, 2));

    const formattedConversations = conversations
      .map(conv => {
        // Trouver le participant qui n'est pas l'utilisateur courant
        const otherParticipant = conv.participants.find(p => 
          (p.userId && p.userId !== userId) || 
          (p.studentId && (!isSenderStudent || p.studentId !== senderStudent?.id))
        );

        if (conv.isIndividual && !otherParticipant) {
          console.warn("Conversation individuelle sans participant valide:", JSON.stringify(conv, null, 2));
          return null;
        }

        const participantUser = otherParticipant?.student?.user || otherParticipant?.user;
        if (!participantUser) {
          console.warn("ParticipantUser non trouvé pour la conversation:", JSON.stringify(conv, null, 2));
          return null;
        }

        // Déterminer studentId ou userId en fonction du participant
        let studentId = null;
        let userIdOther = null;
        if (conv.isIndividual) {
          const studentPart = conv.participants.find(p => p.studentId);
          const userPart = conv.participants.find(p => p.userId && p.userId !== userId);
          studentId = studentPart?.studentId || null;
          userIdOther = userPart?.userId || null;
        }

        const conversationData = {
          id: conv.isIndividual ? `student-${studentId || userIdOther || 'unknown'}` : `class-${conv.classId}`,
          name: conv.isIndividual
            ? `${participantUser.firstName} ${participantUser.lastName}`
            : conv.class?.code || "Groupe",
          avatar: participantUser?.avatar || "",
          lastMessage: conv.messages[0]?.content || "",
          time: conv.messages[0]
            ? new Date(conv.messages[0].timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            : "",
          unread: 0,
          isIndividual: conv.isIndividual,
          studentId: studentId,
          userId: userIdOther,
          classId: conv.isIndividual ? null : conv.classId,
        };
        console.log("Conversation formatée:", JSON.stringify(conversationData, null, 2));
        return conversationData;
      })
      .filter(conv => conv !== null && conv.id !== 'student-unknown');

    console.log("Conversations trouvées:", JSON.stringify(formattedConversations, null, 2));
    res.status(200).json(formattedConversations);
  } catch (error) {
    console.error("Erreur lors de la récupération des conversations:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des conversations" });
  }
};

exports.createGroupConversation = async (req, res) => {
  try {
    const { classId, participantIds, title } = req.body;
    const userId = req.user.id;
    
    if (!classId || isNaN(parseInt(classId))) {
      return res.status(400).json({ error: "ID de classe invalide" });
    }
    
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ error: "Liste de participants invalide" });
    }
    
    // Vérifier que l'utilisateur est bien l'enseignant de cette classe
    const classExists = await prisma.class.findFirst({
      where: { 
        id: parseInt(classId),
        teacherId: userId
      }
    });
    
    if (!classExists) {
      return res.status(403).json({ error: "Vous n'êtes pas autorisé à créer une conversation pour cette classe" });
    }
    
    // Créer la conversation de groupe
    const newConversation = await prisma.conversation.create({
      data: {
        isIndividual: false,
        classId: parseInt(classId),
        participants: {
          create: [
            { userId: userId }, // Ajouter l'enseignant
            ...participantIds.map(id => ({ studentId: parseInt(id) })) // Ajouter les étudiants
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: true,
            student: { include: { user: true } }
          }
        },
        class: true
      }
    });
    
    res.status(201).json({
      id: `class-${classId}`,
      name: title || classExists.code,
      isIndividual: false,
      classId: parseInt(classId),
      participants: newConversation.participants.map(p => ({
        id: p.studentId || p.userId,
        name: p.student 
          ? `${p.student.user.firstName} ${p.student.user.lastName}`
          : `${p.user.firstName} ${p.user.lastName}`,
        isTeacher: !!p.userId
      }))
    });
  } catch (error) {
    console.error("Erreur lors de la création de la conversation de groupe:", error);
    res.status(500).json({ error: "Erreur serveur lors de la création de la conversation de groupe" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    console.log("Récupération des messages pour conversationId:", conversationId, "userId:", userId);

    let whereClause = {};
    if (conversationId.startsWith('student-')) {
      const participantId = parseInt(conversationId.split('-')[1]);
      if (isNaN(participantId)) {
        console.log("conversationId invalide:", conversationId);
        return res.status(400).json({ error: "ID de conversation invalide" });
      }
      const conversation = await prisma.conversation.findFirst({
        where: {
          isIndividual: true,
          participants: {
            some: {
              OR: [{ studentId: participantId }, { userId: participantId }],
            },
          },
        },
      });
      if (!conversation) {
        return res.status(404).json({ error: "Conversation introuvable" });
      }
      whereClause = { conversationId: conversation.id };
    } else if (conversationId.startsWith('class-')) {
      const classId = parseInt(conversationId.split('-')[1]);
      if (isNaN(classId)) {
        console.log("conversationId invalide:", conversationId);
        return res.status(400).json({ error: "ID de conversation invalide" });
      }
      const conversation = await prisma.conversation.findFirst({
        where: {
          isIndividual: false,
          classId,
        },
      });
      if (!conversation) {
        return res.status(404).json({ error: "Conversation introuvable" });
      }
      whereClause = { conversationId: conversation.id };
    } else {
      return res.status(400).json({ error: "ID de conversation invalide" });
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { timestamp: 'asc' },
      include: {
        user: { select: { firstName: true, lastName: true, avatar: true } },
        student: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } } },
      },
    });

    const senderStudent = await prisma.student.findFirst({ where: { userId } });
    const isSenderStudent = !!senderStudent;

    const formattedMessages = await Promise.all(
      messages.map(async msg => ({
        id: msg.id,
        sender: msg.user
          ? `${msg.user.firstName} ${msg.user.lastName}`
          : `${msg.student.user.firstName} ${msg.student.user.lastName}`,
        content: msg.content,
        time: new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        isOwn: isSenderStudent
          ? msg.studentId === senderStudent.id
          : msg.userId === userId,
        avatar: msg.user ? msg.user.avatar : msg.student?.user?.avatar,
      }))
    );

    console.log("Messages trouvés:", formattedMessages);
    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error("Erreur lors de la récupération des messages:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des messages" });
  }
};