const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getClassAnalytics = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;
    
    // Verify teacher has access to this class
    const classExists = await prisma.class.findFirst({
      where: { 
        id: parseInt(classId),
        teacherId: userId
      }
    });
    
    if (!classExists) {
      return res.status(403).json({ error: "Vous n'êtes pas autorisé à accéder aux analyses de cette classe" });
    }
    
    // Get student participation data
    const students = await prisma.classStudent.findMany({
      where: { classId: parseInt(classId) },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            messages: {
              where: { classId: parseInt(classId) },
              select: { id: true }
            }
          }
        }
      }
    });
    
    // Format student data
    const studentData = students.map(cs => ({
      id: cs.student.id,
      name: `${cs.student.user.firstName} ${cs.student.user.lastName}`,
      avatar: cs.student.user.avatar,
      participation: cs.student.participation,
      messagesCount: cs.student.messages.length,
      lastActive: cs.student.lastActive
    }));
    
    // Get message activity over time
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    
    const messageActivity = await prisma.message.groupBy({
      by: ['timestamp'],
      where: { 
        classId: parseInt(classId),
        timestamp: { gte: startDate }
      },
      _count: { id: true }
    });
    
    // Format message activity by day
    const activityByDay = {};
    messageActivity.forEach(item => {
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      activityByDay[date] = (activityByDay[date] || 0) + item._count.id;
    });
    
    const formattedActivity = Object.keys(activityByDay).map(date => ({
      date,
      count: activityByDay[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get document analytics
    const documents = await prisma.document.findMany({
      where: { classId: parseInt(classId) },
      orderBy: { downloads: 'desc' },
      take: 5
    });
    
    const documentAnalytics = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      downloads: doc.downloads,
      uploadedAt: doc.uploadedAt
    }));
    
    res.status(200).json({
      classInfo: {
        id: classExists.id,
        title: classExists.title,
        code: classExists.code,
        studentsCount: classExists.studentsCount,
        lastActivity: classExists.lastActivity
      },
      studentPerformance: studentData,
      messageActivity: formattedActivity,
      documentAnalytics: documentAnalytics
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des analyses de classe:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des analyses de classe" });
  }
};