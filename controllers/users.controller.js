require("dotenv").config();
const { SALT_ROUNDS: sr } = process.env;
const SALT_ROUNDS = Number(sr);
const { PrismaClient } = require("@prisma/client");

const Joi = require("joi");
const ResponseTemplate = require("../helper/response.template");

const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

const fetchAllUsers = async (req, res) => {
  const { page, limit } = req.query;
  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 5;
  const skip = (pageNumber - 1) * itemsPerPage;
  // Get users count
  try {
    const totalRecords = await prisma.users.count();
    let users = await prisma.users.findMany({
      select: {
        username: true,
      },
      where: {
        deleted_at: null,
      },
      orderBy: {
        username: "asc",
      },
      skip,
      take: itemsPerPage,
    });
    if (users.length === 0) {
      res
        .status(404)
        .json(ResponseTemplate(null, "Not Found", "Users is not found", false));
      return;
    } else {
      const totalPages = Math.ceil(totalRecords / itemsPerPage);
      const nextPage = pageNumber < totalPages ? pageNumber + 1 : null;
      const prevPage = pageNumber > 1 ? pageNumber - 1 : null;

      return res
        .status(200)
        .json(
          ResponseTemplate(
            { users, totalRecords, pageNumber, totalPages, nextPage, prevPage },
            "ok",
            null,
            true
          )
        );
    }
  } catch (error) {
    return res
      .status(500)
      .json(ResponseTemplate(null, "Internal Server Error", error, false));
  }
};
const updateProfile = async (req, res) => {
  const { full_name, avatar_url, bio, birth_date, location, website } =
    req.body;
  const payload = {};
  payload.user_id = req.user.id;
  payload.full_name = full_name;
  payload.avatar_url = avatar_url;
  payload.bio = bio;
  payload.birth_date = birth_date;
  payload.location = location;
  payload.website = website;
  const schema = Joi.object({
    full_name: Joi.string().min(1).max(255).required(),
    avatar_url: Joi.string(),
    bio: Joi.string(),
    birth_date: Joi.date(),
    location: Joi.string().max(30),
    website: Joi.string().max(100),
  });

  // validation input
  try {
    const { error, value } = await schema.validateAsync({
      full_name: full_name,
      avatar_url: avatar_url,
      bio: bio,
      birth_date: birth_date,
      location: location,
      website: website,
    });
    if (error) {
      throw new Error(error);
    }
  } catch (error) {
    console.error("Validation error:", error);

    res
      .status(400)
      .json(ResponseTemplate(null, "Bad Request", error.message, false));
    return;
  }

  // upsert
  try {
    const userExists = await prisma.users.findUnique({
      where: { id: payload.user_id },
    });
    console.log(payload.user_id);
    if (!userExists) {
      res
        .status(400)
        .json(
          ResponseTemplate(
            null,
            "Bad Request",
            "User does not exist for the given user_id",
            false
          )
        );
      return;
    }

    const updated_profile = await prisma.user_profiles.upsert({
      where: {
        user_id: payload.user_id,
      },
      create: {
        ...payload,
        user: { connect: { id: payload.user_id } },
      },
      update: payload,
      select: {
        full_name: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    res
      .status(201)
      .json(ResponseTemplate(updated_profile, "Created", null, true));
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
const updatePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const schema = Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string()
      .min(6)
      .max(30)
      .regex(/(?=.*[a-z])/) //Memeriksa setidaknya ada satu huruf kecil.
      .regex(/(?=.*[A-Z])/) // Memeriksa setidaknya ada satu huruf besar.
      .regex(/(?=.*\d)/) // Memeriksa setidaknya ada satu angka.
      .regex(/(?=.*[~!@#$%^&*()`])/) //Memeriksa setidaknya ada satu karakter
      .required(),
  });

  // validation input
  try {
    const { error, value } = await schema.validateAsync({
      current_password: current_password,
      new_password: new_password,
    });
    if (error) {
      throw new Error(error);
    }
    if (current_password === new_password) {
      throw new Error(
        "New password should not be the same as the current password"
      );
    }
  } catch (error) {
    console.error("Validation error:", error);

    res
      .status(400)
      .json(ResponseTemplate(null, "Bad Request", error.message, false));
    return;
  }
  try {
    const hashedPassword = await bcrypt.hash(new_password, salt);
    console.log(hashedPassword);
    const username = req.params.username;
    await prisma.users.update({
      where: { username: username },
      data: {
        password: hashedPassword,
      },
    });
    console.log("Password successfully updated");

    res.status(201).json(ResponseTemplate(null, "Created", null, true));
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

module.exports = {
  updatePassword,
  fetchAllUsers,
  updateProfile,
};
