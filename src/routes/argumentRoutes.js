import express from "express";
import {
  submitArgument,
  publishArgument,
  getArgumentBySlug,
  suggestSource,
  approveSource,
  listArguments,
} from "../controllers/argumentController.js";

import { authenticate, optionalAuthenticate } from "../middleware/jwt.js";
import { roleCheck } from "../middleware/roleCheck.js";
import { searchArguments } from "../controllers/argumentController.js";

const router = express.Router();

router.get("/search", searchArguments);

// Einreichen (auch Gäste möglich)
router.post("/", optionalAuthenticate, submitArgument);

router.get("/", listArguments);

// Veröffentlichen (nur Mods/Admins)
router.put(
  "/:id/publish",
  authenticate,
  roleCheck(["mod", "admin"]),
  publishArgument,
);

// Einzelnes Argument öffentlich abrufen
router.get("/:slug", getArgumentBySlug);

// Quelle einreichen
router.post("/:slug/sources", authenticate, suggestSource);

// Quelle freigeben
router.put(
  "/:slug/sources/:sourceId/approve",
  authenticate,
  roleCheck(["mod", "admin"]),
  approveSource,
);

export default router;
