import Argument from "../models/Argument.js";
import Tag from "../models/Tag.js";
import { generateSlug, generateTagSlug } from "../utils/slugify.js";
import {
  generateGPTDetailedResponse,
  generateGPTResponse,
} from "../utils/gpt.js";

// Argument einreichen
export const submitArgument = async (req, res) => {
  try {
    const { thesis, antithesis, sources, tags } = req.body;
    const tagIds = [];

    for (const tag of tags || []) {
      const slug = generateTagSlug(tag);
      let existing = await Tag.findOne({ slug });

      if (existing) {
        existing.usageCount = (existing.usageCount || 0) + 1;
        await existing.save();
      } else {
        existing = await Tag.create({
          name: tag,
          slug,
          usageCount: 1,
          createdBy: req.user?.id || "anon",
          createdAt: new Date(),
        });
      }

      tagIds.push(existing._id);
    }

    // Create argument with proper user reference
    const newArgument = new Argument({
      thesis,
      antithesis,
      tags: tagIds,
      slug: generateSlug(thesis),
      sources: sources?.map((src) => ({ ...src, reviewed: false })) || [],
    });

    // Set user reference if authenticated, otherwise use fallback
    console.log("User in request:", req.user); // Log the entire user object to see what's there

    if (req.user) {
      if (req.user.id) {
        console.log("Setting createdBy to user ID:", req.user.id);
        newArgument.createdBy = req.user.id;
      } else {
        console.log(
          "User object exists but has no id property. User:",
          JSON.stringify(req.user),
        );
        // Check if there's an alternative ID field
        if (req.user._id) {
          console.log("Using _id instead:", req.user._id);
          newArgument.createdBy = req.user._id;
        } else {
          newArgument.createdByFallback = "anon";
        }
      }
    } else {
      console.log("No user in request, using fallback");
      newArgument.createdByFallback = "anon";
    }

    await newArgument.save();

    const populated = await newArgument.populate("tags");

    res.status(201).json({
      message: "Argument submitted",
      id: populated._id,
      data: populated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit argument",
      error: error.message,
    });
  }
};

// Veröffentlichen inkl. GPT-Antwort
export const publishArgument = async (req, res) => {
  try {
    const arg = await Argument.findById(req.params.id);
    if (!arg) return res.status(404).json({ message: "Argument not found" });

    const responseSuggestion = await generateGPTResponse(
      arg.thesis,
      arg.antithesis,
    );

    const detailedResponse = await generateGPTDetailedResponse(
      arg.thesis,
      arg.antithesis,
      arg.sources,
    );

    arg.detailedResponse = detailedResponse;
    arg.responseSuggestion = responseSuggestion;
    arg.published = true;
    arg.reviewed = true;
    arg.reviewedBy = req.user.id; // User ID as ObjectId
    arg.slug = generateSlug(arg.thesis);

    await arg.save();

    res.status(200).json({
      message: "Published successfully",
      slug: arg.slug,
    });
  } catch (error) {
    res.status(500).json({ message: "Publish failed", error: error.message });
  }
};

// Argument per Slug abrufen
export const getArgumentBySlug = async (req, res) => {
  try {
    const arg = await Argument.findOne({
      slug: req.params.slug,
      published: true,
    })
      .populate("tags")
      .populate("createdBy", "username"); // Also populate user info

    if (!arg) return res.status(404).json({ message: "Not found" });

    res.status(200).json(arg);
  } catch (error) {
    res.status(500).json({ message: "Fetch failed", error: error.message });
  }
};

// Quelle einreichen
export const suggestSource = async (req, res) => {
  try {
    const { slug } = req.params;
    const { url, title, publisher, publishedAt } = req.body;

    const arg = await Argument.findOne({ slug });
    if (!arg) return res.status(404).json({ message: "Argument not found" });

    // Create source object with proper user reference
    const sourceObj = {
      url,
      title,
      publisher,
      publishedAt,
      reviewed: false,
    };

    // Set suggestedBy field
    if (req.user && req.user.id) {
      sourceObj.suggestedBy = req.user.id;
    } else {
      sourceObj.suggestedBy = "anon";
    }

    arg.suggestedSources.push(sourceObj);
    await arg.save();
    res.status(200).json({ message: "Quelle eingereicht, wartet auf Prüfung" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Fehler beim Einreichen", error: error.message });
  }
};

// Quelle freigeben
export const approveSource = async (req, res) => {
  try {
    const { slug, sourceId } = req.params;
    const arg = await Argument.findOne({ slug });
    if (!arg) return res.status(404).json({ message: "Argument not found" });

    const source = arg.suggestedSources.id(sourceId);
    if (!source) return res.status(404).json({ message: "Source not found" });

    source.reviewed = true;
    source.reviewedBy = req.user.id; // User ID as ObjectId

    arg.sources.push(source);
    arg.suggestedSources.id(sourceId).deleteOne();

    await arg.save();
    res.status(200).json({ message: "Quelle freigegeben" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Freigabe fehlgeschlagen", error: error.message });
  }
};

// Argumente durchsuchen
export const searchArguments = async (req, res) => {
  try {
    const query = req.query.q;
    const tags = req.query.tags?.split(",") || [];

    const conditions = [
      { published: true },
      query ? { $text: { $search: query } } : {},
      tags.length ? { tags: { $in: tags } } : {},
    ];

    const args = await Argument.find({ $and: conditions })
      .limit(30)
      .populate("tags")
      .populate("createdBy", "username"); // Add user info

    res.status(200).json(args);
  } catch (error) {
    res.status(500).json({ message: "Search failed", error: error.message });
  }
};

// Letzte Argumente anzeigen
export const listArguments = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const query = req.query.search || "";
    const tagNames = req.query.tags?.split(",").filter(Boolean) || [];
    const tagDocs = await Tag.find({ name: { $in: tagNames } });
    const tagIds = tagDocs.map((t) => t._id);
    const sort = req.query.sort || "newest";

    const filter = {
      published: true,
      ...(query ? { $text: { $search: query } } : {}),
      ...(tagIds.length ? { tags: { $in: tagIds } } : {}),
    };

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      relevance: query ? { score: { $meta: "textScore" } } : { createdAt: -1 },
    };

    const [args, totalCount] = await Promise.all([
      Argument.find(filter)
        .sort(sortOptions[sort])
        .skip(skip)
        .limit(limit)
        .populate("tags")
        .populate("createdBy", "username") // Add user info
        .select(
          query && sort === "relevance"
            ? { score: { $meta: "textScore" } }
            : {},
        ),
      Argument.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      data: args,
      totalCount,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch arguments",
      error: error.message,
    });
  }
};

// Get arguments for moderation (unpublished)
export const getArgumentsForModeration = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const filter = {
      published: false,
      reviewed: false,
    };

    const [args, totalCount] = await Promise.all([
      Argument.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("tags")
        .populate("createdBy", "username"),
      Argument.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      data: args,
      totalCount,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch arguments for moderation",
      error: error.message,
    });
  }
};

// Get arguments for a specific user
export const getUserArguments = async (req, res) => {
  try {
    // Get the user ID (either from params or from the authenticated user)
    const userId = req.params.userId || req.user.id;

    // Check if the user has permission (can only see own arguments unless admin/mod)
    if (
      req.params.userId &&
      req.params.userId !== req.user.id &&
      !["admin", "mod"].includes(req.user.roles)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to see other users' arguments" });
    }

    const args = await Argument.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .populate("tags");

    res.status(200).json(args);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user arguments",
      error: error.message,
    });
  }
};
