const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    
    let activeClasses, enrolledStudents, totalMessages, engagementRate;
    
    // Pour les étudiants, on ne montre pas de stats
    if (userRole === 'STUDENT') {
      return res.status(200).json({
        activeClasses: 0,
        enrolledStudents: 0,
        totalMessages: 0,
        engagementRate: 0,
        changes: {
          activeClasses: "0",
          enrolledStudents: "0",
          totalMessages: "0",
          engagementRate: "0%",
        },
      });
    }
    
    // Pour les enseignants/instructeurs, stats de leurs classes seulement
    if (userRole === 'TEACHER' || userRole === 'INSTRUCTOR') {
      const teacherClasses = await prisma.class.findMany({
        where: { teacherId: userId, status: 'ACTIVE' },
        select: { id: true },
      });
      const classIds = teacherClasses.map(c => c.id);
      
      activeClasses = teacherClasses.length;
      enrolledStudents = await prisma.classStudent.count({
        where: { classId: { in: classIds } },
      });
      totalMessages = await prisma.message.count({
        where: {
          classId: { in: classIds },
          timestamp: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
      });
      const students = await prisma.classStudent.findMany({
        where: { classId: { in: classIds } },
        select: { studentId: true },
      });
      const studentIds = students.map(s => s.studentId);
      const avgParticipation = await prisma.student.aggregate({
        _avg: { participation: true },
        where: { id: { in: studentIds } },
      });
      engagementRate = avgParticipation._avg.participation || 0;
    } else {
      // Pour ADMIN, COORDINATOR, INSPECTOR : stats globales
      activeClasses = await prisma.class.count({
        where: { status: 'ACTIVE' },
      });
      enrolledStudents = await prisma.student.count();
      totalMessages = await prisma.message.count({
        where: {
          timestamp: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
      });
      const avgParticipation = await prisma.student.aggregate({
        _avg: { participation: true },
      });
      engagementRate = avgParticipation._avg.participation || 0;
    }

    // Changements récents (exemple basé sur les 7 derniers jours)
    const oneWeekAgo = new Date(new Date().setDate(new Date().getDate() - 7));
    const newClasses = await prisma.class.count({
      where: { createdAt: { gte: oneWeekAgo } },
    });
    const newStudents = await prisma.student.count({
      where: { createdAt: { gte: oneWeekAgo } },
    });
    const newMessages = await prisma.message.count({
      where: { timestamp: { gte: oneWeekAgo } },
    });
    const newEngagement = await prisma.student.aggregate({
      _avg: {
        participation: true,
      },
      where: { updatedAt: { gte: oneWeekAgo } },
    });

    res.status(200).json({
      activeClasses,
      enrolledStudents,
      totalMessages,
      engagementRate: Math.round(engagementRate),
      changes: {
        activeClasses: `${newClasses > 0 ? `+${newClasses}` : '0'} cette semaine`,
        enrolledStudents: `${newStudents > 0 ? `+${newStudents}` : '0'} ce mois`,
        totalMessages: `${newMessages > 0 ? `+${newMessages}` : '0'} aujourd'hui`,
        engagementRate: `${newEngagement._avg.participation ? Math.round(newEngagement._avg.participation - engagementRate) : 0}% ce mois`,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des stats du tableau de bord:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des stats" });
  }
};

exports.getRecentClasses = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    
    let whereClause = {};
    
    // Pour les étudiants, on ne montre pas de classes récentes ici
    if (userRole === 'STUDENT') {
      return res.status(200).json([]);
    }
    
    // Pour les enseignants/instructeurs, leurs classes seulement
    if (userRole === 'TEACHER' || userRole === 'INSTRUCTOR') {
      whereClause = { teacherId: userId };
    }
    // Pour ADMIN, COORDINATOR, INSPECTOR : toutes les classes
    
    const recentClasses = await prisma.class.findMany({
      where: whereClause,
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: { teacher: { select: { firstName: true, lastName: true } } },
    });
    
    res.status(200).json(recentClasses.map(cls => ({
      id: cls.id,
      title: cls.title,
      code: cls.code,
      teacher: `${cls.teacher.firstName} ${cls.teacher.lastName}`,
      lastActivity: cls.lastActivity,
    })));
  } catch (error) {
    console.error("Erreur lors de la récupération des classes récentes:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des classes" });
  }
};