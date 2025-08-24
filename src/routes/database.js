import express from 'express';
import { DatabaseController } from '../controllers/databaseController.js';

const router = express.Router();

// Routes pour la gestion de la base de données
router.get('/tables', DatabaseController.getTables);
router.get('/table/:tableName', DatabaseController.getTableStructure);
router.get('/table/:tableName/data', DatabaseController.getTableData);

export default router;