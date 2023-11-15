const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const Joi = require("joi");
require("dotenv").config();
const { SALT_ROUNDS: sr } = process.env;
const SALT_ROUNDS = Number(sr);
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ResponseTemplate = require("../helper/response.template");
const { JWT_SECRET_KEY } = process.env;
const isAuthenticate = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    res
      .status(401)
      .json(
        ResponseTemplate(null, "Unauthorized", "you're not authorized", false)
      );
    return;
  }
  //  Using Bearer token
  // e.g  'Bearer th1sIsatOKEN213'
  const token = authorization.slice(7);
  jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      res
        .status(401)
        .json(
          ResponseTemplate(
            null,
            "Unauthorized",
            "Token is invalid or expired",
            false
          )
        );
      return;
    }

    // Check if the token is not expired
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTimestamp) {
      res
        .status(401)
        .json(
          ResponseTemplate(null, "Unauthorized", "Token has expired", false)
        );
      return;
    }
    req.user = decoded;

    next();
  });
};

const isAuthorize = (req, res, next) => {
  // take from auth
  const { username } = req.user;
  // take from path
  const isUsernameSame = username === req.params.username;
  if (!isUsernameSame) {
    res
      .status(401)
      .json(
        ResponseTemplate(
          null,
          "Unauthorized",
          "you're not authenticated",
          false
        )
      );
    return;
  }
  next();
};
const isUserAvail = async (req, res, next) => {
  const isUserExist = await prisma.users.findUnique({
    where: { username: req.params.username },
  });

  if (!isUserExist) {
    res
      .status(404)
      .json(ResponseTemplate(null, "Not Found", "user is not found", false));
    return;
  }
  next();
};

const isCurrentPassCorrect = async (req, res, next) => {
  //
  const { current_password } = req.body;
  const saltRounds = SALT_ROUNDS;

  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(current_password, salt);

  const user = await prisma.users.findUnique({
    where: { username: req.params.username },
  });
  let isPasswordCorrect = await bcrypt.compare(current_password, user.password);
  console.log(isPasswordCorrect);
  if (!isPasswordCorrect) {
    res
      .status(400)
      .json(
        ResponseTemplate(null, "Bad Request", "Password is incorrect", false)
      );
    return;
  }
  next();
};
module.exports = {
  isAuthenticate,
  isAuthorize,
  isUserAvail,
  isCurrentPassCorrect,
};
