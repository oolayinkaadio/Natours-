const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user must have a name'],
    },
    email: {
        type: String,
        required: [true, 'A user must have a valid email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
    },
    photo: String,
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide your password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            //Note: dz validator only works on create and save events
            validator: function(el) {
                //dz would compare d passwords to each other and only save them, if they are the same.
                return el === this.password;
            },
            message: 'Passwords are not the same',
        },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

// Encrypting the password:::
// dz is done by using a "pre" hook on 'save' event(i.e d action is carried out b4 saving the password)
userSchema.pre('save', async function(next) {
    //  d if() below Only runs if d password field was actually modified(i.e if d password field was filled by the user)
    if (!this.isModified('password')) return next();

    //Hashing the password provided by the user with "cost of 12"
    this.password = await bcrypt.hash(this.password, 12);

    // Deleting the passwordConfirm as it's no longer needed
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function(next) {
    if (!this.isModified('password')) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
})

userSchema.pre(/^find/, function(next) {
    this.find({
        active: {
            $ne: false
        }
    });
    next()
});

// Comparing the password the user provided for login against any of the passwords stored on the database
userSchema.methods.correctPassword = async function(candidatePassword, userPassword, err) {
    if (err) {
        console.log(err);
    }
    return await bcrypt.compare(candidatePassword, userPassword)
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        console.log(changedTimeStamp, JWTTimestamp);
        return JWTTimestamp < changedTimeStamp //dz returns true as d JWTTimeStamp must be less than the changedTimeStamp
            //d "JWTTimestamp" means d time @ which the token for the user that logged in was issued
            //d "changedTimeStamp" was gotten from the "passwordChangedAt" field in the model and it represent d time @ which the user changes their password
            // note:: the time @which d token was issued(i.e JWTTimeStamp) must be less than the time @ which the password was changed (i.e changedTimeStamp)
    }
    //False means the password was not changed 
    return false;
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex'); //using the crypto module to generate 32 characters that would serve as the resetToken and also converting it to a "hexadecimal string"
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    console.log({
        resetToken
    }, this.passwordResetToken)
    this.passwordResetExpires = Date.now() + 10 * 60 * 60 * 1000;
    return resetToken;
}

// User model::
const User = mongoose.model('User', userSchema);

module.exports = User;