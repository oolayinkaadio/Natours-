const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// Start express app
const app = express();

// Route for API:
const AppError = require('./utils/appError.js');
const globalErrorHandler = require('./../starter/Controllers/errorController.js');
const tourRouter = require('./routes/tourRouter.js');
const reviewRouter = require('./routes/reviewRouter.js');
const bookingRouter = require('./routes/bookingRoutes.js');
const viewRouter = require('./routes/viewRouter.js');
const userRouter = require('./routes/userRouter.js');

// Informing express abt the template engine to be used:
app.set('view engine', 'pug');

// Informing express on where(i.e the folder) the pug file is located:
app.set('views', path.join(__dirname, 'views'));

//(1)GLOBAL MIDDLEWARE:::::
// Serving satic files:
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP Headers:
app.use(helmet());

// Development Logging:
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit requests from a specific IP:
// Creating a rate-limit with the "express-rate-limit"package that protects our App from crashing due to Attack such as "Brute Force Attack"
const limiter = rateLimit({
    //setting d Maximum number of request to be allowed in an hour to 100
    max: 100, //no of request
    windowMs: 60 * 60 * 1000, //The time(i.e 1hr)
    message: 'Too many request from this IP, Please try again in an hour', //Error msg to be received by the client once the no of request is exceeded within the 1hr time frame
});
// Applying the limiter() above to all the routes that includes '/api' in there URL
app.use('/api', limiter);

// Body parser(i.e reading data from the body into "req.body"):
app.use(
    express.json({
        limit: '10kb', //Limiting the size of the data to be sent in the body to 10kb
    })
);

app.use(
    bodyParser.urlencoded({
        extended: true,
        limit: '10kb',
    })
);

// Parsing data from the cookie
app.use(cookieParser());

// Data sanitization against NoSQL query injection:
app.use(mongoSanitize());

// Data sanitization against XSS attacks:
app.use(xss());

// Preventing parameter pollution:
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsQuantity',
            'ratingsAverage',
            'maxGroupSize',
            'difficulty',
            'price',
        ],
    })
);

// Test Middleware:
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// (2) ROUTES
//mounting d router::
app.use('/', viewRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/bookings', bookingRouter);

// HANDLING UNHANDLED ROUTES::
// app.all('*', (req, res, next) => {
//     res.status(404).json({
//         status: 'fail',
//         message: `can't find ${req.originalUrl} on this Server!`
//     })
// }) or::
app.all('*', (err, req, res, next) => {
    console.log({ err });
    next(new AppError(`can't find ${req.originalUrl} on this Server!`, 404));

});

app.use(globalErrorHandler);

//(4) START UP SERVER
module.exports = app;