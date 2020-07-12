"use strict";var express=require("express"),path=require("path"),morgan=require("morgan"),rateLimit=require("express-rate-limit"),helmet=require("helmet"),mongoSanitize=require("express-mongo-sanitize"),xss=require("xss-clean"),hpp=require("hpp"),app=express(),AppError=require("./utils/appError.js"),globalErrorHandler=require("./../starter/Controllers/errorController.js"),tourRouter=require("./routes/tourRouter.js"),reviewRouter=require("./routes/reviewRouter.js"),viewRouter=require("./routes/viewRouter.js"),userRouter=require("./routes/userRouter.js");app.set("view engine","pug"),app.set("views",path.join(__dirname,"views")),app.use(express.static(path.join(__dirname,"public"))),app.use(helmet()),"development"===process.env.NODE_ENV&&app.use(morgan("dev"));var limiter=rateLimit({max:100,windowMs:36e5,message:"Too many request from this IP, Please try again in an hour"});app.use("/api",limiter),app.use(express.json({limit:"10kb"})),app.use(mongoSanitize()),app.use(xss()),app.use(hpp({whitelist:["duration","ratingsQuantity","ratingsAverage","maxGroupSize","difficulty","price"]})),app.use(function(e,r,i){e.requestTime=(new Date).toISOString(),i()}),app.use("/",viewRouter),app.use("/api/v1/reviews",reviewRouter),app.use("/api/v1/tours",tourRouter),app.use("/api/v1/users",userRouter),app.all("*",function(e,r,i){i(new AppError("can't find ".concat(e.originalUrl," on this Server!"),404))}),app.use(globalErrorHandler),module.exports=app;