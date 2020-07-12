"use strict";

var Tour = require('../models/tourModels');

var catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(function _callee(req, res, next) {
  var tours;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(Tour.find());

        case 2:
          tours = _context.sent;
          //  2) Build Template
          // 3) Render that template using tour data from step 1 above
          res.status(200).render('overview', {
            title: 'All Tours',
            tours: tours
          });

        case 4:
        case "end":
          return _context.stop();
      }
    }
  });
});

exports.getTour = function (req, res) {
  res.status(200).render('tour', {
    title: 'The Forest Hiker Tour'
  });
};