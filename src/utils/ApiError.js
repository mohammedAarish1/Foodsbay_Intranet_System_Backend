class ApiError extends Error {
    constructor(
        status,
        message = 'Something went wrong',
        errors = [],
        stack = '',
        errorCode = 'UNKNOWN_ERROR' // Optional error code
    ) {
        super(message);

        this.status = status;
        this.message = message;
        this.success = false;
        this.errors = errors;
        this.errorCode = errorCode;  // Add an error code for consistency
        this.data = null;

        // In development, capture the stack trace, otherwise, omit it in production
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }

        // Ensure the name of the error is ApiError
        this.name = this.constructor.name;
    }
}

export { ApiError };
