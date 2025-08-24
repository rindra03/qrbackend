import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import des routes
import databaseRoutes from './routes/database.js';
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payment.js';

// Import des middlewares
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Configuration des variables d'environnement
dotenv.config();

const app = express();

// Middlewares de sécurité et logging
app.use(helmet()); // Sécurité des headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined')); // Logging des requêtes

// Middlewares pour parser les requêtes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API est fonctionnelle',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Routes API avec versioning
const API_VERSION = process.env.API_VERSION || 'v1';
app.use(`/api/${API_VERSION}/db`, databaseRoutes);
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/payment`, paymentRoutes);

// Routes pour compatibilité avec ancien système (optionnel)
app.use('/tables', databaseRoutes);
app.use('/table', databaseRoutes);
app.use('/login', authRoutes); // Route legacy pour /logs
app.use('/verify-payment', paymentRoutes); // Route legacy pour /verify-payment

// Middleware pour les routes non trouvées
app.use(notFound);

// Middleware de gestion d'erreurs (doit être en dernier)
app.use(errorHandler);

export default app;