// Middleware to restrict access based on user roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Non authentifié" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource" 
      });
    }
    
    next();
  };
};

// Middleware to check if user is a teacher of a specific class
const isTeacherOfClass = async (req, res, next) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const classId = req.params.id || req.params.classId || req.body.classId;
    
    if (!classId) {
      return res.status(400).json({ error: "ID de classe manquant" });
    }
    
    const classExists = await prisma.class.findFirst({
      where: {
        id: parseInt(classId),
        teacherId: req.user.id
      }
    });
    
    if (!classExists) {
      return res.status(403).json({ 
        error: "Vous n'êtes pas l'enseignant de cette classe" 
      });
    }
    
    next();
  } catch (error) {
    console.error("Erreur lors de la vérification des permissions:", error);
    res.status(500).json({ error: "Erreur serveur lors de la vérification des permissions" });
  }
};

// Middleware to check if user is a student in a specific class
const isStudentInClass = async (req, res, next) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const classId = req.params.classId || req.body.classId;
    
    if (!classId) {
      return res.status(400).json({ error: "ID de classe manquant" });
    }
    
    const student = await prisma.student.findFirst({
      where: { userId: req.user.id }
    });
    
    if (!student) {
      return res.status(403).json({ error: "Vous n'êtes pas un étudiant" });
    }
    
    const isEnrolled = await prisma.classStudent.findFirst({
      where: {
        classId: parseInt(classId),
        studentId: student.id
      }
    });
    
    if (!isEnrolled) {
      return res.status(403).json({ 
        error: "Vous n'êtes pas inscrit à cette classe" 
      });
    }
    
    req.studentId = student.id;
    next();
  } catch (error) {
    console.error("Erreur lors de la vérification des permissions:", error);
    res.status(500).json({ error: "Erreur serveur lors de la vérification des permissions" });
  }
};

// Middleware to check if user is either a teacher of the class or a student in the class
const isTeacherOrStudentInClass = async (req, res, next) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    // Essayer plusieurs emplacements pour classId
    const classId = req.params.id || req.params.classId || req.body.classId;
    
    if (!classId) {
      return res.status(400).json({ error: "ID de classe manquant" });
    }
    
    const numericClassId = parseInt(classId);
    if (isNaN(numericClassId)) {
      return res.status(400).json({ error: "ID de classe invalide" });
    }
    
    // Check if teacher
    const isTeacher = await prisma.class.findFirst({
      where: {
        id: numericClassId,
        teacherId: req.user.id
      }
    });
    
    if (isTeacher) {
      req.isTeacher = true;
      req.classId = numericClassId;
      return next();
    }
    
    // Check if student
    const student = await prisma.student.findFirst({
      where: { userId: req.user.id }
    });
    
    if (!student) {
      return res.status(403).json({ 
        error: "Vous n'avez pas accès à cette classe" 
      });
    }
    
    const isEnrolled = await prisma.classStudent.findFirst({
      where: {
        classId: numericClassId,
        studentId: student.id
      }
    });
    
    if (!isEnrolled) {
      return res.status(403).json({ 
        error: "Vous n'avez pas accès à cette classe" 
      });
    }
    
    req.isTeacher = false;
    req.studentId = student.id;
    req.classId = numericClassId;
    next();
  } catch (error) {
    console.error("Erreur lors de la vérification des permissions:", error);
    res.status(500).json({ error: "Erreur serveur lors de la vérification des permissions" });
  }
};

module.exports = {
  restrictTo,
  isTeacherOfClass,
  isStudentInClass,
  isTeacherOrStudentInClass
};