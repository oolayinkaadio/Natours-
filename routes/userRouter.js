const express = require('express');
const userController = require('./../Controllers/userController.js');
const authController = require('./../Controllers/authController.js');

const router = express.Router();

// ROUTES THAT ARE OPEN TO EVERY1:::
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// ALL ROUTES BELOW ARE PROTECTED FROM THE PUBLIC(i.e AVAILABLE TO ONLY 'USERS, GUIDE, LEAD-GUIDE')
router.use(authController.protect);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMyPassword', authController.updatePassword);
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

//All the routes below the "restrictTo(admin)"" below are also being protected with the "authController.protect" code above
router.use(authController.restrictTo('admin')); //Only admins can access all of d endpoint below dz line of code

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;