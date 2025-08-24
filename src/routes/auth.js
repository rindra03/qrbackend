import express from 'express';
import { AuthController } from '../controllers/authController.js';

const router = express.Router();

// Routes d'authentification
router.post('/login', AuthController.login);
router.post('/create-admin', AuthController.createAdmin);
router.get('/status', AuthController.status);

export default router;