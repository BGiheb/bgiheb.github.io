const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middleware/authMiddleware');
const { restrictTo, isTeacherOfClass, isTeacherOrStudentInClass } = require('../middleware/roleMiddleware');

// Create a new meeting (teachers/instructors/admin only, must be teacher of the class)
router.post('/create', authMiddleware, restrictTo('TEACHER', 'ADMIN', 'INSTRUCTOR'), isTeacherOfClass, async (req, res) => {
  try {
    const { classId, title, description, startTime, duration } = req.body;
    const userId = req.user.id;

    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        duration: parseInt(duration),
        createdById: userId,
        classId: parseInt(classId),
      },
    });

    res.status(201).json(meeting);
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// Get meetings for a class (teacher of class or enrolled student)
router.get('/class/:classId', authMiddleware, isTeacherOrStudentInClass, async (req, res) => {
  try {
    const { classId } = req.params;
    
    const meetings = await prisma.meeting.findMany({
      where: { classId: parseInt(classId) },
      orderBy: { startTime: 'asc' },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    res.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Get upcoming meetings for a user
router.get('/upcoming', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all classes the user is enrolled in (as student) or teaches (as teacher)
    const studentClasses = await prisma.classStudent.findMany({
      where: { student: { userId } },
      select: { classId: true },
    });
    
    const teacherClasses = await prisma.class.findMany({
      where: { teacherId: userId },
      select: { id: true },
    });
    
    const classIds = [
      ...studentClasses.map(sc => sc.classId),
      ...teacherClasses.map(tc => tc.id)
    ];
    
    // Get upcoming meetings for these classes
    const meetings = await prisma.meeting.findMany({
      where: {
        classId: { in: classIds },
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
      include: {
        class: {
          select: {
            id: true,
            title: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    res.json(meetings);
  } catch (error) {
    console.error('Error fetching upcoming meetings:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming meetings' });
  }
});

// Delete a meeting
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if the user is the creator of the meeting or a teacher of the class
    const meeting = await prisma.meeting.findUnique({
      where: { id: parseInt(id) },
      include: {
        class: {
          select: {
            teacherId: true,
          },
        },
      },
    });
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    if (meeting.createdById !== userId && meeting.class.teacherId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this meeting' });
    }
    
    await prisma.meeting.delete({
      where: { id: parseInt(id) },
    });
    
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

module.exports = router;