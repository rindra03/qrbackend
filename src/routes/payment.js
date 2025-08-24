import express from 'express';
import { PaymentController } from '../controllers/paymentController.js';

const router = express.Router();

// Routes de vérification et validation des paiements
router.post('/check-eligibility', PaymentController.checkEligibility);
router.post('/validate', PaymentController.validateStudent);
router.get('/status/:idetu', PaymentController.getStudentStatus);
router.get('/validated', PaymentController.getValidatedStudents);

// Route legacy pour compatibilité
router.post('/verify', PaymentController.verifyPaymentLegacy);

export default router;