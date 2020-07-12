// creating an error Handler for all Operational Errors that may occur in our Application
class AppError extends Error {
    //inheriting from the JS built-in Error class
    constructor(message, statusCode) {
        super(message); //calling the constructor of the Error class inherited & passed in "message" cos dts d only parameter 4 d Error class constructor

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true; // line of code dt allows only operational error to use dz error handler.

        Error.captureStackTrace(this, this.constructor); //to capture stack trace(i.e the specific code blocks dt causes an error and how it flows into other code blocks) error
    }
}

// Exporting the AppError class::
module.exports = AppError;