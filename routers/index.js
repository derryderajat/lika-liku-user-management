const express = require("express");
const users_router = require("./users.routes");
const auth_router = require("./auth");
const v1 = express.Router();
v1.use("/", [users_router, auth_router]);

const router = express.Router();
router.use("/v1", v1);

module.exports = router;
