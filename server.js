import app from './src/app.js';
import { connectDatabase, closeDatabase } from './src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 8000;

// Fonction de démarrage du serveur
async function startServer() {
  try {
    // Connexion à la base de données
    await connectDatabase();
    
    // Démarrage du serveur HTTP
    const server = app.listen(PORT, () => {
      console.log(`🚀 Serveur Express démarré sur le port ${PORT}`);
      console.log(`🌐 Environnement: ${process.env.NODE_ENV}`);
      console.log(`📍 URL de base: http://localhost:${PORT}`);
      console.log(`📊 API Version: ${process.env.API_VERSION || 'v1'}`);
      console.log(`🔗 Routes disponibles:`);
      console.log(`   - GET  /health`);
      console.log(`   🔐 Authentification:`);
      console.log(`   - POST /api/v1/auth/login`);
      console.log(`   - POST /api/v1/auth/create-admin`);
      console.log(`   - GET  /api/v1/auth/status`);
      console.log(`   💰 Paiements & Validation:`);
      console.log(`   - POST /api/v1/payment/check-eligibility`);
      console.log(`   - POST /api/v1/payment/validate`);
      console.log(`   - GET  /api/v1/payment/status/:idetu`);
      console.log(`   - GET  /api/v1/payment/validated`);
      console.log(`   🗂️  Base de données:`);
      console.log(`   - GET  /api/v1/db/tables`);
      console.log(`   - GET  /api/v1/db/table/:tableName`);
      console.log(`   - GET  /api/v1/db/table/:tableName/data`);
      console.log(`   📎 Routes legacy:`);
      console.log(`   - POST /logs, /verify-payment`);
      console.log(`📚 Documentation: http://localhost:${PORT}/health`);
      console.log("========================\n");
    });

    // Gestion de la fermeture propre
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  Signal ${signal} reçu, arrêt du serveur...`);
      
      server.close(async () => {
        console.log('🔄 Arrêt du serveur HTTP...');
        
        try {
          await closeDatabase();
          console.log('✅ Arrêt propre du serveur terminé');
          process.exit(0);
        } catch (error) {
          console.error('❌ Erreur lors de l\'arrêt:', error);
          process.exit(1);
        }
      });
    };

    // Écoute des signaux d'arrêt
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Promesse rejetée non gérée:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Exception non capturée:', error);
  process.exit(1);
});

// Démarrage du serveur
startServer();