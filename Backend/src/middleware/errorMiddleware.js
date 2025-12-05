const errorMiddleware = (error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Une erreur est survenue' });
};

module.exports = errorMiddleware;