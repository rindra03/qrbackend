import express from 'express';
import { PaymentController } from '../controllers/paymentController.js';

const router = express.Router();

// --- Routes principales ---
// NOUVELLE ROUTE : Vérifier si QR code déjà scanné
router.post('/check-scan-status', PaymentController.checkScanStatus);

// Vérifier l'éligibilité ET valider automatiquement après le scan
router.post('/check-eligibility', PaymentController.checkAndValidate);

// Obtenir le statut d'un étudiant
router.get('/status/:idetu', PaymentController.getStudentStatus);

// Obtenir la liste des étudiants validés
router.get('/validated', PaymentController.getValidatedStudents);

// --- Routes legacy pour compatibilité avec anciens systèmes ---
router.post('/verify', PaymentController.verifyPaymentLegacy);

export default router;