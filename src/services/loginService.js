import { sequelize } from "../config/database.js";
import bcrypt from "bcrypt";

export class LoginService {
  
  // Authentification d'un utilisateur
  static async authenticateUser(username, password) {
    try {
      console.log(`🔍 Tentative de connexion pour: ${username}`);
      
      // 1. Récupérer l'utilisateur uniquement par le username
      const [results] = await sequelize.query(
        "SELECT * FROM admin WHERE username = :username LIMIT 1",
        {
          replacements: { username },
        }
      );

      if (results.length === 0) {
        console.log("❌ Utilisateur introuvable:", username);
        return {
          success: false,
          message: "Utilisateur introuvable",
          user: null
        };
      }

      const user = results[0];

      // 2. Vérifier le mot de passe avec bcrypt
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        console.log("❌ Mot de passe incorrect pour:", username);
        return {
          success: false,
          message: "Mot de passe incorrect",
          user: null
        };
      }

      console.log("✅ Connexion réussie pour:", user.username);

      // 3. Retourner les informations utilisateur (sans le mot de passe)
      const userInfo = {
        id_admin: user.id,
        username: user.username,
        email: user.email || null,
        created_at: user.created_at || null,
        last_login: new Date().toISOString()
      };

      // 4. Optionnel : Mettre à jour la dernière connexion
      await this.updateLastLogin(user.id);

      return {
        success: true,
        message: "Connexion réussie",
        user: userInfo
      };

    } catch (error) {
      console.error("❌ Erreur lors de la tentative de connexion:", error);
      throw new Error(`Erreur d'authentification: ${error.message}`);
    }
  }

  // Mettre à jour la dernière connexion
  static async updateLastLogin(userId) {
    try {
      await sequelize.query(
        "UPDATE admin SET last_login = NOW() WHERE id = :userId",
        {
          replacements: { userId }
        }
      );
    } catch (error) {
      console.error("⚠️ Erreur mise à jour last_login:", error.message);
    }
  }

  // Hasher un mot de passe (pour créer des utilisateurs)
  static async hashPassword(password) {
    try {
      const saltRounds = 12;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      throw new Error(`Erreur lors du hashage: ${error.message}`);
    }
  }

  // Vérifier si un utilisateur existe
  static async userExists(username) {
    try {
      const [results] = await sequelize.query(
        "SELECT COUNT(*) as count FROM admin WHERE username = :username",
        {
          replacements: { username }
        }
      );
      return results[0].count > 0;
    } catch (error) {
      throw new Error(`Erreur vérification utilisateur: ${error.message}`);
    }
  }

  // Créer un nouvel utilisateur admin (optionnel)
  static async createAdmin(username, password, email = null) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const exists = await this.userExists(username);
      if (exists) {
        throw new Error('Utilisateur déjà existant');
      }

      // Hasher le mot de passe
      const hashedPassword = await this.hashPassword(password);

      // Insérer le nouvel utilisateur
      const [result] = await sequelize.query(
        `INSERT INTO admin (username, password, email, created_at) 
         VALUES (:username, :password, :email, NOW())`,
        {
          replacements: {
            username,
            password: hashedPassword,
            email
          }
        }
      );

      console.log(`✅ Nouvel admin créé: ${username}`);
      return {
        success: true,
        message: "Admin créé avec succès",
        userId: result.insertId
      };

    } catch (error) {
      console.error("❌ Erreur création admin:", error);
      throw error;
    }
  }
}

// Export de la fonction legacy pour compatibilité
export async function loginScanner(username, password) {
  const result = await LoginService.authenticateUser(username, password);
  return result.success ? result.user : null;
}