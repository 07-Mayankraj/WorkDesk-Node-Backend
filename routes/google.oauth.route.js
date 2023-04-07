require("dotenv").config();
const express = require('express');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const googlelogin = express.Router();
const passport = require("passport");
const { UserModel } = require('../model/user.model');
const session = require("express-session");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../nodemailer/sendingEmails");
// nesseccry middlwars
let Masteremail=''
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

// genrate random number
function generateOtp() {
  return Math.floor(Math.random() * 9999);
}


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
      Masteremail = email;
      // console.log(name, email);

      //! mongoDB  - saving user information

      try {
        const user = await UserModel.find({ email });
        // console.log(user);
        // if email not present
        
        if(user.length === 0){
           await sendEmail({email: email,subject:"Login credentials",body:` Password is ${email}` })
           
           bcrypt.hash(email, 5, async (err, hash) => {
             if (err) res.status(401).json({ "errow ": err.message });
             else {
               const newUser = new UserModel({
                 name,
                 email,
                 password: hash,
                });
                console.log("google sending mail");
                await sendEmail({email: email,subject:"Login credentials",body:` Password is ${email}` })
                sendEmail({email: email,subject:"Login credentials",body:` Password is ${email}` })
                await newUser.save();
                console.log("mail sent  user saved");

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
      "https://workdesk.netlify.app/",
  }),
  async function (req, res) {
    // Successful authentication, redirect home.
    // console.log(req.user);
    // res.redirect("http://127.0.0.1:5500/index.html")
    // res.status(200).json({ GoogleUserData: req.user });
    
    const user = req.user;
    const encodedUser = encodeURIComponent(JSON.stringify(user));
    await sendEmail({email: Masteremail,subject:"Login credentials",body:` Password is ${email}` }) 
    sendEmail({email: email,subject:"Login credentials",body:` Password is ${email}` }) 
    res.redirect(`https://workdesk.netlify.app/`);
  }
);



module.exports = {
  passport,
  googlelogin
};
