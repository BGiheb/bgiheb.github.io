const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Récupère tous les posts avec leurs auteurs, likes et commentaires
 */
const getAllPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Formater les posts pour inclure le nombre de likes et si l'utilisateur actuel a liké
    const formattedPosts = posts.map((post) => ({
      ...post,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
      isLiked: req.user ? post.likes.some((like) => like.userId === req.user.id) : false,
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Erreur lors de la récupération des posts:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des posts' });
  }
};

/**
 * Crée un nouveau post
 */
const createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ error: 'Le titre et le contenu sont requis' });
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        likes: true,
        comments: true,
      },
    });

    res.status(201).json({
      ...post,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
    });
  } catch (error) {
    console.error('Erreur lors de la création du post:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création du post' });
  }
};

/**
 * Like/Unlike un post
 */
const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Vérifier si le post existe
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    // Vérifier si l'utilisateur a déjà liké
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: parseInt(postId),
          userId: userId,
        },
      },
    });

    if (existingLike) {
      // Retirer le like
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      res.json({ liked: false, message: 'Like retiré' });
    } else {
      // Ajouter le like
      await prisma.like.create({
        data: {
          postId: parseInt(postId),
          userId: userId,
        },
      });
      res.json({ liked: true, message: 'Post liké' });
    }
  } catch (error) {
    console.error('Erreur lors du like/unlike:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Vous avez déjà liké ce post' });
    }
    res.status(500).json({ error: 'Erreur serveur lors du like/unlike' });
  }
};

/**
 * Ajoute un commentaire à un post
 */
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Le contenu du commentaire est requis' });
    }

    // Vérifier si le post existe
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId: parseInt(postId),
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Erreur lors de l\'ajout du commentaire:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'ajout du commentaire' });
  }
};

/**
 * Supprime un post (seulement par l'auteur ou un admin)
 */
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    // Vérifier les permissions
    if (post.authorId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission de supprimer ce post' });
    }

    await prisma.post.delete({
      where: { id: parseInt(postId) },
    });

    res.json({ message: 'Post supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du post:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du post' });
  }
};

/**
 * Supprime un commentaire (seulement par l'auteur ou un admin)
 */
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    // Vérifier les permissions
    if (comment.authorId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission de supprimer ce commentaire' });
    }

    await prisma.comment.delete({
      where: { id: parseInt(commentId) },
    });

    res.json({ message: 'Commentaire supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du commentaire:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du commentaire' });
  }
};

module.exports = {
  getAllPosts,
  createPost,
  toggleLike,
  addComment,
  deletePost,
  deleteComment,
};


