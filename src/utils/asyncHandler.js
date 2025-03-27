const asyncHandler = (requestHandler) => {
  return async (req, res, next) => {
    Promise
      .resolve(requestHandler(req, res, next))
      .catch((err) => {
        console.log('err', err)
        // If there's a Mongoose validation error, handle it
        if (err.name === 'ValidationError') {
          // Map over the validation errors to create a clean error response
          const validationError = new Error('Validation failed');
          validationError.isValidationError = true;
          validationError.errors = Object.values(err.errors).map(e => e.message);

          // Send validation errors to the client
          return next(validationError);
        }

        // Pass other errors (if any) to the error handler
        return next(err);
      })
  }
}

export { asyncHandler };