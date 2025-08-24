import { sequelize } from "../config/database.js";

export class PaymentVerificationService {
  static MONTANT_ATTENDU = 60000;

  /**
   * Vérifie si un étudiant est déjà validé dans la base de données
   */
  static async isStudentAlreadyValidated(idetu) {
    try {
      const results = await sequelize.query(
        `SELECT validation FROM etudiant WHERE idetu = :idetu`,
        { replacements: { idetu }, type: sequelize.QueryTypes.SELECT }
      );

      if (!results || results.length === 0) {
        return { exists: false, validated: false };
      }

      return { 
        exists: true, 
        validated: results[0].validation == 1 
      };
    } catch (error) {
      console.error("❌ Erreur isStudentAlreadyValidated:", error);
      throw new Error(`Erreur de vérification: ${error.message}`);
    }
  }

  /**
   * Vérifie l'éligibilité et valide automatiquement un étudiant
   */
  static async checkAndValidateStudent(idetu) {
    try {
      // NOUVELLE VÉRIFICATION : Vérifier d'abord si déjà validé
      const validationCheck = await this.isStudentAlreadyValidated(idetu);
      
      if (!validationCheck.exists) {
        return { success: false, message: "Étudiant non trouvé dans la base de données", data: null };
      }

      if (validationCheck.validated) {
        return { 
          success: false, 
          message: "🚫 QR Code déjà scanné - Étudiant déjà validé dans le système", 
          data: null,
          alreadyScanned: true 
        };
      }

      // Récupération des informations complètes de l'étudiant
      const results = await sequelize.query(
        `
        SELECT 
          e.idetu, 
          e.nom, 
          e.prenom, 
          COALESCE(p.montant, 0) as montant,
          COALESCE(e.validation, 0) as validation
        FROM etudiant e
        LEFT JOIN paiement p ON e.idetu = p.idetu
        WHERE e.idetu = :idetu
        `,
        { replacements: { idetu }, type: sequelize.QueryTypes.SELECT }
      );

      const student = results[0];

      if (student.montant < this.MONTANT_ATTENDU) {
        return { success: false, message: `Montant insuffisant (${student.montant} Ar)`, data: student };
      }

      // Validation automatique - Version plus robuste
      const updateResult = await sequelize.query(
        `UPDATE etudiant SET validation = 1 WHERE idetu = :idetu`,
        { replacements: { idetu } }
      );

      console.log("📝 Résultat UPDATE:", updateResult);
      console.log("📊 Nombre de lignes affectées:", updateResult[1]);

      // Vérifier que la validation a bien été appliquée
      const updated = await sequelize.query(
        `SELECT idetu, nom, prenom, validation FROM etudiant WHERE idetu = :idetu`,
        { replacements: { idetu }, type: sequelize.QueryTypes.SELECT }
      );

      console.log("🔍 Étudiant après UPDATE:", updated[0]);

      if (!updated || updated.length === 0) {
        return { success: false, message: "Étudiant introuvable après mise à jour", data: student };
      }

      // Vérification plus flexible pour les types de données
      const currentValidation = updated[0].validation;
      if (currentValidation != 1) { // Utilise == pour comparer avec string '1' ou number 1
        return { 
          success: false, 
          message: `Validation échouée - valeur: ${currentValidation} (type: ${typeof currentValidation})`, 
          data: { 
            ...student, 
            currentValidation: currentValidation,
            updateResult: updateResult[1],
            beforeUpdate: student.validation
          } 
        };
      }

      return {
        success: true,
        message: "Étudiant validé avec succès ✅",
        data: { ...student, validation: 1, validatedAt: new Date().toISOString() },
      };

    } catch (error) {
      console.error("❌ Erreur checkAndValidateStudent:", error);
      throw new Error(`Erreur de validation automatique: ${error.message}`);
    }
  }

  /**
   * Statut d'un étudiant
   */
  static async getStudentStatus(idetu) {
    try {
      const results = await sequelize.query(
        `
        SELECT 
          e.idetu, 
          e.nom, 
          e.prenom, 
          COALESCE(p.montant, 0) as montant,
          COALESCE(e.validation, 0) as validation
        FROM etudiant e
        LEFT JOIN paiement p ON e.idetu = p.idetu
        WHERE e.idetu = :idetu
        `,
        { replacements: { idetu }, type: sequelize.QueryTypes.SELECT }
      );

      if (!results || results.length === 0) {
        return { success: false, message: "Étudiant non trouvé", data: null };
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
   * Vérifie uniquement si un étudiant est déjà validé (pour les scans répétés)
   */
  static async checkIfAlreadyScanned(idetu) {
    try {
      const validationCheck = await this.isStudentAlreadyValidated(idetu);
      
      if (!validationCheck.exists) {
        return { success: false, message: "Étudiant non trouvé", data: null };
      }

      if (validationCheck.validated) {
        // Récupérer les infos de l'étudiant pour l'affichage
        const results = await sequelize.query(
          `
          SELECT 
            e.idetu, 
            e.nom, 
            e.prenom, 
            COALESCE(p.montant, 0) as montant,
            e.validation
          FROM etudiant e
          LEFT JOIN paiement p ON e.idetu = p.idetu
          WHERE e.idetu = :idetu
          `,
          { replacements: { idetu }, type: sequelize.QueryTypes.SELECT }
        );

        return { 
          success: false, 
          message: `🚫 QR Code déjà scanné - ${results[0]?.nom} ${results[0]?.prenom} (${idetu}) est déjà validé`, 
          data: results[0],
          alreadyScanned: true 
        };
      }

      return { 
        success: true, 
        message: "Étudiant peut être scanné", 
        data: null,
        alreadyScanned: false 
      };
    } catch (error) {
      console.error("❌ Erreur checkIfAlreadyScanned:", error);
      throw new Error(`Erreur de vérification: ${error.message}`);
    }
  }
  static async getValidatedStudents(limit = 50, offset = 0) {
    try {
      const results = await sequelize.query(
        `
        SELECT 
          e.idetu, 
          e.nom, 
          e.prenom, 
          COALESCE(p.montant, 0) as montant,
          e.validation
        FROM etudiant e
        LEFT JOIN paiement p ON p.idetu = e.idetu
        WHERE e.validation = 1
        ORDER BY e.idetu DESC
        LIMIT :limit OFFSET :offset
        `,
        { replacements: { limit: parseInt(limit), offset: parseInt(offset) }, type: sequelize.QueryTypes.SELECT }
      );

      const countResult = await sequelize.query(
        `SELECT COUNT(*) as total FROM etudiant WHERE validation = 1`,
        { type: sequelize.QueryTypes.SELECT }
      );

      return {
        success: true,
        message: "Étudiants validés récupérés",
        data: { students: results, total: countResult[0].total, limit, offset },
      };
    } catch (error) {
      console.error("❌ Erreur getValidatedStudents:", error);
      throw new Error(`Erreur de récupération: ${error.message}`);
    }
  }
}