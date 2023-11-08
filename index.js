const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose"); // Import Mongoose
const cors = require("cors");
dotenv.config();

const port = process.env.PORT || 4000;

const server = app.listen(port, () => {
  console.log(`Server Running at ${port}`);
});

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  credentials: true,
}));


mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});
db.once("open", () => {
  console.log("Connected to MongoDB");
});


// Routes
app.use('/api/dialogflow', require('./routes/dialogflow'));
app.use('/api/notifications', require('./routes/notification'));

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

app.locals.io = io;
io.on("connection", (socket) => {
  console.log("Connected to Socket.IO");
});
