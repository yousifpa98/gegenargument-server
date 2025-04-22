import mongoose from "mongoose";
import Argument from "../models/Argument.js";
import Tag from "../models/Tag.js";
import { generateSlug, generateTagSlug } from "../utils/slugify.js";
import { generateGPTResponse } from "../utils/gpt.js";

console.log("📦 Connecting to Mongo...");
await mongoose.connect(process.env.MONGODB_URI);
console.log("✅ Connected.");

const REVIEWER_ID = "admin"; // Optional: dein reviewer (User-ID oder "admin")

const testArguments = [
  {
    thesis: "Geflüchtete kriegen mehr Geld als Rentner.",
    antithesis:
      "Geflüchtete erhalten Leistungen nach dem Asylbewerberleistungsgesetz, die deutlich unterhalb von Bürgergeld oder Renten liegen. Rentner erhalten im Durchschnitt über 1.000 €, Geflüchtete oft unter 470 €.",
    sources: [
      {
        url: "https://www.mediendienst-integration.de/migration/sozialleistungen.html",
        title: "Was Geflüchtete bekommen",
        publisher: "Mediendienst Integration",
        publishedAt: new Date("2023-05-10"),
        reviewed: true,
        reviewedBy: REVIEWER_ID,
      },
    ],
    tags: ["Migration", "Soziales"],
  },
  {
    thesis: "Bürgergeldempfänger wollen einfach nicht arbeiten.",
    antithesis:
      "Nur rund 3 % der Bürgergeldempfänger verweigern aktiv Maßnahmen. Der Großteil bemüht sich um Arbeit, nimmt an Weiterbildungen teil oder pflegt Angehörige.",
    sources: [
      {
        url: "https://www.tagesschau.de/faktenfinder/buergergeld-arbeitsverweigerer-100.html",
        title: "Bürgergeld: Wie viele verweigern wirklich?",
        publisher: "Tagesschau",
        publishedAt: new Date("2023-11-30"),
        reviewed: true,
        reviewedBy: REVIEWER_ID,
      },
    ],
    tags: ["Soziales", "Vorurteile"],
  },
  {
    thesis: "Deutschland wird von Migranten überrannt.",
    antithesis:
      "Der Ausländeranteil liegt bei ca. 14 % – im EU-Vergleich normal. Migration gleicht den demografischen Wandel aus.",
    sources: [
      {
        url: "https://www.destatis.de/DE/Presse/Pressemitteilungen/2023/05/PD23_194_12411.html",
        title: "Anteil ausländischer Bevölkerung in Deutschland",
        publisher: "Destatis",
        publishedAt: new Date("2023-05-24"),
        reviewed: true,
        reviewedBy: REVIEWER_ID,
      },
    ],
    tags: ["Migration", "Demografie"],
  },
  {
    thesis: "Gendern macht die Sprache kaputt.",
    antithesis:
      "Sprache verändert sich ständig. Gendergerechte Sprache erhöht Sichtbarkeit, ohne Verständlichkeit zu verringern.",
    sources: [
      {
        url: "https://www.deutschlandfunknova.de/beitrag/studie-gendern-beeinflusst-das-denken",
        title: "Gendern beeinflusst Denken positiv",
        publisher: "Deutschlandfunk Nova",
        publishedAt: new Date("2023-01-15"),
        reviewed: true,
        reviewedBy: REVIEWER_ID,
      },
    ],
    tags: ["Sprache", "Gender"],
  },
  {
    thesis: "Der Klimawandel ist nicht menschengemacht.",
    antithesis:
      "Über 97 % der Klimaforschenden sehen den Klimawandel als menschengemacht. CO₂-Emissionen durch fossile Brennstoffe sind Hauptursache.",
    sources: [
      {
        url: "https://climate.nasa.gov/scientific-consensus/",
        title: "Scientific Consensus: Earth's Climate is Warming",
        publisher: "NASA",
        publishedAt: new Date("2023-10-01"),
        reviewed: true,
        reviewedBy: REVIEWER_ID,
      },
    ],
    tags: ["Klima", "Wissenschaft"],
  },
];

console.log("🧠 Seeding arguments...");

for (const arg of testArguments) {
  const slug = generateSlug(arg.thesis);

  const exists = await Argument.findOne({ slug });
  if (exists) {
    console.log(`⚠️  Already exists: ${slug}`);
    continue;
  }

  // 🔄 Tags verarbeiten
  const tagIds = [];
  for (const tagName of arg.tags) {
    const tagSlug = generateTagSlug(tagName);
    let tag = await Tag.findOne({ slug: tagSlug });

    if (tag) {
      tag.usageCount = (tag.usageCount || 0) + 1;
      await tag.save();
    } else {
      tag = await Tag.create({
        name: tagName,
        slug: tagSlug,
        usageCount: 1,
        createdBy: "system",
        createdAt: new Date(),
      });
    }

    tagIds.push(tag._id);
  }

  console.log(`📍 Creating: ${slug}`);

  const responseSuggestion = await generateGPTResponse(
    arg.thesis,
    arg.antithesis,
  );

  const newArg = new Argument({
    slug,
    thesis: arg.thesis,
    antithesis: arg.antithesis,
    responseSuggestion,
    tags: tagIds,
    sources: arg.sources,
    createdBy: "system",
    reviewed: true,
    reviewedBy: REVIEWER_ID,
    published: true,
  });

  await newArg.save();
  console.log(`✅ Published: ${slug}`);
}

console.log("🎉 Done seeding!");
process.exit(0);
