const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'Resource already exists' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'Referenced resource not found' });
  }
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({ success: false, message });
};

module.exports = errorHandler;
