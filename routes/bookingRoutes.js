const express = require('express');
const bookingController = require('../Controllers/bookingController.js');
const authController = require('../Controllers/authController.js');

const router = express.Router();

router.use(authController.protect);
router.get(
    '/checkout-session/:tourId',
    authController.protect,
    bookingController.getCheckoutSession
);

router.use(authController.restrictTo('admin', 'lead-guide'));
router.route('/')
    .get(bookingController.getAllBooking)
    .post(bookingController.createBooking)

router.route('/:id')
    .get(bookingController.getBooking)
    .patch(bookingController.updateBooking)
    .delete(bookingController.deleteBooking);

module.exports = router;