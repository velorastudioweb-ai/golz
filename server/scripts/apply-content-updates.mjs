/**
 * One-off content sync: pushes the approved copy edits into the live settings
 * and services collections (the site reads from the database, not the seed).
 * Safe to re-run — every update is an idempotent $set on the same fields.
 *
 *   node scripts/apply-content-updates.mjs
 */
import "dotenv/config";
import mongoose from "mongoose";

const NEW_BIO =
  "Dr. Sushma Appaiah is the Founder of GOLZ (Giggles of Livez) and a distinguished nutrition scientist with 19 years of experience in clinical nutrition, corporate wellness, and health counselling.\n\n" +
  "Karnataka Pride Award for remarkable achievements & transformative contributions in the field of nutrition and wellness.\n\n" +
  "She holds a Ph.D. in Food Science & Technology from CSIR-CFTRI, Mysore, and an M.Sc. in Food & Nutrition (2nd Rank) from the University of Mysore.\n\n" +
  "Over the years, she has helped clients across 13 countries achieve sustainable health through evidence-based nutrition and personalized care.\n\n" +
  "A recipient of the DST Women Scientist Award and recognized as the Most Innovative Nutrition Counsellor of the Year, Dr. Sushma is known for developing innovative food formulations for special children and translating scientific research into practical nutrition solutions.\n\n" +
  "HER AREAS OF EXPERTISE INCLUDE REVERSING DIABETES, PCOD (RECENTLY TERMED AS PMOS), THYROID DISORDERS, PREGNANCY NUTRITION, SPORTS NUTRITION, ASD/ AUTISM AND SPECIAL CHILDREN NUTRITION, NUTRIGENOMICS, GUTBIOMICS, EMPOWERING INDIVIDUALS AND FAMILIES TO BUILD HEALTHIER LIVES THROUGH PERSONALIZED NUTRITION.";

const HERO_SUBTITLE =
  "GOLZ is a science-backed platform offering personalized nutrition plans designed to improve your health without giving up the foods you love, serving a global clientele with clinical nutrition.";

const HOMEPAGE_STATS = [
  { value: 19, suffix: "+", label: "Years of changing lives with nutrition and wellness programs" },
  { value: 13, suffix: "+", label: "Countries with global clientele" },
  { value: 8000, suffix: "+", label: "Personalized diet plans delivered" },
  { value: 3000, suffix: "+", label: "Specialized diet plans for children" },
];

/* Exactly three metrics on About, same widths as the rest of the site. */
const ABOUT_STATS = [
  { value: 19, suffix: "+", label: "Years of changing lives with nutrition and wellness programs" },
  { value: 8000, suffix: "+", label: "Personalized diet plans delivered" },
  { value: 3000, suffix: "+", label: "Specialized diet plans for children" },
];

