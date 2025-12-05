const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const studentRoutes = require('./routes/studentRoutes');
const dashboardRoutes = require('./routes/dashboardRoute');
const analyticsRoutes = require('./routes/analyticsRoutes');
const messageRoutes = require('./routes/messageRoutes');
const profileRoutes = require('./routes/profileRoutes');
const documentRoutes = require('./routes/documentRoutes');
const passwordRoutes = require('./routes/passwordRoutes');

const errorMiddleware = require('./middleware/errorMiddleware');
const prisma = require('./config/database');

dotenv.config();

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'PORT', 'FRONTEND_URL'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Erreur : Les variables d'environnement suivantes sont manquantes : ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();

// Middlewares de sécurité
app.use(helmet()); 
// CORS: autoriser plusieurs origines (env + ports de dev courants)
const defaultAllowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URLS, // valeurs séparées par des virgules
  'http://localhost:8081',
  'http://localhost:5173',
].filter(Boolean).flatMap((v) => (typeof v === 'string' ? v.split(',') : v));

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser requêtes sans origin (ex: cURL, Postman)
    if (!origin) return callback(null, true);
    if (defaultAllowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
})); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/class", classRoutes);
app.use("/api/student", studentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/meetings", require('./routes/meetingRoutes'));
app.use("/api/rag", require('./routes/ragRoutes'));
app.use("/api/forum", require('./routes/forumRoutes'));
app.use("/api/labs", require('./routes/labRoutes'));
// Gestion des erreurs
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

// Ensure DB connection before starting server
prisma.$connect()
  .then(() => {
    console.log('Connexion à la base de données: OK');
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
      console.log(`CORS autorisés pour : ${defaultAllowedOrigins.join(', ')}`);
    });
  })
  .catch((err) => {
    console.error('Erreur de connexion à la base de données:', err.message);
    process.exit(1);
  });