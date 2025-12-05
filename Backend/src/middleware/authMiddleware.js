const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extrait le token après "Bearer"
  console.log("Token reçu:", token);

  if (!token) {
    console.log("Aucun token fourni");
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token décodé:", decoded);
    // Ajustez la structure pour correspondre à ce que createClass attend
    req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
    console.log("req.user défini:", req.user);
    next();
  } catch (error) {
    console.error('Erreur de vérification du token:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;