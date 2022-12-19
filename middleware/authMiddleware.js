const jwt = require("jsonwebtoken");
const async = require("express-async-handler");
const User = require("../models/User");
const expressAsyncHandler = require("express-async-handler");

const protect = expressAsyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // get token from header
      token = req.headers.authorization.split(" ")[1];

      //verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (err) {
      console.log(err);
      res.status(401);
      throw new Error("Not authorized!");
    }
  }
  if (!token) {
    res.status(401);
    throw new Error("No token!");
  }
});

module.exports = { protect };
