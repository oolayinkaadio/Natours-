const express = require('express');
const reviewController = require('../Controllers/reviewController.js');
const authController = require('../Controllers/authController.js');

const router = express.Router({ //dz was used to merge nested parameters
    mergeParams: true
        // dz block of code redirects "router.use('/:tourId/reviews', reviewRouter)" from d "tourRouter.js" file & merge it with ".post(authController.protect, authController.restrictTo('user'), reviewController.createReview)"
});
router.use(authController.protect)
router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(authController.protect, authController.restrictTo('user'), reviewController.setTour_UserId, reviewController.createReview)

router
    .route('/:id')
    .get(reviewController.getReview)
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
    .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)


module.exports = router;