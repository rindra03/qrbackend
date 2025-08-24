import { PaymentVerificationService } from '../services/PaymentVerificationService.js';

export class PaymentController {

  /**
   * Vérifier l'éligibilité ET valider automatiquement un étudiant
   * 
   */
  // À ajouter dans votre PaymentController existant

/**
 * POST /api/v1/payment/check-scan-status
 * Vérifie si un QR code (idetu) a déjà été scanné/validé
 */
static async checkScanStatus(req, res) {
  try {
    const { idetu } = req.body;

    if (!idetu) {
      return res.status(400).json({
        success: false,
        message: "ID étudiant requis",
        data: null
      });
    }

    console.log(`🔍 VÉRIFICATION SCAN STATUS - ID: ${idetu}`);

    const result = await PaymentVerificationService.checkIfAlreadyScanned(idetu);

    if (result.alreadyScanned) {
      console.log(`🚫 QR CODE DÉJÀ SCANNÉ - ID: ${idetu}`);
      return res.status(409).json(result); // 409 Conflict
    }

    console.log(`✅ QR CODE PEUT ÊTRE SCANNÉ - ID: ${idetu}`);
    return res.status(200).json(result);

  } catch (error) {
    console.error(`❌ ERREUR CHECK SCAN STATUS - ID ${req.body?.idetu}:`, error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
      alreadyScanned: false
    });
  }
}

// Mise à jour de votre méthode PaymentController.checkAndValidate existante

/**
 * POST /api/v1/payment/check-eligibility
 * Vérifie l'éligibilité ET valide automatiquement un étudiant
 */
static async checkAndValidate(req, res) {
  try {
    const { idetu } = req.body;

    if (!idetu) {
      return res.status(400).json({
        success: false,
        message: "ID étudiant requis",
        data: null
      });
    }

    console.log(`🔍 VÉRIFICATION ÉLIGIBILITÉ - ID: ${idetu}`);

    const result = await PaymentVerificationService.checkAndValidateStudent(idetu);

    if (result.success) {
      console.log(`✅ VALIDATION AUTOMATIQUE RÉUSSIE - ID: ${idetu}`);
      return res.status(200).json(result);
    } else {
      if (result.alreadyScanned) {
        console.log(`🚫 DÉJÀ VALIDÉ - ID: ${idetu}: ${result.message}`);
        return res.status(409).json(result); // 409 Conflict pour déjà scanné
      } else {
        console.log(`❌ VALIDATION AUTOMATIQUE ÉCHOUÉE - ID ${idetu}: ${result.message}`);
        return res.status(400).json(result);
      }
    }

  } catch (error) {
    console.error(`❌ ERREUR VALIDATION AUTOMATIQUE - ID ${req.body?.idetu}:`, error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message
    });
  }
}

  /**
   * Statut d'un étudiant
   */
  static async getStudentStatus(req, res) {
    const { idetu } = req.params;

    if (!idetu) {
      return res.status(400).json({
        success: false,
        message: "ID étudiant requis",
        error: "Paramètre manquant"
      });
    }

    try {
      const result = await PaymentVerificationService.getStudentStatus(idetu);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      console.error("🚨 Erreur récupération statut:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération du statut",
        error: error.message
      });
    }
  }

  /**
   * Liste des étudiants validés
   */
  static async getValidatedStudents(req, res) {
    const { limit = 50, offset = 0 } = req.query;

    try {
      const result = await PaymentVerificationService.getValidatedStudents(limit, offset);
      res.status(200).json(result);
    } catch (error) {
      console.error("🚨 Erreur récupération étudiants validés:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des étudiants validés",
        error: error.message
      });
    }
  }

  /**
   * Route legacy pour compatibilité
   */
  static async verifyPaymentLegacy(req, res) {
    const { idetu } = req.body;

    if (!idetu) {
      return res.status(400).json({
        success: false,
        message: "ID étudiant requis",
        error: "Paramètre manquant"
      });
    }

    try {
      const result = await PaymentVerificationService.checkAndValidateStudent(idetu);

      if (result.success) {
        res.status(200).json({
          message: "Paiement vérifié",
          nom: result.data.nom,
          prenom: result.data.prenom,
          montant: result.data.montant,
        });
      } else {
        res.status(404).json({ message: result.message });
      }

    } catch (error) {
      console.error("🚨 Erreur vérification legacy:", error);
      res.status(500).json({ 
        message: "Erreur serveur", 
        error: error.message 
      });
    }
  }
}
