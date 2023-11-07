const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();
const config = require("./config/keys");
const cors = require("cors");

const port = process.env.PORT || 4000;

const server = app.listen(port, () => {
  console.log(`Server Running at ${port}`);
});

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:5173", // Allow requests only from this origin
    methods: ["GET", "POST"],
    credentials: true,
  }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Enable CORS
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  credentials: true,
}));

// Routes
app.use('/api/dialogflow', require('./routes/dialogflow'));
app.use('/api/notifications', require('./routes/notification'));

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

io.on("connection", (socket) => {
  console.log("Connected to Socket.IO");
});
