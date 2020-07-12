const mongoose = require('mongoose');
const User = require('./userModel')
const Tour = require('./tourModels')

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review can noct be empty']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    }

}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
})

reviewSchema.index({
    tour: 1,
    user: 1
}, {
    unique: true
})


reviewSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: 'name photo'
    });
    next();
})

// Calculating Average rating on Tours::
// Creating a Static method dt would be used 2 create d statistics of d ratingsAverage
// and ratingsQuantity of d tour which d current review being created is for.
//d static method was created in order 4 us 2 be able 2 use d "Aggregate function" on d model.
// d Aggregate function was used to create an Aggregation pipeline that was used to select all the
// d reviews dt matched d current tour's ID and then calculated d statistics 4 all of d reviews.
// After all dz was done, we save/embed dz statistics in the tour with d current tour's ID.
// Inorder 2 use d function, we call it after a new review has been created(i.e d "this.constructor"
// was used cos it points to the current Model).
// 
reviewSchema.statics.calcAverageRatings = async function(tourId) {
    const stats = await this.aggregate([{
            $match: {
                tour: tourId
            }
        },
        {
            $group: {
                _id: '$tour',
                nRating: {
                    $sum: 1
                },
                avgRating: {
                    $avg: '$rating'
                }
            }
        }
    ]);

    if (stats.length > 0) {
        await mongoose.model('Tour').findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        })
    } else {
        await mongoose.model('Tour').findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        })
    }


};


reviewSchema.post('save', function() {
    // this function points to d current review mode
    this.constructor.calcAverageRatings(this.tour)

})

reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = await this.findOne();
    console.log(this.r);
    next();
})

reviewSchema.post(/^findOneAnd/, async function() {
    await this.r.constructor.calcAverageRatings(this.r.tour)
})


const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;