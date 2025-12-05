// Système de permissions basé sur les rôles
// Définit ce que chaque rôle peut voir et faire

const PERMISSIONS = {
  // ADMIN : Accès complet à toutes les fonctionnalités
  ADMIN: {
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewAllClasses: true,
    canCreateClasses: true,
    canEditAllClasses: true,
    canDeleteClasses: true,
    canViewAllStudents: true,
    canInviteStudents: true,
    canViewAnalytics: true,
    canViewAllAnalytics: true,
    canUploadDocuments: true,
    canDeleteDocuments: true,
    canCreateMeetings: true,
    canDeleteMeetings: true,
    canSendMessages: true,
    canCreateGroupConversations: true,
    canViewDashboard: true,
  },

  // TEACHER : Gestion de ses classes, étudiants, analytics
  TEACHER: {
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAllClasses: false,
    canCreateClasses: true,
    canEditAllClasses: false,
    canDeleteClasses: false,
    canViewAllStudents: true,
    canInviteStudents: true,
    canViewAnalytics: true,
    canViewAllAnalytics: false,
    canUploadDocuments: true,
    canDeleteDocuments: true,
    canCreateMeetings: true,
    canDeleteMeetings: true,
    canSendMessages: true,
    canCreateGroupConversations: true,
    canViewDashboard: true,
  },

  // INSTRUCTOR : Similaire à TEACHER
  INSTRUCTOR: {
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAllClasses: false,
    canCreateClasses: true,
    canEditAllClasses: false,
    canDeleteClasses: false,
    canViewAllStudents: true,
    canInviteStudents: true,
    canViewAnalytics: true,
    canViewAllAnalytics: false,
    canUploadDocuments: true,
    canDeleteDocuments: true,
    canCreateMeetings: true,
    canDeleteMeetings: true,
    canSendMessages: true,
    canCreateGroupConversations: true,
    canViewDashboard: true,
  },

  // COORDINATOR : Gestion pédagogique, voir toutes les classes, analytics
  COORDINATOR: {
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAllClasses: true,
    canCreateClasses: false,
    canEditAllClasses: false,
    canDeleteClasses: false,
    canViewAllStudents: true,
    canInviteStudents: false,
    canViewAnalytics: true,
    canViewAllAnalytics: true,
    canUploadDocuments: false,
    canDeleteDocuments: false,
    canCreateMeetings: false,
    canDeleteMeetings: false,
    canSendMessages: true,
    canCreateGroupConversations: false,
    canViewDashboard: true,
  },

  // INSPECTOR : Lecture seule, voir classes et analytics
  INSPECTOR: {
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAllClasses: true,
    canCreateClasses: false,
    canEditAllClasses: false,
    canDeleteClasses: false,
    canViewAllStudents: true,
    canInviteStudents: false,
    canViewAnalytics: true,
    canViewAllAnalytics: true,
    canUploadDocuments: false,
    canDeleteDocuments: false,
    canCreateMeetings: false,
    canDeleteMeetings: false,
    canSendMessages: false,
    canCreateGroupConversations: false,
    canViewDashboard: true,
  },

  // STUDENT : Voir ses classes, participer, pas de création
  STUDENT: {
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAllClasses: false,
    canCreateClasses: false,
    canEditAllClasses: false,
    canDeleteClasses: false,
    canViewAllStudents: false,
    canInviteStudents: false,
    canViewAnalytics: false,
    canViewAllAnalytics: false,
    canUploadDocuments: false,
    canDeleteDocuments: false,
    canCreateMeetings: false,
    canDeleteMeetings: false,
    canSendMessages: true,
    canCreateGroupConversations: false,
    canViewDashboard: true,
  },
};

// Fonction pour vérifier une permission
const hasPermission = (role, permission) => {
  if (!role || !PERMISSIONS[role]) {
    return false;
  }
  return PERMISSIONS[role][permission] === true;
};

// Fonction pour obtenir toutes les permissions d'un rôle
const getRolePermissions = (role) => {
  return PERMISSIONS[role] || {};
};

// Middleware pour vérifier une permission
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        error: "Vous n'avez pas les permissions nécessaires pour cette action",
      });
    }

    next();
  };
};

module.exports = {
  PERMISSIONS,
  hasPermission,
  getRolePermissions,
  checkPermission,
};

