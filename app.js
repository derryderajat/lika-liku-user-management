const express = require("express");

const morgan = require("morgan");
const router = require("./routers");
const ResponseTemplate = require("./helper/response.template");
const app = express();
require("dotenv").config();

const PORT = process.env.PORT || 3001;

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

// route

app.use("/api", router);
app.get("/", (req, res) => {
  res.json(ResponseTemplate(null, `Hello, server is running`, null, true));
  return;
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
