const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAnalyticsData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get classes taught by this teacher
    const teacherClasses = await prisma.class.findMany({
      where: { teacherId: userId },
      select: { id: true }
    });
    
    const classIds = teacherClasses.map(c => c.id);
    
    // KPI Cards - Filtered by teacher's classes
    const activeStudents = await prisma.classStudent.count({ 
      where: { 
        classId: { in: classIds },
        student: { status: 'ACTIVE' }
      } 
    });
    
    const totalMessages = await prisma.message.count({
      where: {
        classId: { in: classIds },
        timestamp: { gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) },
      },
    });
    
    const studentsInClasses = await prisma.classStudent.findMany({
      where: { classId: { in: classIds } },
      select: { studentId: true }
    });
    
    const studentIds = studentsInClasses.map(s => s.studentId);
    
    const avgEngagement = await prisma.student.aggregate({
      where: { id: { in: studentIds } },
      _avg: { participation: true },
    });

    // Calcul des changements (exemple simple : +10% pour les étudiants actifs, basé sur une comparaison mois précédent)
    const prevActiveStudents = await prisma.student.count({
      where: { 
        status: 'ACTIVE',
        updatedAt: { lt: new Date(new Date().setMonth(new Date().getMonth() - 1)) }
      },
    });
    const studentsChange = prevActiveStudents > 0 ? `+${Math.round(((activeStudents - prevActiveStudents) / prevActiveStudents) * 100)}%` : "+0%";

    const prevTotalMessages = await prisma.message.count({
      where: {
        timestamp: { gte: new Date(new Date().setMonth(new Date().getMonth() - 2)), lt: new Date(new Date().setMonth(new Date().getMonth() - 1)) },
      },
    });
    const messagesChange = prevTotalMessages > 0 ? `+${Math.round(((totalMessages - prevTotalMessages) / prevTotalMessages) * 100)}%` : "+0%";

    const changes = {
      activeStudents: studentsChange,
      totalMessages: messagesChange,
      avgResponseTime: "-5%", // Valeur statique pour l'instant, car pas de champ role pour assistant
      avgEngagement: "+3%",
    };

    // Engagement Timeline (dernière semaine) - Simplifié sans requête brute
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const engagementDataRaw = await prisma.message.groupBy({
      by: ['timestamp'],
      where: { timestamp: { gte: startDate } },
      _count: { id: true },
    });
    const formattedEngagement = [
      { name: "Lun", messages: 0, students: 0, responses: 0 },
      { name: "Mar", messages: 0, students: 0, responses: 0 },
      { name: "Mer", messages: 0, students: 0, responses: 0 },
      { name: "Jeu", messages: 0, students: 0, responses: 0 },
      { name: "Ven", messages: 0, students: 0, responses: 0 },
      { name: "Sam", messages: 0, students: 0, responses: 0 },
      { name: "Dim", messages: 0, students: 0, responses: 0 },
    ];
    engagementDataRaw.forEach((d) => {
      const dayOfWeek = new Date(d.timestamp).getDay();
      const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      const day = dayNames[dayOfWeek];
      const entry = formattedEngagement.find(e => e.name === day);
      if (entry) {
        entry.messages += d._count.id;
      }
    });

    // Class Performance - Utilisation de champs existants
    const classData = await prisma.class.findMany({
      take: 4,
      include: { 
        students: { include: { student: { select: { participation: true } } } },
        messages: true 
      },
      orderBy: { studentsCount: 'desc' },
    });
    const formattedClassData = classData.map(cls => ({
      name: cls.code,
      students: cls.studentsCount,
      engagement: cls.students.reduce((sum, s) => sum + (s.student.participation || 0), 0) / (cls.students.length || 1),
      messages: cls.messages.length,
    }));

    // Participation Distribution - Simplifié
    const participationStats = await prisma.student.groupBy({
      by: ['participation'],
      _count: { id: true },
    });
    const totalStudents = await prisma.student.count();
    const participationData = [
      { name: "Très actif", value: 0, color: "hsl(var(--success))" },
      { name: "Actif", value: 0, color: "hsl(var(--primary))" },
      { name: "Modéré", value: 0, color: "hsl(var(--warning))" },
      { name: "Faible", value: 0, color: "hsl(var(--destructive))" },
    ];
    participationStats.forEach(stat => {
      const participation = stat.participation || 0;
      if (participation >= 90) participationData[0].value += (stat._count.id / totalStudents) * 100;
      else if (participation >= 70) participationData[1].value += (stat._count.id / totalStudents) * 100;
      else if (participation >= 50) participationData[2].value += (stat._count.id / totalStudents) * 100;
      else participationData[3].value += (stat._count.id / totalStudents) * 100;
    });

    res.status(200).json({
      kpis: {
        activeStudents,
        totalMessages,
        avgResponseTime: "0m 0s", // Valeur par défaut, car pas de données pour assistant
        avgEngagement: Math.round(avgEngagement._avg.participation || 0),
        changes,
      },
      engagementData: formattedEngagement,
      classData: formattedClassData,
      participationData,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des données d'analyse:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des données d'analyse" });
  }
};