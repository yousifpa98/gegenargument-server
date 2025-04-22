import { Schema, model } from "mongoose";

const SourceSchema = new Schema({
  url: { type: String, required: true },
  title: { type: String, required: true },
  publisher: { type: String },
  publishedAt: { type: Date },
  suggestedBy: { type: String }, // "anon" oder UserId
  reviewed: { type: Boolean, default: false },
  reviewedBy: { type: String },
  addedAt: { type: Date, default: Date.now },
});

const ArgumentSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    thesis: { type: String, required: true },
    antithesis: { type: String, required: true },
    detailedResponse: { type: String }, // wird als Markdown gespeichert
    responseSuggestion: { type: String },

    tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],

    sources: [SourceSchema],
    suggestedSources: [SourceSchema],

    createdBy: { type: String, default: "anon" },
    reviewed: { type: Boolean, default: false },
    reviewedBy: { type: String },
    published: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

ArgumentSchema.index({
  thesis: "text",
  antithesis: "text",
  "sources.title": "text",
  "sources.publisher": "text",
});

const Argument = model("Argument", ArgumentSchema);
export default Argument;
