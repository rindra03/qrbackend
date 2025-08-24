import { sequelize } from '../config/database.js';

export class DatabaseService {
  
  // Récupérer toutes les tables
  static async getAllTables() {
    try {
      const [results] = await sequelize.query("SHOW TABLES");
      return results.map(row => Object.values(row)[0]);
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des tables: ${error.message}`);
    }
  }

  // Récupérer la structure d'une table
  static async getTableStructure(tableName) {
    try {
      const [results] = await sequelize.query(`DESCRIBE \`${tableName}\``);
      return results;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de la structure de ${tableName}: ${error.message}`);
    }
  }

  // Vérifier si une table existe
  static async tableExists(tableName) {
    try {
      const [result] = await sequelize.query(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?",
        {
          replacements: [process.env.DB_NAME, tableName],
          type: sequelize.QueryTypes.SELECT
        }
      );
      return result.count > 0;
    } catch (error) {
      throw new Error(`Erreur lors de la vérification de la table ${tableName}: ${error.message}`);
    }
  }

  // Récupérer les données d'une table avec pagination
  static async getTableData(tableName, limit = 10, offset = 0) {
    try {
      // Vérifier l'existence de la table
      const exists = await this.tableExists(tableName);
      if (!exists) {
        throw new Error(`Table "${tableName}" n'existe pas`);
      }

      // Récupération des données avec limite
      const [results] = await sequelize.query(
        `SELECT * FROM \`${tableName}\` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`
      );

      // Comptage total des enregistrements
      const [countResult] = await sequelize.query(`SELECT COUNT(*) as total FROM \`${tableName}\``);
      const totalRecords = countResult[0].total;

      return {
        data: results,
        totalRecords,
        currentPage: Math.floor(offset / limit) + 1,
        recordsPerPage: parseInt(limit),
        totalPages: Math.ceil(totalRecords / limit)
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des données de ${tableName}: ${error.message}`);
    }
  }

  // Exécuter une requête SQL personnalisée (avec précautions)
  static async executeQuery(query, replacements = []) {
    try {
      const [results] = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });
      return results;
    } catch (error) {
      throw new Error(`Erreur lors de l'exécution de la requête: ${error.message}`);
    }
  }
}