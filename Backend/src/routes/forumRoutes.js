const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const authMiddleware = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.get('/posts', authMiddleware, forumController.getAllPosts);
router.post('/posts', authMiddleware, forumController.createPost);
router.post('/posts/:postId/like', authMiddleware, forumController.toggleLike);
router.post('/posts/:postId/comments', authMiddleware, forumController.addComment);
router.delete('/posts/:postId', authMiddleware, forumController.deletePost);
router.delete('/comments/:commentId', authMiddleware, forumController.deleteComment);

module.exports = router;


