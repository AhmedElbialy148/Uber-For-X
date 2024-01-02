const express = require("express");
const app = express();

const MONGODB_URI =
  "mongodb+srv://Ahmed_Adel:Ahmed_123456789@cluster0.trguitc.mongodb.net/uber_For_X?retryWrites=true&w=majority";
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const fs = require("fs");
const path = require("path");
// HTML => EJS //////////////////////////
app.set("view engine", "ejs");
app.set("views", "views");

// CSS /////////////////////////////////
app.use(express.static("./public"));

// Input formats////////////////////////
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

// Sessions ///////////////////
const session = require("express-session");
const mongoDBStore = require("connect-mongodb-session")(session);

const store = new mongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

app.use(
  session({
    secret: "supersecret",
    store: store,
    cookie: { maxAge: 12 * 60 * 60 * 1000 },
    resave: false,
    saveUninitialized: false,
  })
);

// CSRF Protection using csrf-sync library /////
const { csrfSync } = require("csrf-sync");
const {
  invalidCsrfTokenError,
  generateToken,
  getTokenFromRequest,
  getTokenFromState,
  storeTokenInState,
  revokeToken,
  csrfSynchronisedProtection,
} = csrfSync({
  getTokenFromRequest: (req) => {
    return req.body["CSRFToken"];
  },
});

app.use(csrfSynchronisedProtection);

app.use((req, res, next) => {
  let token = req.csrfToken();
  res.locals.CSRFToken = token;
  next();
});
// Flash ///////////////////////////////////////
const flash = require("connect-flash");
app.use(flash());

// Initial Endpoints///////////////////////////
// for secured headers
app.use(helmet());
// for disabling contentSecurityPolicy to display images(e.g. map,icons,...)
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "https: data:"],
    },
  })
);
//to compress files
app.use(compression());
//to store loggings
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
app.use(morgan("combined", { stream: accessLogStream }));

// Endpoints///////////////////////////////////
const copRoutes = require("./routes/cop");
const citizenRoutes = require("./routes/citizen");
const authRoutes = require("./routes/auth");
const errorController = require("./controllers/error");

app.use("/citizen", citizenRoutes);
app.use("/cop", copRoutes);
app.use(authRoutes);

app.use("/500", errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
  console.log(error);
  res.redirect("/500");
});
// MongoDB connection//////////////////
const mongoose = require("mongoose");
const socketEvents = require("./socket/socket-events");

mongoose.connect(MONGODB_URI).then((client) => {
  const server = app.listen(3000);
  const io = require("./socket/socket").init(server);

  io.on("connection", (socket) => {
    socketEvents(socket);
  });
});
