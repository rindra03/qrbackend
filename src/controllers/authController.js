import { LoginService } from '../services/loginService.js';

export class AuthController {

  // Route de connexion
  static async login(req, res) {
    const { username, password } = req.body;

    // Validation des données
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username et password sont requis",
        error: "Données manquantes"
      });
    }

    try {
      const result = await LoginService.authenticateUser(username, password);

      if (!result.success) {
        // Affichage console pour debugging
        console.log(`🚫 Tentative de connexion échouée: ${username} - ${result.message}`);
        
        return res.status(401).json({
          success: false,
          message: result.message || "Identifiants invalides",
          error: "Authentification échouée"
        });
      }

      // Affichage console pour debugging
      console.log(`🎯 Connexion réussie - Admin: ${result.user.username} (ID: ${result.user.id_admin})`);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          user: result.user,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("🚨 Erreur lors de la connexion:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la connexion",
        error: error.message
      });
    }
  }

  // Route pour créer un admin (optionnel)
  static async createAdmin(req, res) {
    const { username, password, email } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username et password sont requis"
      });
    }

    try {
      const result = await LoginService.createAdmin(username, password, email);
      
      console.log(`🎉 Nouvel admin créé: ${username}`);
      
      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          userId: result.userId,
          username: username
        }
      });

    } catch (error) {
      console.error("🚨 Erreur création admin:", error);
      
      const statusCode = error.message.includes('déjà existant') ? 409 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: "Erreur lors de la création de l'admin",
        error: error.message
      });
    }
  }

  // Route de vérification du statut
  static async status(req, res) {
    res.status(200).json({
      success: true,
      message: "Service d'authentification fonctionnel",
      timestamp: new Date().toISOString()
    });
  }
}