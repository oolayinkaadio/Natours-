const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./factoryHandler');

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         //Saving the image uploaded to diskStorage
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//         // d cb() above is used 2 form@ d name of d uploaded image
//     },
// });

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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async(req, res, next) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpg')
        .jpeg({
            quality: 90
        })
        .toFile(`public/img/users/${req.file.filename}`);

    next();
});

const filterObj = (obj, ...allowedFields) => {
    // d "...allowedFields" uses "rest operator" to take all values specified immediately after "obj" and turn them into an array named "allowedFields".
    const newObj = {}; //creating an empty object named "newObj"
    Object.keys(obj).forEach((el) => {
        // d "Object.keys" returns all the field names of the object under consideratin
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });

    return newObj;
    // "if (allowedFields.includes(el))" means looping 2ru all d fields dt are in d "obj" and then for each field,
    //we check if its 1 of d values in d "allowFields" array & if so, we then create a new field in d "newObj" with the
    //same field names gotten from the "obj" & d same value gotten from d "allowFields" array(i.e newObj[el] = obj[el]) and then return d "newObj"
};

exports.updateMe = catchAsync(async(req, res, next) => {
    console.log(req.file);
    // 1) Return an Error if user tries to change the password data throungh this route
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates, Please use /updateMyPassword',
                400
            )
        );
    }

    // 3) Filtering out unwanted Fieldnames that are not allow to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename; //adding the photo propert 2 d object dt would be upated
    // 3)Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});

exports.deleteMe = catchAsync(async(req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, {
        active: false,
    });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'Route not yet defined, Please use the "/signup" route',
    });
};
exports.updateUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'Route not yet defined',
    });
};
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User); //Do not attempt to change password when trying to update a user
exports.deleteUser = factory.deleteOne(User);