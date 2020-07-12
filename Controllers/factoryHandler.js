// Codes in dz files are Factory function thta returns the handler functions use in this Natours project
// Handlers such as "creating, updating, and deleting" resources
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const APIFeatures = require("./../utils/apiFeatures");

exports.deleteOne = Model => catchAsync(async(req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) { //dz would check if the "id" specified in the request is correct, if d "id" is not correct, it would return d error below
        return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.updateOne = Model => catchAsync(async(req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!doc) { //dz would check if the "id" specified in the request is correct, if d "id" is not correct, it would return d error below
        return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            data: doc
        }
    });
});

exports.createOne = Model => catchAsync(async(req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
        status: "success",
        data: {
            data: doc
        }
    });
});


exports.getOne = (Model, populateOptions) => catchAsync(async(req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions)
    const doc = await query

    if (!doc) { //dz would check if the "id" specified in the request is correct, if d "id" is not correct, it would return d error below
        return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            data: doc
        }
    });

});

exports.getAll = Model => catchAsync(async(req, res, next) => {
    //To Allow for Nested "Get reviews on tour" (An Hack)
    let filter = {};
    if (req.params.tourId) filter = {
        tour: req.params.tourId
    }
    const features = new APIFeatures(Model.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()
    const doc = await features.query;

    // SENDING RESPONSE:::
    res.status(200).json({
        status: "success",
        results: doc.length,
        data: {
            data: doc
        }
    });
});