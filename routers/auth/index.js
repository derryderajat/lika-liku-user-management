const { register, login, forgot_password } = require("../../controllers/auth");

const router = require("express").Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.patch("/auth/forgot-password", forgot_password);
module.exports = router;
