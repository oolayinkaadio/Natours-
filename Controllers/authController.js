const crypto = require('crypto');
const {
    promisify
} = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = (id) => {
    return jwt.sign({
            id,
        },
        process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        }
    );
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true, //dz means d cookie cannot be accessed or modified by the browser, as d browser can only receive, store and send the cookie with all future requests
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    //d if() allowws d cookie to be sent in only a secure HTTPS connections when d App is in "Production environment" & also allows us to send d cookie in unsecured connection while d App is in "Development environment"

    // Sending cookies::
    res.cookie('jwt', token, cookieOptions);
    // Remove the password from the output data when the user Signup::
    user.password = undefined;
    // Sending response::
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};

exports.signup = catchAsync(async(req, res, next) => {
    const newUser = await User.create({
        role: req.body.role,
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
    });
    const url = `${req.protocol}://${req.get('host')}/me`;
    new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async(req, res, next) => {
    const {
        email,
        password
    } = req.body;

    // 1) Check if email and password exist(i.e checking if the input fields are not empty)::
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    // 2) Check if user exists && password is correct:::
    const user = await User.findOne({
        email,
    }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        // d "correctPassword() was imported from the userModel file"
        return next(new AppError('Incorrect email or password', 401));
    }

    //3) If everything is OK, Generate & send token to the client::
    createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'LoggedOut', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({
        status: 'success',
    });
};

exports.protect = catchAsync(async(req, res, next) => {
    // 1) Getting the token sent to the client::
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(
            new AppError('You are not logged in, Please log in to get access.', 401)
        );
    }

    // 2) Verification of token(i.e checking if the token is valid"not manipulated" && to know if the token has already expired)::
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Checking if the user still exit on the Database(i.e if the user has been deleted from the database and a hacker lay his hands on the token or maybe the user changed their password, then the token with which they login with before changing their password should no longer be valid)::
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        //checking if the user has been deleted and an hacker got the JWT of the deleted user
        return next(
            new AppError('The user belonging to this token does no longer exist', 401)
        );
    }

    // 4) Checking if the user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError('User recently changed password, Please log in again!', 401)
        );
    }
    // d next() below grants access to the protected route::
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

// ONLY FOR RENDERED PAGES(i.e No Errors)
exports.isLoggedIn = async(req, res, next) => {
    try {
        if (req.cookies.jwt) {
            // 1) Verification of token(i.e checking if the token is valid"not manipulated" && to know if the token has already expired)::
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            // 2) Checking if the user still exit on the Database(i.e if the user has been deleted from the database and a hacker lay his hands on the token or maybe the user changed their password, then the token with which they login with before changing their password should no longer be valid)::
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                //checking if the user has been deleted and an hacker got the JWT of the deleted user
                return next();
            }

            // 3) Checking if the user changed password after the token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }
            // If all of the above conditions are true, it means there is a logged in user
            // therefore, we need to store d user in a local variable that can be accessed by our pug files
            res.locals.user = currentUser;
            return next();
        }
    } catch (err) {
        // Should in case there's no cookies, then we call d next middlewware(i.e no logged in user):
        return next();
    }
    next();
};

// Granting access to certain routes based on the role of the User::
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async(req, res, next) => {
    // 1) Get the User based on the POSTed Email::
    const user = await User.findOne({
        email: req.body.email,
    });
    if (!user) {
        return next(new AppError('There is no User with the provided email', 404));
    }

    // 2) Generate the random reset Token::
    const resetToken = user.createPasswordResetToken();
    await user.save({
        validateBeforeSave: false,
    });
    // 3) Send the Token to the user's email address::
    const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

    try {
        const message = `Forgot your Password? Submit a PATCH request with your new password and passwordConfirm to :${resetURL}.\nIf you did not forget your password, Please ignore this email!`;

        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email',
        });
    } catch (err) {
        console.trace(err);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({
            validateBeforeSave: false,
        });

        return next(
            new AppError(
                'There was an error while sending the email. Try again later',
                500
            )
        );
    }
});
exports.resetPassword = catchAsync(async(req, res, next) => {
    // 1) Getting user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {
            $gt: Date.now(),
        },
    });

    // 2) Accept the user if the token has not expired and the user is valid, Also set the new Password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // 3) Update the "changedPasswordAt" property for the user

    // 4) log the user in and send JWT
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async(req, res, next) => {
    // 1) Getting the user from the collections
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct::
    // d correctPassword() below is a "method" of the user schema(i.e userModel.js)
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong', 401));
    }
    // 3) If the previous action(No. 2) is true & not false as specified in the code, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    console.log(user.password, user.passwordConfirm);
    await user.save();

    // 4) Log the user in
    createSendToken(user, 200, res);
});