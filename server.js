const mongoose = require('mongoose');
const dotenv = require('dotenv');


process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION.......Shutting down');
    console.log(err.name, err.message, err.stack);
    process.exit(1);
});

dotenv.config({
    path: './config.env',
});
const app = require('./app.js');

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
    })
    .then(() => {
        console.log('DB connection established!');
    });

// const port = 3000; // 4 hosted DATABASE
const port = 3000;
const server = app.listen(port, () => {
    console.log(`
        App listening on port ${port}!`);
});

process.on('unhandledRejection', (err) => {
    //dz is done to handle all promises error dt were not catched in all of our codes
    console.log('UNHANDLED REJECTION.......Shutting down');
    console.log(err);

    server.close(() => {
        process.exit(1);
    });
});

// to start dz server, we make use d package.json file:
// we put dz "start": "nodemon server.js" under script in order 2 start d server
// Therefore, in order 2 start d server in d command line, we use dz code:: "npm start"