const mongoose = require('mongoose');
const cities = require('./cities');
const {places, descriptors} = require('./seedHelpers');
const Campground = require('../models/campground');

mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", ()=> {
    console.log("Database connected")
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];
const seedDB = async() => {
    await Campground.deleteMany({});
    for(let i = 0; i < 200; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '6608cbac37f9fd35476c4297', // set the author of all campgrounds to be tammy
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            geometry: {
                type: "Point", 
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude
                ]
            },
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Rerum aliquid culpa impedit reprehenderit, quasi, corrupti adipisci qui similique itaque reiciendis blanditiis suscipit id quibusdam quam tenetur dolore iste necessitatibus eos.',
            price,
            images: [
                {
                  url: 'https://res.cloudinary.com/dtsjiwifi/image/upload/v1713908165/YelpCamp/pnozwwg5xeakbyguya8o.jpg',
                  filename: 'YelpCamp/pnozwwg5xeakbyguya8o'
                },
                {
                  url: 'https://res.cloudinary.com/dtsjiwifi/image/upload/v1713908165/YelpCamp/xz2aqypbujdtdcxgjmw5.jpg',
                  filename: 'YelpCamp/xz2aqypbujdtdcxgjmw5'
                }
              ]
        })
        await camp.save();
    }
}

// connected and then close out automatically once the program ends
seedDB().then(() => {
    mongoose.connection.close();
});