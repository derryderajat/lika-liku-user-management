const express = require("express");
const {
  updatePassword,
  fetchAllUsers,
  updateProfile,
} = require("../controllers/users.controller");
const {
  isAuthenticate,
  isAuthorize,
  isUserAvail,
  isCurrentPassCorrect,
} = require("../middleware");
const router = express.Router();

// router.post("/users", createOneUser);.

router.get("/users", fetchAllUsers);
router.put(
  "/users/:username/change-password",
  [isAuthenticate, isAuthorize, isUserAvail],
  updatePassword
);

router.put(
  "/users/:username/update-profile",
  [isUserAvail, isAuthenticate, isAuthorize],
  updateProfile
);

module.exports = router;
