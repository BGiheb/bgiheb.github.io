const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");
const authMiddleware = require("../middleware/authMiddleware");
const { restrictTo, isTeacherOfClass, isTeacherOrStudentInClass } = require("../middleware/roleMiddleware");

// Routes for teachers/instructors/admin only
router.post("/create", authMiddleware, restrictTo("TEACHER", "ADMIN", "INSTRUCTOR"), classController.createClass);
router.post("/:id/invite-students", authMiddleware, restrictTo("TEACHER", "ADMIN", "INSTRUCTOR"), isTeacherOfClass, classController.inviteStudents);

// Routes for students only
router.post("/request-leave/:classId", authMiddleware, restrictTo("STUDENT"), classController.requestLeaveClass);
router.get("/my-leave-requests", authMiddleware, restrictTo("STUDENT"), classController.getMyLeaveRequests);

// Routes for both teachers and students
router.get("/accept-class-invitation/:token", authMiddleware, classController.acceptClassInvitation);
router.get("/my-classes", authMiddleware, classController.getMyClasses);
router.get("/:id", authMiddleware, isTeacherOrStudentInClass, classController.getClassById);

// Separate route for students to get their classes
router.get("/student-only-classes", authMiddleware, restrictTo("STUDENT"), classController.getMyClasses);

module.exports = router;