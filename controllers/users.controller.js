require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const Joi = require("joi");
const ResponseTemplate = require("../helper/response.template");

const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

const createOneUser = async (req, res) => {
  const { username, email, password } = req.body;

  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(16).required(),
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
  try {
    const saltRounds = 15;

    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return res
      .status(201)
      .json(
        ResponseTemplate(
          { password: password, hashedPassword: hash },
          "created",
          null,
          true
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        ResponseTemplate(null, "internal server error", error.message, false)
      );
  }
};

const updateOneUser = async (req, res) => {};
module.exports = {
  createOneUser,
};
