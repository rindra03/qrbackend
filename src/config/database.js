import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Configuration de la base de données
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      connectTimeout: 60000,
    }
  }
);

// Test de connexion et affichage des tables
export async function connectDatabase() {
  try {
    console.log("⌛ Tentative de connexion à la base de données...");
    await sequelize.authenticate();
    console.log("✅ Connexion à la base de données réussie");
    
    // Affichage des tables au démarrage
    if (process.env.NODE_ENV === 'development') {
      await displayTables();
    }
    
    return true;
  } catch (error) {
    console.error("❌ Erreur de connexion à la base de données:", error);
    throw error;
  }
}

// Fonction pour afficher les tables
async function displayTables() {
  try {
    console.log("\n🔄 Récupération de la liste des tables...");
    const [results] = await sequelize.query("SHOW TABLES");
    const tables = results.map(row => Object.values(row)[0]);
    
    console.log("\n🗂️  === LISTE DES TABLES ===");
    console.log(`📊 Nombre total de tables: ${tables.length}`);
    console.log("📋 Tables disponibles:");
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table}`);
    });
    console.log("========================\n");
    
  } catch (error) {
    console.error("⚠️  Erreur lors de la récupération des tables:", error.message);
  }
}

// Fonction pour fermer la connexion
export async function closeDatabase() {
  try {
    await sequelize.close();
    console.log('✅ Connexion à la base de données fermée');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture:', error);
  }
}

export { sequelize };