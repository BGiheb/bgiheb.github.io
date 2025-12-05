const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Envoyer un message à un enseignant
exports.sendMessageToTeacher = async (req, res) => {
  try {
    const { studentId } = req;
    const { teacherId, content } = req.body;

    if (!teacherId || !content) {
      return res.status(400).json({ error: 'Veuillez fournir l\'ID de l\'enseignant et le contenu du message' });
    }

    // Vérifier que l'enseignant existe
    const teacher = await prisma.user.findUnique({
      where: { id: parseInt(teacherId), role: 'TEACHER' }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Enseignant non trouvé' });
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: parseInt(studentId),
        recipientId: parseInt(teacherId),
        isRead: false
      }
    });

    return res.status(201).json(message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
};

// Envoyer un message à un étudiant
exports.sendMessageToStudent = async (req, res) => {
  try {
    const { teacherId } = req;
    const { studentId, content } = req.body;

    if (!studentId || !content) {
      return res.status(400).json({ error: 'Veuillez fournir l\'ID de l\'étudiant et le contenu du message' });
    }

    // Vérifier que l'étudiant existe
    const student = await prisma.student.findUnique({
      where: { id: parseInt(studentId) }
    });

    if (!student) {
      return res.status(404).json({ error: 'Étudiant non trouvé' });
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: parseInt(teacherId),
        recipientId: student.userId,
        isRead: false
      }
    });

    return res.status(201).json(message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
};

// Récupérer les messages d'une conversation
exports.getConversation = async (req, res) => {
  try {
    const userId = parseInt(req.userId);
    const { otherUserId } = req.params;

    if (!otherUserId) {
      return res.status(400).json({ error: 'Veuillez fournir l\'ID de l\'autre utilisateur' });
    }

    // Récupérer les messages de la conversation
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: userId,
            recipientId: parseInt(otherUserId)
          },
          {
            senderId: parseInt(otherUserId),
            recipientId: userId
          }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Marquer les messages non lus comme lus
    await prisma.message.updateMany({
      where: {
        senderId: parseInt(otherUserId),
        recipientId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return res.status(200).json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
  }
};

// Récupérer la liste des conversations
exports.getConversations = async (req, res) => {
  try {
    const userId = parseInt(req.userId);

    // Récupérer tous les messages envoyés ou reçus par l'utilisateur
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { recipientId: userId }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            avatar: true
          }
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            avatar: true
          }
        }
      }
    });

    // Regrouper les messages par conversation
    const conversations = {};
    messages.forEach(message => {
      const otherUser = message.senderId === userId ? message.recipient : message.sender;
      const otherUserId = otherUser.id;

      if (!conversations[otherUserId]) {
        conversations[otherUserId] = {
          user: otherUser,
          lastMessage: message,
          unreadCount: message.recipientId === userId && !message.isRead ? 1 : 0
        };
      } else if (message.createdAt > conversations[otherUserId].lastMessage.createdAt) {
        conversations[otherUserId].lastMessage = message;
        if (message.recipientId === userId && !message.isRead) {
          conversations[otherUserId].unreadCount += 1;
        }
      } else if (message.recipientId === userId && !message.isRead) {
        conversations[otherUserId].unreadCount += 1;
      }
    });

    // Convertir l'objet en tableau et trier par date du dernier message
    const conversationsList = Object.values(conversations).sort((a, b) => 
      b.lastMessage.createdAt - a.lastMessage.createdAt
    );

    return res.status(200).json(conversationsList);
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des conversations' });
  }
};

// Marquer un message comme lu
exports.markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = parseInt(req.userId);

    // Vérifier que le message existe et est destiné à l'utilisateur
    const message = await prisma.message.findUnique({
      where: { id: parseInt(messageId) }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    if (message.recipientId !== userId) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à marquer ce message comme lu' });
    }

    // Marquer le message comme lu
    await prisma.message.update({
      where: { id: parseInt(messageId) },
      data: { isRead: true }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erreur lors du marquage du message comme lu:', error);
    return res.status(500).json({ error: 'Erreur lors du marquage du message comme lu' });
  }
};