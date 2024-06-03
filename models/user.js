const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});
// below step will add a username, a password and ensures the username is unique
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);