const SOCIALS = {
  facebook: "https://www.facebook.com/company/golzmysuru",
  instagram: "https://www.instagram.com/golzmysuru/",
  youtube: "",
  twitter: "https://x.com/GolzMysuru",
  linkedin: "",
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const homepage = await db
    .collection("settings")
    .updateOne(
      { key: "homepage" },
      { $set: { "value.heroSubtitle": HERO_SUBTITLE, "value.stats": HOMEPAGE_STATS, "value.aboutPreview.text": NEW_BIO } }
    );
  console.log("homepage matched/modified:", homepage.matchedCount, homepage.modifiedCount);

  const general = await db.collection("settings").updateOne({ key: "general" }, { $set: { "value.socials": SOCIALS } });
  console.log("general matched/modified:", general.matchedCount, general.modifiedCount);

  const about = await db
    .collection("settings")
    .updateOne(
      { key: "about" },
      {
        $set: {
          "value.bio": NEW_BIO,
          "value.stats": ABOUT_STATS,
          "value.helpGroups.1.items": ["Pregnancy, GDM & lactation", "ASD/Autism & ADHD child nutrition", "Nutrigenomics, Gutbiomics"],
          "value.specialNeeds.stat.value": 3000,
          "value.specialNeeds.text":
            "Specialised child nutrition is at the heart of Dr. Sushma's work — she's delivered over 3,000 diet plans for children with ASD/Autism, ADHD, and developmental needs, through institutions like AIISH (Mysore) and early-intervention school programs. Certified in Autism & ADHD Nutrition Therapy (Cambridge International Institute, UK), she builds gentle, practical plans that work with a child's sensitivities, not against them.",
        },
      }
    );
  console.log("about matched/modified:", about.matchedCount, about.modifiedCount);

  const service = await db
    .collection("services")
    .updateOne(
      { slug: "specially-abled-child" },
      {
        $set: {
          title: "Specially-Abled Children",
          shortDesc:
            "Customized nutrition support for ASD/Autism, ADHD, cerebral palsy, epilepsy, sensory disorders, and developmental conditions.",
          forWho:
            "Children with ASD/Autism, ADHD, cerebral palsy, hearing impairment, intellectual disability or epilepsy.",
        },
      }
    );
  console.log("service matched/modified:", service.matchedCount, service.modifiedCount);

  /* Real photographs for the two services that shipped without one. */
  const images = await db.collection("services").updateMany(
    {},
    [
      {
        $set: {
          image: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$slug", "sports-nutrition"] },
                  then: "/home-gallery/home-09.jpg",
                },
                {
                  case: { $eq: ["$slug", "nutrigenomics-gut-health"] },
                  then: "/media/gallery/2021-b-2/role-of-intestinal-microbiota-probiotics-in-health-and-disease-webinar-by-yakulth-aug-2021/role-of-probiotics-by-golz-in-collaboration-with-yakult-1600.webp",
                },
              ],
              default: "$image",
            },
          },
        },
      },
    ]
  );
  console.log("service images matched/modified:", images.matchedCount, images.modifiedCount);

  /* "Ongoing" is never shown as a duration. */
  const durations = await db.collection("services").updateMany({ duration: "Ongoing" }, { $set: { duration: "" } });
  console.log("durations matched/modified:", durations.matchedCount, durations.modifiedCount);

  /* Services are drawn with a lucide icon (emoji are no longer rendered), so
     every record is guaranteed a valid icon key that the site can map. */
  const ICONS = {
    "weight-management": "Scale",
    "prevent-manage-diabetes": "Stethoscope",
    "thyroid-pcos-hormonal-health": "Brain",
    "heart-health": "Heart",
    "pregnancy-nutrition": "PersonStanding",
    "womens-health": "Flower2",
    "childrens-health": "Smile",
    "care-for-old-age": "Footprints",
    "specially-abled-child": "Accessibility",
    "specially-abled-children": "Accessibility",
    "oncology-nutrition": "Cross",
    "sports-nutrition": "Dumbbell",
    "nutrigenomics-gut-health": "Dna",
  };
  const icons = await db.collection("services").updateMany(
    {},
    [
      {
        $set: {
          icon: {
            $let: {
              vars: {
                fallback: {
                  $let: {
                    vars: { pairs: Object.entries(ICONS).map(([slug, icon]) => ({ slug, icon })) },
                    in: {
                      $reduce: {
                        input: "$$pairs",
                        initialValue: "Sparkles",
                        in: {
                          $cond: [{ $eq: ["$$this.slug", "$slug"] }, "$$this.icon", "$$value"],
                        },
                      },
                    },
                  },
                },
              },
              in: {
                $cond: [
                  { $gt: [{ $strLenCP: { $ifNull: ["$icon", ""] } }, 0] },
                  "$icon",
                  "$$fallback",
                ],
              },
            },
          },
        },
      },
    ]
  );
  console.log("icons matched/modified:", icons.matchedCount, icons.modifiedCount);

  /* The emoji field is dead data now that icons are drawn from lucide. */
  const emoji = await db.collection("services").updateMany({}, { $unset: { emoji: "" } });
  console.log("emoji fields removed:", emoji.modifiedCount);

  const award = await db
    .collection("settings")
    .updateOne(
      { key: "about", "value.recognition.0": "Karnataka Pride Award for remarkable achievements & transformative contributions" },
      { $set: { "value.recognition.0": "Karnataka Pride Award for remarkable achievements & transformative contributions in nutrition and wellness" } }
    );
  console.log("award matched/modified:", award.matchedCount, award.modifiedCount);

  /* Two new About sections, stored so they can be edited from the CMS. */
  const aboutCols = await db.collection("settings").updateOne(
    { key: "about", "value.speaking": { $exists: false } },
    {
      $set: {
        "value.speaking": {
          eyebrow: "Speaking",
          title: "Speaking Engagements & Expertise",
          since: "Since 2015 onwards",
          items: [
            "Invited speaker for more than 40–45 national and international conferences.",
            "Delivered more than 250 invited talks on prevention and management of disease as nutrition counsellor/invited speaker at academic and public forums, Pan India.",
          ],
        },
        "value.professionalAffiliations": {
          eyebrow: "Memberships",
          title: "Professional Affiliations",
          items: [
            "Life member — Association of Food Scientists and Technologists, India (AFSTI)",
            "Life member — Indian Dietetics Association (IDA)",
            "Life member — Indian Nutritional Medical Association (INMA)",
          ],
        },
      },
    }
  );
  console.log("about sections matched/modified:", aboutCols.matchedCount, aboutCols.modifiedCount);

  /* Diet plans are quoted as 8,000+ everywhere they are counted. */
  const EIGHT_K_LABELS = ["Personalized diet plans delivered", "Diet Plans Delivered"];
  const statStages = [
    {
      $set: {
        "value.stats": {
          $map: {
            input: { $ifNull: ["$value.stats", []] },
            as: "s",
            in: {
              $cond: [{ $in: ["$$s.label", EIGHT_K_LABELS] }, { $mergeObjects: ["$$s", { value: 8000 }] }, "$$s"],
            },
          },
        },
      },
    },
  ];
  const homeStats = await db.collection("settings").updateOne({ key: "homepage" }, statStages);
  const aboutStats = await db
    .collection("settings")
    .updateOne({ key: "about" }, [...statStages, { $set: { "value.specialNeeds.stat.value": 3000 } }]);
  console.log(
    "diet-plan stats matched/modified:",
    homeStats.matchedCount, homeStats.modifiedCount,
    "/", aboutStats.matchedCount, aboutStats.modifiedCount
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("apply-content-updates failed:", err.message);
  process.exit(1);
});
