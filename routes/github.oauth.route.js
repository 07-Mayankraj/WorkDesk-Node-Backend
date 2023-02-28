const express = require("express");
const passport = require("passport");
const { UserModel } = require("../model/user.model");
const githublogin = express.Router();
const GitHubStrategy = require("passport-github2").Strategy;
const session = require("express-session");
const bcrypt = require("bcrypt");
// nodemailer
const nodemailer = require("nodemailer");

function sendEmail(email,credentials,name) {
  //   console.log(email);
  //   transpoter to send/transport email

 const transporter = nodemailer.createTransport({
   host: 'smtp.gmail.com',
   port: 587,
   auth: {
     user: 'fsociety430@gmail.com',
     pass: process.env.GoogleKey
 }
 });

 transporter.sendMail({
   to: `${email}`,
   from: 'chikkuuu@gmail.com',
   subject: 'WorkDesk Login credentials',
   html: ` Hey, ${name} \n Thanks you for signUp \n \n Here is your email ${email} and Password : ${credentials}`
 })
 .then(()=>console.log('mail sent successfully'))
 .catch((err)=>console.log(err.message))

}

//! post login route  given from github developer settings

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// nessesary passport middlewares

githublogin.use(
  session({
    secret: process.env.access_key,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 },
  })
);

githublogin.use(passport.initialize());
githublogin.use(passport.session());

// check database status

passport.serializeUser(function (user, cb) {
  cb(null, user);
});
passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

// genrate random number
function generateOtp() {
  return Math.floor(Math.random() * 9999);
}


passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: "https://defiant-lime-kangaroo.cyclic.app/auth/github/callback",
    },
    async function (accessToken, refreshToken, profile, done) {
      // console.log(profile);
      const name = profile._json.login;
      const email = profile._json.email;
      // console.log(name, email);

      //! mongoDB  - saving user information

      try {
        const user = await UserModel.find({ email });
        // console.log(user);
        // if email not present
        if(user.length === 0){
          const credentials = `${name}-`+generateOtp();
          bcrypt.hash(credentials, 5, async (err, hash) => {
            if (err) res.status(401).json({ "errow ": err.message });
            else {
              const newUser = new UserModel({
                name,
                email,
                password: hash,
              });
              console.log(credentials);
              await newUser.save();
              await sendEmail(email,credentials,name)

            }
          });
        }
        // rediection function
      } catch (error) {
        console.log(error.message);
      }
      done(null, { name, email });
    }
  )
);

githublogin.get(
  "/auth/github/",
  passport.authenticate("github", { scope: ["profile"] })
);

githublogin.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect:
      "https://workdesk.netlify.app/",
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    // console.log(req.user);
    res.redirect(`https://workdesk.netlify.app/`);
    res.status(200).json({ userData: req.user });
  }
);

module.exports = { githublogin };

// sve and varify
