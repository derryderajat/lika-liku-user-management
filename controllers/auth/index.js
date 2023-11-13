const { PrismaClient, Prisma } = require(`@prisma/client`);
const prisma = new PrismaClient();

require("dotenv").config();
const Joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ResponseTemplate = require("../../helper/response.template");
const { sendMail } = require("../../libs/mailer");
const { generateUuidWithoutDashes } = require("../../helper/generateString");

const register = async (req, res) => {
  const { username, email, password } = req.body;
  const schema = Joi.object({
    username: Joi.string().min(3).max(16).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(6)
      .max(30)
      .regex(/(?=.*[a-z])/) //Memeriksa setidaknya ada satu huruf kecil.
      .regex(/(?=.*[A-Z])/) // Memeriksa setidaknya ada satu huruf besar.
      .regex(/(?=.*\d)/) // Memeriksa setidaknya ada satu angka.
      .regex(/(?=.*[~!@#$%^&*()`])/) //Memeriksa setidaknya ada satu karakter
      .required(),
    repeat_password: Joi.ref("password"),
  });
  // validation register
  try {
    const { error, value } = await schema.validateAsync({
      username: username,
      email: email,
      password: password,
    });
    if (error) {
      throw new Error(error);
    }
  } catch (error) {
    console.error("Validation error:", error.message);
    return res
      .status(400)
      .json(ResponseTemplate(null, "Bad Request", error.message, false));
  }
  // check email duplicate?
  try {
    const isUserDuplicate = await prisma.users.findUnique({
      where: { email: email },
    });
    if (isUserDuplicate) {
      throw new Error("Email is already used");
    }
  } catch (error) {
    res
      .status(400)
      .json(ResponseTemplate(null, "Bad Request", error.message, false));
    return;
  }
  // Create new account
  try {
    const saltRounds = 15;

    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user = await prisma.users.create({
      data: {
        username: username,
        email: email,
        password: hashedPassword,
      },
      select: {
        username: true,
        email: true,
      },
    });

    res.status(201).json(ResponseTemplate(user, "Created", null, true));
    return;
  } catch (error) {
    res
      .status(500)
      .json(
        ResponseTemplate(null, "Internal server error", error.message, false)
      );
    return;
  }
};

const login = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    let user;
    // check is user exist
    if (username && email) {
      res
        .status(400)
        .json(
          ResponseTemplate(
            null,
            "Bad Request",
            "Provide either username or email, not both",
            false
          )
        );
      return;
    } else if (username) {
      user = await prisma.users.findUnique({
        where: { username },
      });
    } else if (email) {
      user = await prisma.users.findUnique({
        where: { email },
      });
    } else {
      res
        .status(400)
        .json(
          ResponseTemplate(
            null,
            "Bad Request",
            "Provide either username or email",
            false
          )
        );
      return;
    }

    // check if user is exist;
    if (!user) {
      res
        .status(400)
        .json(ResponseTemplate(null, "Bad Request", "Invalid email", false));
      return;
    }

    let isPasswordCorrect = await bcrypt.compare(password, user.password);
    console.log(isPasswordCorrect);
    if (!isPasswordCorrect) {
      res
        .status(400)
        .json(
          ResponseTemplate(null, "Bad Request", "Password is incorrect", false)
        );
      return;
    }
    // If user is available and password is correct
    // create token

    let selectedUser = {
      id: user.id,
      email: user.email,
    };
    // 1 day expired
    const tokenExpiration = 24 * 60 * 60;
    let token = jwt.sign(selectedUser, process.env.JWT_SECRET_KEY, {
      expiresIn: tokenExpiration,
      algorithm: "HS256",
    });
    return res
      .status(200)
      .json(
        ResponseTemplate(
          { access_token: token, user: selectedUser },
          "ok",
          null,
          true
        )
      );
  } catch (error) {
    next(error);
  }
};

const forgot_password = async (req, res) => {
  const { email } = req.body;
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });
  // validation input forgot password
  try {
    const { error, value } = await schema.validateAsync({
      email: email,
    });
    if (error) {
      throw new Error(error);
    }
  } catch (error) {
    console.error("Validation error:", error.message);
    return res
      .status(400)
      .json(ResponseTemplate(null, "Bad Request", error.message, false));
  }
  const newPassword = generateUuidWithoutDashes();
  const saltRounds = 15;

  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  try {
    const updatePassword = await prisma.users.update({
      where: {
        email: email,
      },
      data: {
        password: hashedPassword,
      },
    });
    console.log(newPassword);
    const message = `Use this new password for your account:\n
    ${newPassword}
    `;
    const notSended = await sendMail(email, message);
    if (!notSended) {
      res.status(200).json(ResponseTemplate(null, "ok", null, true));

      return;
    }
  } catch (error) {
    res
      .status(500)
      .json(
        ResponseTemplate(null, "Internal server error", error.message, false)
      );
    return;
  }

  res.status(500).json({ status: "failed" });
  return;
};
module.exports = { register, login, forgot_password };
