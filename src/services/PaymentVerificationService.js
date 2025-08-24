import { sequelize } from "../config/database.js";

export class PaymentVerificationService {

  static MONTANT_ATTENDU = 60000;

  /**
   * Vérifie si un étudiant peut être validé
   */
  static async checkStudentEligibility(idetu) {
    try {
      const [results] = await sequelize.query(
        `
        SELECT 
          e.idetu, 
          e.nom, 
          e.prenom, 
          p.montant,
          COALESCE(e.validation, 0) as validation
        FROM paiement p
        JOIN etudiant e ON e.idetu = p.idetu
        WHERE p.idetu = :idetu
        `,
        { replacements: { idetu } }
      );

      if (results.length === 0) {
        return {
          success: false,
          message: "Étudiant non trouvé ou aucun paiement enregistré",
          data: null,
        };
      }

      const student = results[0];

      if (student.validation === 1) {
        return {
          success: false,
          message: "QR Code déjà utilisé. Étudiant déjà validé.",
          data: student,
        };
      }

      if (student.montant < this.MONTANT_ATTENDU) {
        return {
          success: false,
          message: `Montant insuffisant : attendu ${this.MONTANT_ATTENDU} Ar, trouvé ${student.montant} Ar`,
          data: student,
        };
      }

      return {
        success: true,
        message: "Étudiant éligible pour validation",
        data: student,
      };

    } catch (error) {
      console.error("❌ Erreur checkStudentEligibility:", error);
      throw new Error(`Erreur de vérification: ${error.message}`);
    }
  }

  /**
   * Valide un étudiant (change validation à 1 si non encore validé)
   */
  static async validateStudent(idetu) {
    try {
      console.log(`🎯 Tentative de validation pour l'étudiant: ${idetu}`);

      const eligibility = await this.checkStudentEligibility(idetu);
      if (!eligibility.success) return eligibility;

      // Validation atomique : seulement si non déjà validé
      const [result] = await sequelize.query(
        `
        UPDATE etudiant 
        SET validation = 1 
        WHERE idetu = :idetu AND validation = 0
        `,
        { replacements: { idetu } }
      );

      if (result.affectedRows === 0 || result.rowCount === 0) {
        return {
          success: false,
          message: "QR Code déjà scanné ou mise à jour impossible",
        };
      }

      const student = eligibility.data;

      return {
        success: true,
        message: "Étudiant validé avec succès",
        data: {
          idetu: student.idetu,
          nom: student.nom,
          prenom: student.prenom,
          montant: student.montant,
          validation: 1,
          validatedAt: new Date().toISOString(),
        },
      };

    } catch (error) {
      console.error("❌ Erreur validateStudent:", error);
      throw new Error(`Erreur de validation: ${error.message}`);
    }
  }

  /**
   * Statut d'un étudiant
   */
  static async getStudentStatus(idetu) {
    try {
      const [results] = await sequelize.query(
        `
        SELECT 
          e.idetu, 
          e.nom, 
          e.prenom, 
          p.montant,
          COALESCE(e.validation, 0) as validation
        FROM paiement p
        JOIN etudiant e ON e.idetu = p.idetu
        WHERE p.idetu = :idetu
        `,
        { replacements: { idetu } }
      );

      if (results.length === 0) {
        return {
          success: false,
          message: "Étudiant non trouvé",
          data: null,
        };
      }

      const student = results[0];

      return {
        success: true,
        message: "Statut récupéré",
        data: {
          ...student,
          isValidated: student.validation === 1,
          canBeValidated: student.validation === 0 && student.montant >= this.MONTANT_ATTENDU,
        },
      };

    } catch (error) {
      console.error("❌ Erreur getStudentStatus:", error);
      throw new Error(`Erreur de récupération: ${error.message}`);
    }
  }

  /**
   * Tous les étudiants validés
   */
  static async getValidatedStudents(limit = 50, offset = 0) {
    try {
      const [results] = await sequelize.query(
        `
        SELECT 
          e.idetu, 
          e.nom, 
          e.prenom, 
          p.montant,
          e.validation
        FROM etudiant e
        JOIN paiement p ON p.idetu = e.idetu
        WHERE e.validation = 1
        ORDER BY e.idetu DESC
        LIMIT :limit OFFSET :offset
        `,
        {
          replacements: { limit: parseInt(limit), offset: parseInt(offset) },
        }
      );

      const [countResult] = await sequelize.query(
        `SELECT COUNT(*) as total FROM etudiant WHERE validation = 1`
      );

      return {
        success: true,
        message: "Étudiants validés récupérés",
        data: {
          students: results,
          total: countResult[0].total,
          limit,
          offset,
        },
      };

    } catch (error) {
      console.error("❌ Erreur getValidatedStudents:", error);
      throw new Error(`Erreur de récupération: ${error.message}`);
    }
  }
}

// Fonction utilitaire simple
export async function verifyPayment(idetu) {
  const result = await PaymentVerificationService.checkStudentEligibility(idetu);
  return result.success ? result.data : null;
}
