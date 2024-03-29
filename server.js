const express = require("express");
const mongoose = require("mongoose");
const app = express();
const PORT = process.env.PORT || 3002;
const crypto = require('crypto');
var session = require("express-session");
var bodyParser = require("body-parser");
var db = require('./models');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
require('dotenv').config();

if (process.env.NODE_ENV === "production") {
    app.use(express.static("client/build"));
};

app.use(express.static("public"));
app.use(session({ secret: process.env.SERVER_SECRET }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
mongoose.connect(process.env.MONGODB_URI || "mongodb://user1:password1@ds125628.mlab.com:25628/heroku_r702533l", { useNewUrlParser: true });

passport.use(new LocalStrategy(
    function (username, password, done) {
        console.log(username + " " + password);
        const encPass = crypto.createHmac('sha256', process.env.SHA_SECRET)
            .update(password)
            .digest('hex');
        console.log(password);
        db.User.findOne({ user_name: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) {
                console.log("incorrect");
                return done(null, false, { message: 'Incorrect username.' });
            }
            if (user.password !== encPass) {
                console.log("wrong");
                return done(null, false, { message: 'Incorrect password.' });
            }
            console.log("success");
            // console.log(user);
            return done(null, user);
        });
    }
));

const hash = crypto.createHmac('sha256', process.env.SHA_SECRET)
    .update('blah')
    .digest('hex');
console.log(hash);

passport.serializeUser(function (user, done) {
    done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    db.User.findById(id, function (err, user) {
        done(err, user);
    });
});

app.post('/create', function (req, res) {
    console.log(req.body);

    let password = req.body.password;
    const encPass = crypto.createHmac('sha256', process.env.SHA_SECRET)
        .update(password)
        .digest('hex');
    console.log(password);
    db.User.create({ user_name: req.body.username, password: encPass })
    res.redirect('/');
});


app.post('/login',
    passport.authenticate('local', { failureRedirect: '/' }),
    function (req, res) {
        res.redirect('/');
    });

app.get('/logged', function (req, res) {
    res.send(req.user)
});


app.get('/logout', function (req, res) {
    console.log('------------------');
    console.log("logging out......");
    console.log("------------------");
    req.logout();
    res.redirect('/');

});

app.listen(PORT, function () {
    console.log(`🌎  ==> API Server now listening on PORT ${PORT}!`);
});

module.exports = app;
