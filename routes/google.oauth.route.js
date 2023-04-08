require("dotenv").config();
const express = require('express');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const googlelogin = express.Router();
const passport = require("passport");
const { UserModel } = require('../model/user.model');
const session = require("express-session");
const bcrypt = require("bcrypt");
// nesseccry middlwars
const { sendEmail } = require("../nodemailer/sendingEmails");
googlelogin.use(
  session({
    secret: process.env.access_key,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 },
  })
);
googlelogin.use(passport.initialize());
googlelogin.use(passport.session());


// check database status callbacks

passport.serializeUser(function (user, cb) {
  cb(null, user);
});
passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});


//oauth provider


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://defiant-lime-kangaroo.cyclic.app/auth/google/callback",
      scope : ["profile", "email"]
    },
    async function (accessToken, refreshToken, profile, done) {
      // console.log(profile);
      const name = profile._json.name;
      const email = profile._json.email;
      // console.log(name, email);

      //! mongoDB  - saving user information

      try {
        const user = await UserModel.find({ email });
        // console.log(user);
        // if email not present
        
        sendEmail({ email:email, subject: "Login Credentials", body: ` Hey ${name} Thank you Signing up with WorkDesk Your temporary Password is ${email}` })
        
        if(user.length === 0){
          

          bcrypt.hash(email, 5, async (err, hash) => {
            if (err) res.status(401).json({ "errow ": err.message });
            else {
              const newUser = new UserModel({
                name,
                email,
                password: hash,
              });
              await newUser.save();
              console.log("sign up success using google ");
            }
          });
        }
       
      } catch (error) {
        console.log(error.message);
      }
      done(null, { name, email });
    }
  )
);

// login route

googlelogin.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile","email"] })
);

// varify route

googlelogin.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect:
      "https://workdesk.netlify.app/routes/loginsignup/login",
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    // console.log(req.user);
    // res.redirect("http://127.0.0.1:5500/index.html")
    // res.status(200).json({ GoogleUserData: req.user });
    
    const user = req.user;
    const encodedUser = encodeURIComponent(JSON.stringify(user));
    res.redirect(`https://workdesk.netlify.app/routes/loginsignup/login`);
  }
);



module.exports = {
  passport,
  googlelogin
};