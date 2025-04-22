import Tag from "../models/Tag.js";

export const getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find().sort({ usageCount: -1 }).limit(50);
    res.status(200).json(tags);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch tags" });
  }
};
