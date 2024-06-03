const express = require('express');
const router = express.Router();
const campgrounds = require('../controllers/campgrounds');
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, isAuthor, validateCampground} = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

router.route('/')
    .get(catchAsync(campgrounds.index)) // set up campgrounds/  to show all campgrounds in a list rendered in index.ejs
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground)); // create new campground
    // in production environment/real world, we dont want to upload imags before validating data
    // but the way Multer works is it will upload everything while it's parsing, then it sends us the parsed body in rea.body
    // so we put it in the front for now
    
// set up campgrounds/new to create new campground
router.get('/new', isLoggedIn, campgrounds.renderNewForm);
    
router.route('/:id')
    .get(catchAsync(campgrounds.showCampground)) // set up campgrounds/id rendered in the show.ejs, showing each campground
    .put(isLoggedIn, isAuthor, upload.array('image'),validateCampground, catchAsync(campgrounds.updateCampground)) // update: we can see it from an HTML form, sending a real POST request that we are faking as a PUT request
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));
    // delete, it's a form that will send a POST request to the URL, but it's going to fake out express make
    // it treat as a delete request because of the method override 

// set up campground/id/edit renderedn in cedit.ejs, to edit each cqmpground
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEidtForm));

module.exports = router;