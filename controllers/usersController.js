const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// @desc Register new user
// @route POST /api/users
// @access Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400);
    throw new Error("Please fill in all the fields!");
  }
  // check if user exists
  const userExist = await User.findOne({ username });
  console.log("existing user", userExist);
  if (userExist) {
    res.status(400);
    throw new Error("User already exists!");
  }
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);
  console.log("hash", hashPassword);
  // create user
  const user = await User.create({
    username,
    password: hashPassword,
  });
  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data!");
  }
});

// @desc Authenticate user
// @route POST /api/users/login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  console.log("found user", user);

  if (user && (await bcrypt.compare(password, user.password))) {
    res.status(200).json({
      _id: user._id,
      username: user.username,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({
      message: "Invalid credentials!",
    });
  }
});

// @desc Get user
// @route GET /api/users/me
// @access Private
const getMe = asyncHandler(async (req, res) => {
  // const { _id, name, email } = await User.findById(req.user.id);
  res.status(200).json(req.user);
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
