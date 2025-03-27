const errorHandler = (err, req, res, next) => {
    if (err.isValidationError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: err.errors,  // Send validation error messages
      });
    }
  
    // Handle other types of errors (like internal server errors)
    const statusCode = err.statusCode || 500;
    const response = {
      message: err.message || 'Something went wrong',
      errorCode: err.errorCode || 'UNKNOWN_ERROR',
    };
  
    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack;
    }
  
    return res.status(statusCode).json(response);
  };
  
  export default errorHandler;
  