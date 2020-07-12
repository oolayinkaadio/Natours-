const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModels');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./../Controllers/factoryHandler');


const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    console.log(req.file);
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([{
        name: 'imageCover',
        maxCount: 1
    },
    {
        name: 'images',
        maxCount: 3
    }
])

exports.resizeTourImages = catchAsync(async(req, res, next) => {
    if (!req.files.imageCover || req.files.images) return next();

    // 1) Processing the imageCover:
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({
            quality: 90,
        })
        .toFile(`public/img/tours/${req.body.imageCover}`);

    // 2) Processing the images:
    req.body.images = [];
    await Promise.all(req.files.images.map(async(file, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`

        await sharp(req.files.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({
                quality: 90,
            }).toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename)
    }))
    next();
})

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    console.log(req);
    next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, {
    path: 'reviews',
});

// Creating a tour::::
exports.createTour = factory.createOne(Tour);

// Updating a tour::::
exports.updateTour = factory.updateOne(Tour);

// Deleting a tour::::
exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async(req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if (!tour) { //dz would check if the "id" specified in the request is correct, if d "id" is not correct, it would return d error below
//         return next(new AppError('No tour found with that ID', 404));
//     }
//     next();
// });

exports.getTourStats = catchAsync(async(req, res, next) => {
    //creating a stats  function dtt shows TOurs whose ratings is greater-than or equal-to 4.5 & carry out some statistics on the data's 4 all of d documents with ratings greater-than or equal-to 4.5
    const stats = await Tour.aggregate([{
            $match: {
                ratingsAverage: {
                    $gte: 4.5,
                },
            },
        },
        {
            $group: {
                _id: {
                    $toUpper: '$difficulty',
                },
                numTours: {
                    $sum: 1,
                },
                numRatings: {
                    $sum: '$ratingsQuantity',
                },
                avgRatings: {
                    $avg: 'ratingsAverage',
                },
                avgPrice: {
                    $avg: '$price',
                },
                minPrice: {
                    $min: '$price',
                },
                maxPrice: {
                    $max: '$price',
                },
            },
        },
        {
            $sort: {
                avgPrice: 1,
            },
        },
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            stats,
        },
    });
});

exports.getMonthlyPlan = catchAsync(async(req, res, next) => {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([{
            $unwind: '$startDates',
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: {
                    $month: '$startDates',
                },
                numTourStarts: {
                    $sum: 1,
                },
                tours: {
                    $push: '$name',
                },
            },
        },
        {
            $addFields: {
                month: '$_id',
            },
        },
        {
            $project: {
                //dz removes d "_id" field specified in the $group stage above from data's to be sent to the user
                _id: 0,
            },
        },
        {
            $sort: {
                numTourStarts: -1,
            },
        },
        {
            $limit: 12,
        },
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            plan,
        },
    });
});

exports.getToursWithin = catchAsync(async(req, res, next) => {
    const {
        distance,
        latlng,
        unit
    } = req.params;

    const [lat, lng] = latlng.split(',');
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
        next(
            new AppError(
                'Please provide latitude and longitude in the format lat,lng',
                400
            )
        );
    }

    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [
                    [lng, lat], radius
                ],
            },
        },
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours,
        },
    });
});

exports.getDistances = catchAsync(async(req, res, next) => {
    const {
        latlng,
        unit
    } = req.params;

    const [lat, lng] = latlng.split(',');
    const multiplier = unit === 'mi' ? 0.0006217371 : 0.001;

    if (!lat || !lng) {
        next(
            new AppError(
                'Please provide latitude and longitude in the format lat,lng',
                400
            )
        );
    }

    const distances = await Tour.aggregate([{
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    });
});