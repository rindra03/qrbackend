import { PaymentVerificationService } from '../services/PaymentVerificationService.js';

export class PaymentController {

  /**
   * Vérifier l'éligibilité d'un étudiant (sans le valider)
   */
  static async checkEligibility(req, res) {
    const { idetu } = req.body;

    if (!idetu) {
      return res.status(400).json({
        success: false,
        message: "ID étudiant requis",
        error: "Paramètre manquant"
      });
    }

    try {
      const result = await PaymentVerificationService.checkStudentEligibility(idetu);
      
      // Affichage console détaillé
      if (result.success) {
        console.log(`🎯 ÉLIGIBILITÉ - ${result.data.nom} ${result.data.prenom} (${idetu}): ÉLIGIBLE`);
        console.log(`   💰 Montant: ${result.data.montant} Ar`);
        console.log(`   ✅ Statut: Non validé (peut être validé)`);
      } else {
        console.log(`🚫 ÉLIGIBILITÉ - ID ${idetu}: NON ÉLIGIBLE`);
        console.log(`   ❌ Raison: ${result.message}`);
      }

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);

    } catch (error) {
      console.error("🚨 Erreur vérification éligibilité:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la vérification",
        error: error.message
      });
    }
  }

  /**
   * Valider un étudiant (scanner et validation)
   */
  static async validateStudent(req, res) {
    const { idetu } = req.body;

    if (!idetu) {
      return res.status(400).json({
        success: false,
        message: "ID étudiant requis",
        error: "Paramètre manquant"
      });
    }

    try {
      const result = await PaymentVerificationService.validateStudent(idetu);
      
      // Affichage console détaillé
      if (result.success) {
        console.log(`🏆 VALIDATION RÉUSSIE - ${result.data.nom} ${result.data.prenom} (${idetu})`);
        console.log(`   💰 Montant: ${result.data.montant} Ar`);
        console.log(`   ✅ Statut: VALIDÉ`);
        console.log(`   📅 Validé le: ${result.data.validatedAt}`);
      } else {
        console.log(`❌ VALIDATION ÉCHOUÉE - ID ${idetu}: ${result.message}`);
      }

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);

    } catch (error) {
      console.error("🚨 Erreur validation étudiant:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la validation",
        error: error.message
      });
    }
  }

  /**
   * Obtenir le statut d'un étudiant
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
      
      // Affichage console
      if (result.success) {
        const student = result.data;
        console.log(`📊 STATUT - ${student.nom} ${student.prenom} (${idetu})`);
        console.log(`   💰 Montant: ${student.montant} Ar`);
        console.log(`   ✅ Validé: ${student.isValidated ? 'OUI' : 'NON'}`);
        console.log(`   🎯 Peut être validé: ${student.canBeValidated ? 'OUI' : 'NON'}`);
        if (student.validatedAt) {
          console.log(`   📅 Validé le: ${student.validatedAt}`);
        }
      }

      const statusCode = result.success ? 200 : 404;
      res.status(statusCode).json(result);

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
   * Obtenir la liste des étudiants validés
   */
  static async getValidatedStudents(req, res) {
    const { limit = 50, offset = 0 } = req.query;

    try {
      const result = await PaymentVerificationService.getValidatedStudents(limit, offset);
      
      // Affichage console
      console.log(`📋 ÉTUDIANTS VALIDÉS - Total: ${result.data.total}, Affichés: ${result.data.students.length}`);
      
      if (result.data.students.length > 0) {
        console.table(result.data.students.map(s => ({
          ID: s.idetu,
          Nom: s.nom,
          Prénom: s.prenom,
          Montant: `${s.montant} Ar`,
          ValidéLe: s.validated_at ? new Date(s.validated_at).toLocaleDateString() : '-'
        })));
      }

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

    try {
      const result = await PaymentVerificationService.checkStudentEligibility(idetu);
      
      if (result.success) {
        res.status(200).json({
          message: "Paiement vérifié",
          nom: result.data.nom,
          prenom: result.data.prenom,
          montant: result.data.montant,
        });
      } else {
        res.status(404).json({ 
          message: result.message 
        });
      }

    } catch (error) {
      res.status(500).json({ 
        message: "Erreur serveur", 
        error: error.message 
      });
    }
  }
}