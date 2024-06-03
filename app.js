// loads environment variables from a .env file only if the application is not running in a production environment
// NODE_ENV is commonly used to specify the environment in which the Node.js application is running, such as "development", "test", or "production".
if(process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

// below is for production mode
// require('dotenv').config(); 

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const userRoutes = require('./routes/users');
const campgroundsRoutes = require('./routes/campgrounds');
const reviewsRoutes = require('./routes/reviews');
const MongoStore = require("connect-mongo");
const dbUrl = process.env.DB_URL;

// const dbUrl = 'mongodb://127.0.0.1:27017/yelp-camp';
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    // useCreateIndex: true,  deprecated
    useUnifiedTopology: true,
    // useFindAndModify: false deprecated
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", ()=> {
    console.log("Database connected")
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// middleware in a Node.js and Express.js application is used to parse incoming HTTP request bodies. 
// Specifically, it is designed to handle form data submitted via HTTP POST requests.
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))
app.use(mongoSanitize());

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: 'thisshouldbeabettersecret!'
    },
    touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
    console.log("session store error", e)
})

const sessionConfig = {
    store, // use the store to store information
    name: 'session', // a way to not make it so clear about the cookie id for hackers to find out which by default is sessionID
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true, // our cookies are only accessible through http not through JS
        // secure: true, // people will need to access sites over https or cookies can only be configured over secure connections
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // expriration date so that once a user is logged in trough authentication they have a week for being logged in stead of staying logged in forever on a computer
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());
// contentSecurityPolicy middleware will stop the web loading the images and the mapbox, we can disable it
// app.use(helmet({contentSecurityPolicy: false}));
app.use(helmet());

// below is to configure our own content scurity policy specify places where we can fetch things from
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net/",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dtsjiwifi/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

// we have tto make that session is used before passport.session()
app.use(passport.initialize());
app.use(passport.session());
// authenticate is a function that has been added to passport automatically used in local strategy
passport.use(new LocalStrategy(User.authenticate()));

// serialization - how to store a user in a session
passport.serializeUser(User.serializeUser());
// get the user out of the session
passport.deserializeUser(User.deserializeUser());


// middleware of flash messages
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.get('/fakeUser', async (req, res) => {
    const user = new User({ email: 'lauren@gmail.com', username: 'lauren'});
    const newUser = await User.register(user, 'chicken');
})

app.use('/', userRoutes);
app.use('/campgrounds', campgroundsRoutes)
app.use('/campgrounds/:id/reviews', reviewsRoutes)

// set up the home page 
app.get('/', (req, res) => {
    res.render('home')
})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
})

app.use((err, req, res, next) => {
    // 500 and 'Something went wrong' is default info 
    // const {statusCode = 500, message = 'Something went wrong'} = err;
    const {statusCode = 500} = err;
    if(!err.message) err.message = 'Oh No, Something went wrong!'
    res.status(statusCode).render('error', { err })
})

app.listen(3000, () => {
    console.log('Serving on port 3000!')
})