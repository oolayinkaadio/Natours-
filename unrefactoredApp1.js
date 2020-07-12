// THE REFACTORED VERSION OF THIS CODE IS THE "app.js" file
// I intentionally created dz file to be able to understand d code with d comments i inserted in d codes

const fs = require("fs");
const express = require("express");

const app = express();

// using middleware:
// middleware is basically a function dt can modify an incoming request data, d term middleware is used for dz action because it stands btw d request and a response.
// d middleware is just a step dt a file goes 2ru while its being processed. In dz tutorial code, d step d data we are sending goes 2ru is simply dt d data 4rm d body is added 2 d request object by using middleware
app.use(express.json()); // d express.json() is d middleware



// // GET request with express:
// const port = 3000;
// app.get("/", (req, res) => {
//     res.status(200).json({
//         message: "Hello from the server :)",
//         app: "Natours"
//     });
// });

// // POST request with express:
// app.post("/", (req, res) => {
//     res.send("You can post to this Endpoint...");
// });

// // starting up a server with Express
// app.listen(port, () => {
//     console.log(`App listening on port ${port}!`);
// });

// LECTURE 6(EXPRESS): API HANDLING USING HTTP METHODS such as GET,POST etc::::

const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);
//  d JSON.parse() dt was used above on d file being read above in order to convert d data inside d file to an Object
// Using d http GET method to create a route dt gets an API:
app.get("/api/v1/tours", (req, res) => {
    res.status(200).json({
        // using d jsend to format d file to be sent, dz is why d data is being wrapped in curly braces:
        status: "success",
        results: tours.length, //dz is optional, and we re just using it 2 specify d no of tours in d api we are sending 
        data: {
            tours
        }
    });
});

//Using d http POST method to create a route dt *posts* a new tour:
app.post('/api/v1/tours', (req, res) => {
    // console.log(req.body);
    // sending d data body created with postman 2 our fake database which is tours-simple.json
    const newId = tours[tours.length - 1].id + 1; // creating an additonal id that continues from d last id in d tours-simple.json file(i.e if d last id in d file is id = 3, dz creates an id =4 as additional id)& dz id would be used as d id 4 d data we are sending 2 d *tours-simple.json* file.
    const newTour = Object.assign({
            id: newId
        }, req.body) // d Object.assign() allows us to merge two object as 1
        // pushing dz new tour created with postman into d existing arrays of tour in d tours-simple.json file
    tours.push(newTour);
    fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err => {
        res.status(201).json({ // d status code is 201 which signify "CREATED" bcos d http method here is POST for creating 
            status: 'success',
            data: {
                tour: newTour
            }
        });
    });
});



// HANDLING PATCH REQUEST(i.e using PATCH to update a specif tour object in d 'tours-simple.json' file):::::::::::::::::

app.patch('/api/v1/tours/:id', (req, res) => {
    if (req.params.id * 1 > tours.length) {
        return res.status(404).json({
            status: 'Fail',
            message: 'Invalid ID'
        })
    }
    // note: dz would not yet carry out the update
    res.status(200).json({
        status: 'success',
        data: {
            tour: '<Updated tour here.......!>'
        }
    })
});




//Handling http method's DELETE request:::::
app.delete('/api/v1/tours/:id', (req, res) => {
    if (req.params.id * 1 > tours.length) {
        return res.status(404).json({
            status: 'Fail',
            message: 'Invalid ID'
        })
    }
    // note: dz would not show any Content
    res.status(204).json({ // d status code is 204 which means *No Content* 
        status: 'success',
        data: null
    })
});