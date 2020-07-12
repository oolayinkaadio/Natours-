"use strict";

var express = require('express');

var path = require('path');

var morgan = require('morgan');

var rateLimit = require('express-rate-limit');

var helmet = require('helmet');

var mongoSanitize = require('express-mongo-sanitize');

var xss = require('xss-clean');

var hpp = require('hpp');

var app = express(); // Route for API:

var AppError = require('./utils/appError.js');

var globalErrorHandler = require('./../starter/Controllers/errorController.js');

var tourRouter = require('./routes/tourRouter.js');

var reviewRouter = require('./routes/reviewRouter.js');

var viewRouter = require('./routes/viewRouter.js');

var userRouter = require('./routes/userRouter.js'); // Informing express abt the template engine to be used:


app.set('view engine', 'pug'); // Informing express on where(i.e the folder) the pug file is located:

app.set('views', path.join(__dirname, 'views')); //(1)GLOBAL MIDDLEWARE:::::
// Serving satic files:

app.use(express["static"](path.join(__dirname, 'public'))); // Set security HTTP Headers:

app.use(helmet()); // Development Logging:

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} // Limit requests from a specific IP:
// Creating a rate-limit with the "express-rate-limit"package that protects our App from crashing due to Attack such as "Brute Force Attack"


var limiter = rateLimit({
  //setting d Maximum number of request to be allowed in an hour to 100
  max: 100,
  //no of request
  windowMs: 60 * 60 * 1000,
  //The time(i.e 1hr)
  message: 'Too many request from this IP, Please try again in an hour' //Error msg to be received by the client once the no of request is exceeded within the 1hr time frame

}); // Applying the limiter() above to all the routes that includes '/api' in there URL

app.use('/api', limiter); // Body parser(i.e reading data from the body into "req.body"):

app.use(express.json({
  limit: '10kb' //Limiting the size of the data to be sent in the body to 10kb

})); // Data sanitization against NoSQL query injection:

app.use(mongoSanitize()); // Data sanitization against XSS attacks:

app.use(xss()); // Preventing parameter pollution:

app.use(hpp({
  whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
})); // Test Middleware:

app.use(function (req, res, next) {
  req.requestTime = new Date().toISOString(); // console.log(req.headers);

  next();
}); // (2) ROUTES
//mounting d router::

app.use('/', viewRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter); // HANDLING UNHANDLED ROUTES::
// app.all('*', (req, res, next) => {
//     res.status(404).json({
//         status: 'fail',
//         message: `can't find ${req.originalUrl} on this Server!`
//     })
// }) or::

app.all('*', function (req, res, next) {
  next(new AppError("can't find ".concat(req.originalUrl, " on this Server!"), 404));
});
app.use(globalErrorHandler); //(4) START UP SERVER

module.exports = app;