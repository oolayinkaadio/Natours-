const mongoose = require("mongoose");
const slugify = require("slugify");
const User = require('./userModel');
const Review = require('./reviewModel')
    //Creating a Mongoose Schema::
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "A tour must have a name"],
        unique: true,
        trim: true,
        maxlength: [40, "A tour name must be less than or equal to 40 characters"],
        minlength: [
            10,
            "A tour name must be greater than or equal to 10 characters"
        ]
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, "A tour must have a duration"]
    },
    maxGroupSize: {
        type: Number,
        required: [true, "A tour must have a group size"]
    },
    difficulty: {
        type: String,
        required: [true, "A tour must have difficulty"],
        enum: {
            values: ["easy", "medium", "difficult"],
            message: "Difficulty is either: easy, medium or difficult"
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, "Ratings must be above 1.0"],
        max: [5, "Ratings must be below 5.0"],
        set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, "A tour must have a price"]
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) {
                //dz code would check if d priceDiscount is less than the actual price
                return val < this.price;
            },
            message: "Discount price ({VALUE}) should be below the regular Price"
                //({VALUE}) in d message above refers to the value being passed to the priceDiscount field
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, "A tour must have a description"]
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, "A tour must have a cover image"]
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            unique: true,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [{
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
    }],
    guides: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }]

}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});
// GeoSpatial Index:
tourSchema.index({
    startLocation: '2dsphere'
})

//CREATING INDEX TO IMPROVE READ PERFORMANCE
tourSchema.index({
    price: 1,
    ratingsAverage: -1
})
tourSchema.index({
    slug: 1
})



// Creating a VIRTUAL PROPERTY::
// Virtual Property are fields dt are part of the model created, but would not be saved into the database cos the values for the virtual property fields are being gotten by carrying out calculatins etc on the other fields in the schema created
// Example of Virtual property is the code below which carries out a calculation using the duration field value and returns the value gotten from the calculation function
// Virtual properties will always be displayed once we load the data hosted on the database cos it depends on the values of other fields in the document hosted on the database

tourSchema.virtual("durationWeeks").get(function() {
    return this.duration / 7;
    // the above code is being used to calculate the duration of days to execute
    //the tour created with the tourSchema Model
});

// VIRTUAL POPULATE::
// This is the process of providing a specific information to d client/user without saving/ getting the info from d "database"
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour', //the name given 2 d virtual property being populated in d file where it's being referenced 2 d current file
    localField: '_id' //the name of the virtual property being populated in dz file
})


//DOCUMENT MIDDLEWARE::Mongoose 's middleware(This middleware makes use of events such save & create)
tourSchema.pre("save", function() {
    // dz middleware uses 'pre' meaning it would carry out it's action immediately before a  new document is saved to the database(i.e it runs b4 d ".save" & ".created" commands are executed)
    this.slug = slugify(this.name, {
        // using the slugify package to convert the name of the document being created to Lowercase
        lowercase: true
    });
    next();
});

// tourSchema.pre('save', async function(next) { //Embedding "User data" into "Tour data"
//     const guidesPromise = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromise);
//     next()
//         // wt dz block of code does is to get d "id" of users being passed 2 d "guides fields" when creating a new tour,
//         // it then loop 2ru d "id's" and return d details of each "id's" of Users into d "guides fields" 
// })

// QUERY MIDDLEWARE:: This allows us to run functions b4 or after a query is being executed
// this middleware makes use of event such as 'find' & also, d *this* keyword in dz type of query refers to the Querystring  & not document::
tourSchema.pre(/^find/, function(next) {
    //find
    // /^find/ == a regular expression dt works all find event such as: find, findOne, findById......etc
    this.find({
        secretTour: {
            $ne: true
        }
    });

    this.star = Date.now();
    next();
});

tourSchema.post(/^find/, function(docs, next) {
    //find
    // /^find/ == a regular expression dt works all find event such as: find, findOne, findById......etc
    console.log(`Query took ${Date.now() - this.start} milliseconds`);

    next();
});


tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
    next();
})

// AGGREGAION MIDDLEWARE:
// this code exampe of aggregation middleware will remove/not display secretTour created in any aggregation included in this Schema
// tourSchema.pre("aggregate", function(next) {
//     this.pipeline().unshift({
//         $match: {
//             secretTour: {
//                 $ne: true
//             }
//         }
//     });

//     next();
// });

//Creating a Model using the Schema created above.::
const Tour = mongoose.model('Tour', tourSchema);

//Exporting the Model created
module.exports = Tour;