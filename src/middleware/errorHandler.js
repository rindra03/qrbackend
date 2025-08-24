// Middleware de gestion d'erreurs globales
export const errorHandler = (err, req, res, next) => {
  console.error('🚨 Erreur capturée:', err);

  // Erreur de validation Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: err.errors.map(e => e.message)
    });
  }

  // Erreur de connexion base de données
  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      success: false,
      message: 'Erreur de connexion à la base de données',
      error: 'Service temporairement indisponible'
    });
  }

  // Erreur 404 pour les routes non trouvées
  if (err.status === 404) {
    return res.status(404).json({
      success: false,
      message: 'Ressource non trouvée',
      error: 'L\'endpoint demandé n\'existe pas'
    });
  }

  // Erreur générique
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'Une erreur est survenue'
  });
};

// Middleware pour les routes non trouvées
export const notFound = (req, res, next) => {
  const error = new Error(`Route non trouvée - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};