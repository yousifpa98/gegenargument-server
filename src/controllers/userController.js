import User from "../models/User.js";
import { generateToken } from "../middleware/jwt.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // nur in Produktion über HTTPS
  sameSite: "strict",
  maxAge: 1000 * 60 * 60 * 24, // 1 Tag
};

export const registerUser = async (req, res) => {
  try {
    const { username, email, password, roles } = req.body;

    if (roles && roles !== "user") {
      return res
        .status(403)
        .json({ message: "Role manipulation not allowed." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already in use." });

    const user = new User({ username, email, password, roles: "user" });
    await user.save();

    const token = generateToken({ id: user._id, roles: user.roles });

    res
      .cookie("token", token, cookieOptions)
      .status(201)
      .json({ user: { id: user._id, username, email, roles: user.roles } });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.authenticate(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken({ id: user._id, roles: user.roles });

    res
      .cookie("token", token, cookieOptions)
      .status(200)
      .json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          roles: user.roles,
        },
      });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Could not fetch profile", error: error.message });
  }
};

export const logoutUser = (req, res) => {
  res
    .clearCookie("token", cookieOptions)
    .status(200)
    .json({ message: "Successfully logged out" });
};

// Optional: Admin view
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: error.message });
  }
};
