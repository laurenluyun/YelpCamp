const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');

// build a virtual property an image schema alone so that we can add virtual called thumbnail for each image
const ImageSchema = new Schema({
        url: String,
        filename: String
})

// we use a virtual because we dont need to store the new url on our model or in the database
// but just use it to derive a thumbnail 
ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_300');
})

// part of passing properties.popupMarkup as properties of campground 
const opts = { toJSON: { virtuals: true } };

const CampgroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            requried: true
        }
    },
    price: Number,
    description: String,
    location: String,
    // object id from a review model for each campground
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
}, opts);

CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return `<strong><a href="/campgrounds/${this._id}">${this.title}</a><strong>`
});

CampgroundSchema.post('findOneAndDelete', async function (doc) {
    if(doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model('Campground', CampgroundSchema);