//require modules

const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

//server setup

app.listen(5000, () => console.log("port 5000 started"));

//middlewares for ejs

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "thisissecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 999999999,
      rolling: true,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

//db-config

mongoose.connect("mongodb://localhost:27017/ejsLoginDB", {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once("open", () => {
  console.log("MongoDB connection succesfull..");
});

//user model
const userSchema = mongoose.Schema({
  email: String,
});

userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
});

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//api routes

app.get("/", (req, res) => {
  if (req.isAuthenticated) {
    res.send("You are logged in as " + req.user.email);
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const newUser = new User({ email: req.body.email });
  User.register(newUser, req.body.password, (err, user) => {
    if (err) {
      res.status(401).json({ success: "false", message: err.message });
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/");
      });
    }
  });
});

app.post("/login", (req, res) => {
  const user = new User({
    email: req.body.email,
    password: req.body.password,
  });

  req.login(user, (err) => {
    if (err) {
      res.status(401).json({
        success: "false",
        message: err.message,
      });
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/");
      });
    }
  });
});
