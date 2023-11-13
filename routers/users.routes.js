const express = require("express");
const { createOneUser } = require("../controllers/users.controller");
const router = express.Router();

router.post("/users", createOneUser);

module.exports = router;
