// dz JS script is used to Export data from the "tours.json" file into the *Hosted Atlas Database*, as well as deleting all the Data's in the database.

const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({
    path: "./config.env"
});
const Tour = require("./../../models/tourModels.js"); //for exporting/ deleting "Tour data"
const User = require("./../../models/userModel.js"); //for exporting/ deleting "User data"
const Review = require("./../../models/reviewModel.js"); //for exporting/ deleting "Review data"
const DB = process.env.DATABASE.replace(
    "<PASSWORD>",
    process.env.DATABASE_PASSWORD
);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
    .then(() => {
        console.log("DB connection established!");
    })
    .catch(err => {
        console.log("DB connection failed", err);
    });

//FILES TO BE IMPORTED TO THE HOSTED DATABASE:::::::::
const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/tours.json`, "utf8")
);

const users = JSON.parse(
    fs.readFileSync(`${__dirname}/users.json`, "utf8")
);

const reviews = JSON.parse(
    fs.readFileSync(`${__dirname}/reviews.json`, "utf8")
);




// IMPORTING DATA::::::::::::::::::::::::::::
// FOR DELETING THREE COLLLECTIONS(i.e reviews, tours & users collections) TO THE NATOURS DATABASE:::
const importData = async() => {
    try {
        await Tour.create(tours);
        await User.create(users, {
            validateBeforeSave: false
        });
        await Review.create(reviews);
        console.log("Data successfully uploaded");
        process.exit();
    } catch (err) {
        console.log(err);
    }
};

//DELETE ALL DATA:::::::::::::::::::::::::
// FOR DELETING COLLLECTIONS IN THE NATOURS DATABASE:::
const deleteData = async() => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log("Data successfully deleted");
        process.exit();
    } catch (err) {
        console.log(err);
    }
};


// RUNNING THE CODES ABOVE 2RU THE CLI::
if (process.argv[2] === "--import") {
    importData();
} else if (process.argv[2] === "--delete") {
    deleteData();
}

// To run d code 2ru d CLI, we use d ffg codes::::
// For importing d data from resource file (i.e 'tours.json','users.json', 'reviews.json') into the MongoDB database::
//      node dev-data/data/import-dev-data.js --import

// For deleting all the data in the MongoDB database::
//      node dev-data/data/import-dev-data.js --delete