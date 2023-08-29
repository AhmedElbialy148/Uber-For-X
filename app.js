const express = require("express");
const app = express();
const MONGODB_URI =
  "mongodb+srv://Ahmed_Adel:Ahmed_123456789@cluster0.trguitc.mongodb.net/uber_For_X?retryWrites=true&w=majority";
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

// Flash ///////////////////
const flash = require("connect-flash");
app.use(flash());

// Initial Endpoints///////////////////
// app.use((req, res, next) => {
//   console.log(req.session.isLoggedIn);
//   next();
// });
// Endpoints///////////////////////////
const copRoutes = require("./routes/cop");
const citizenRoutes = require("./routes/citizen");
const authRoutes = require("./routes/auth");

app.use("/citizen", citizenRoutes);
app.use("/cop", copRoutes);
app.use(authRoutes);

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
