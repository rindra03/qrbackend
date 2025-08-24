import { DatabaseService } from '../services/databaseService.js';

export class DatabaseController {

  // Lister toutes les tables
  static async getTables(req, res) {
    try {
      const tables = await DatabaseService.getAllTables();
      
      // Affichage dans la console
      console.log("\n🗂️  === LISTE DES TABLES ===");
      console.log(`📊 Nombre total de tables: ${tables.length}`);
      console.log("📋 Tables disponibles:");
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table}`);
      });
      console.log("========================\n");
      
      res.status(200).json({
        success: true,
        message: "Tables récupérées avec succès",
        data: {
          count: tables.length,
          tables: tables
        }
      });
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des tables:", error.message);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des tables",
        error: error.message
      });
    }
  }

  // Obtenir la structure d'une table
  static async getTableStructure(req, res) {
    const { tableName } = req.params;
    
    try {
      const structure = await DatabaseService.getTableStructure(tableName);
      
      // Affichage dans la console
      console.log(`\n🔍 === STRUCTURE DE LA TABLE: ${tableName.toUpperCase()} ===`);
      console.log(`📄 Nombre de colonnes: ${structure.length}`);
      console.log("📋 Colonnes:");
      console.table(structure.map(col => ({
        Colonne: col.Field,
        Type: col.Type,
        'Null?': col.Null,
        Clé: col.Key || '-',
        Défaut: col.Default || '-',
        Extra: col.Extra || '-'
      })));
      console.log("========================\n");
      
      res.status(200).json({
        success: true,
        message: `Structure de la table ${tableName} récupérée avec succès`,
        data: {
          table: tableName,
          columns: structure
        }
      });
    } catch (error) {
      console.error(`❌ Erreur structure table ${tableName}:`, error.message);
      res.status(500).json({
        success: false,
        message: `Erreur lors de la récupération de la structure de la table ${tableName}`,
        error: error.message
      });
    }
  }

  // Obtenir les données d'une table
  static async getTableData(req, res) {
    const { tableName } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    try {
      const result = await DatabaseService.getTableData(tableName, limit, offset);
      
      // Affichage dans la console
      console.log(`\n📊 === DONNÉES DE LA TABLE: ${tableName.toUpperCase()} ===`);
      console.log(`📈 Total des enregistrements: ${result.totalRecords}`);
      console.log(`📄 Page: ${result.currentPage}/${result.totalPages} | Affichage: ${result.data.length} enregistrements`);
      console.log(`⚙️  Limite: ${limit} | Décalage: ${offset}`);
      console.log("📋 Données:");
      
      if (result.data.length > 0) {
        console.table(result.data.slice(0, 5)); // Max 5 pour la lisibilité
        if (result.data.length > 5) {
          console.log(`... et ${result.data.length - 5} autres enregistrements`);
        }
      } else {
        console.log("   ⚠️  Aucun enregistrement trouvé");
      }
      console.log("========================\n");
      
      res.status(200).json({
        success: true,
        message: `Données de la table ${tableName} récupérées avec succès`,
        data: {
          table: tableName,
          pagination: {
            totalRecords: result.totalRecords,
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            recordsPerPage: result.recordsPerPage
          },
          records: result.data
        }
      });
    } catch (error) {
      console.error(`❌ Erreur données table ${tableName}:`, error.message);
      res.status(404).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }
}