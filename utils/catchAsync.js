// This code is used to handle all the errors coming from all the CRUD operations in the tourController.js file
module.exports = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};