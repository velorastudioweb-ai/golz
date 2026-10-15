import { MongoClient } from "mongodb";
import fs from "node:fs";

const uri = fs.readFileSync(new URL("../.env", import.meta.url), "utf8").match(/MONGO_URI=(.*)/)[1].trim();
const client = new MongoClient(uri);
await client.connect();
const db = client.db();

console.log(
  "images:",
  JSON.stringify(
    await db.collection("services").find({ slug: { $in: ["sports-nutrition", "nutrigenomics-gut-health"] } }).project({ slug: 1, image: 1, duration: 1 }).toArray(),
    null,
    1
  )
);
console.log("ongoing durations left:", await db.collection("services").countDocuments({ duration: "Ongoing" }));
const about = await db.collection("settings").findOne({ key: "about" });
console.log("award:", about.value.recognition[0]);
console.log("speaking seeded:", !!about.value.speaking, "| affiliations seeded:", !!about.value.professionalAffiliations);
const services = await db.collection("services").find({}).project({ slug: 1, icon: 1 }).sort({ order: 1 }).toArray();
console.log("icons:", services.map((s) => `${s.slug}=${s.icon || "MISSING"}`).join(" | "));
console.log("services without a usable icon:", services.filter((s) => !s.icon).length);
console.log("emoji fields left:", await db.collection("services").countDocuments({ emoji: { $exists: true } }));
const home = (await db.collection("settings").findOne({ key: "homepage" })).value.stats;
const aboutStats = (await db.collection("settings").findOne({ key: "about" })).value.stats;
console.log("home stats:", home.length, JSON.stringify(home));
console.log("about stats:", aboutStats.length, JSON.stringify(aboutStats));
console.log("about has Programs Completed:", aboutStats.some((s) => /Programs Completed/i.test(s.label)));
console.log("child stat:", JSON.stringify((await db.collection("settings").findOne({ key: "about" })).value.specialNeeds.stat));
await client.close();
