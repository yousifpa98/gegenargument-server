import { model, Schema } from "mongoose";

const TagSchema = new Schema({
  name: String, // z.B. "Migration"
  slug: String, // z.B. "migration"
  createdBy: String, // userId oder "system"
  usageCount: Number, // für Sortierung/Vorschläge
  createdAt: Date,
});

const Tag = model("Tag", TagSchema);
export default Tag;
