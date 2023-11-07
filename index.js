const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const config = require("./config/keys");
// const mongoose = require("mongoose");
// mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log('MongoDB Connected...'))
//   .catch(err => console.log(err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.use('/api/dialogflow', require('./routes/dialogflow'));
app.use('/api/notification', require('./routes/notification'));

if (process.env.NODE_ENV === "production") {

  app.use(express.static("client/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server Running at ${port}`)
});