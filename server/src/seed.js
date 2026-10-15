import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Service from "./models/Service.js";
import Blog from "./models/Blog.js";
import GalleryItem from "./models/GalleryItem.js";
import Testimonial from "./models/Testimonial.js";
import ContactMessage from "./models/ContactMessage.js";
import Setting from "./models/Setting.js";
import Visitor from "./models/Visitor.js";
import { slugify, estimateReadingTime } from "./utils/helpers.js";

/* Real GOLZ archive photos. Stock/Unsplash art is never seeded: every image is a
   photograph from the GOLZ event archive, served from /media/gallery. */
const img = (id) => id;

const SERVICES = [
  {
    title: "Weight Management",
    emoji: "⚖️",
    icon: "Scale",
    image: "/media/gallery/2021-b-1/obesity-myths-and-facts-get-in-depth-understanding-webinar-april-2021-by-golz/obesity-1-1600.webp",
    category: "metabolic",
    forWho: "Anyone wanting to lose or gain weight and keep it that way.",
    shortDesc: "Lose or gain weight through sustainable nutrition, personalized meal planning, and healthy lifestyle changes without restrictive diets.",
    description:
      "Weight rarely changes for one reason — it's usually a mix of metabolism, hormones, sleep, stress and daily habits. Instead of a crash diet you'll abandon in three weeks, we find the real reasons behind your weight and build a balanced plan around the food you already eat, so the result actually lasts.",
    planCovers: [
      "Body composition assessment and realistic, personalised targets",
      "Meal plans built around your existing food habits and routine",
      "Guidance on portions, timing and everyday swaps",
      "A maintenance strategy so you hold your goal for life",
    ],
    duration: "3–6 months",
    price: 4999,
  },
  {
    title: "Prevent & Manage Diabetes",
    emoji: "🩸",
    icon: "Stethoscope",
    image: "/media/gallery/2019/one-day-workshop-enteral-nutrition-in-the-critically-dec-2019/pic-2-1600.webp",
    category: "metabolic",
    forWho: "Prediabetes, Type 2 diabetes, or a family history of it.",
    shortDesc: "Evidence-based nutrition plans to regulate blood sugar, prevent complications, improve insulin sensitivity, and support long-term metabolic health.",
    description:
      "Practical, everyday food plans designed to regularise blood sugar — using normal Indian meals, not restrictive \"diet food.\" Your plan works alongside your medication, and over time many clients are able to reduce their medication and, in some cases, reverse Type 2 diabetes.",
    planCovers: [
      "Blood-sugar-friendly meal planning with familiar foods",
      "Portion and meal-timing guidance to steady glucose",
      "Regular monitoring and plan adjustments",
      "Coordination with your treating physician",
    ],
    duration: "3–6 months",
    price: 5999,
  },
  {
    title: "Thyroid & PCOS / Hormonal Health",
    emoji: "🦋",
    icon: "Brain",
    image: "/media/gallery/2021-b-2/women-health-and-hormones-talk-special-program-lady-doctors-feb-2021/invited-webinar-for-lady-doctors-1-1600.webp",
    category: "metabolic",
    forWho: "Hypothyroid, hyperthyroid, PCOS or other hormonal imbalances.",
    shortDesc: "Targeted nutrition therapy to improve thyroid function, balance hormones, reduce PCOS symptoms, and support reproductive wellness.",
    description:
      "Targeted nutrition to rebalance hormones, support thyroid function and manage PCOS. Many first-time hypothyroid clients have returned to normal ranges with their plans, and PCOS support focuses on the insulin and weight factors that drive symptoms.",
    planCovers: [
      "Hormone-supportive foods and nutrient correction",
      "Insulin- and weight-focused support for PCOS",
      "Symptom and lab tracking over time",
      "Practical plans that fit your daily life",
    ],
    duration: "3–6 months",
    price: 5999,
  },
  {
    title: "Heart Health",
    emoji: "❤️",
    icon: "Heart",
    image: "/media/gallery/2017/nurses-empowerment-apollo-hospital-sep-2017/nurses-empowerment-national-nutrition-month-apollo-hospital-mysore-sept-2017-1-1600.webp",
    category: "metabolic",
    forWho: "Cardiovascular disease, hypertension, high cholesterol, or stroke prevention.",
    shortDesc: "Heart-friendly nutrition programs that support cholesterol management, blood pressure control, and cardiovascular wellness.",
    description:
      "Heart-friendly plans that manage cholesterol, blood pressure and weight through sustainable, everyday nutrition — not bland \"heart food,\" but meals your family can eat too.",
    planCovers: [
      "Heart-healthy meal plans with sensible fats and sodium",
      "Cholesterol and blood-pressure support through food",
      "Weight management to reduce cardiac load",
      "Sustainable habits you can keep long-term",
    ],
    duration: "",
    price: 5999,
  },
  {
    title: "Pregnancy Nutrition",
    emoji: "🤰",
    icon: "PersonStanding",
    image: "/media/gallery/2020/invited-program-to-wcd-7th-sep-2020/pictures-of-the-program-wcd-1600.webp",
    category: "family",
    forWho: "Expecting mothers, including those with gestational diabetes or thyroid issues.",
    shortDesc: "Nutrition guidance before, during, and after pregnancy with customized meal plans supporting both mother and baby's health.",
    description:
      "Special plans that protect your health and your baby's growth, with dedicated support for gestational diabetes and thyroid concerns during pregnancy — for a safe, healthy delivery and a strong start to feeding.",
    planCovers: [
      "Trimester-wise nutrition for you and your baby",
      "Gestational diabetes and pregnancy-thyroid management",
      "Adequate iron, calcium, folate and protein",
      "Post-delivery and lactation support",
    ],
    duration: "Per trimester",
    price: 6999,
  },
  {
    title: "Women's Health",
    emoji: "🌸",
    icon: "Flower2",
    image: "/media/gallery/2017/bioclinica-corporates-march-2017/women-health-and-empowerment-bioclinica-corporates-march-2017-1-1600.webp",
    category: "family",
    forWho: "Women at every life stage, from teenage years to menopause.",
    shortDesc: "Nutrition support for every stage of a woman's life including fertility, anemia, menopause, hormonal balance, and overall wellness.",
    description:
      "Whole-person care across life: teenage health, anaemia, weight, mental wellbeing, hormonal balance and menopause — so you can care for your family while keeping your own health first.",
    planCovers: [
      "Life-stage-specific nutrition, teens to menopause",
      "Correction of anaemia and common deficiencies",
      "Hormonal and menopausal symptom support",
      "Mental-wellbeing and energy-focused nutrition",
    ],
    duration: "",
    price: 4999,
  },
  {
    title: "Children's Health",
    emoji: "🧒",
    icon: "Smile",
    image: "/media/gallery/2017/aiish-nov-2017/childrens-days-camp-to-celebrate-childrens-day-aiish-1600.webp",
    category: "family",
    forWho: "Children with low weight, slow growth, frequent illness or fussy eating.",
    shortDesc: "Healthy nutrition plans for children's growth, immunity, development, eating habits, and long-term wellness.",
    description:
      "Support for low weight, slow growth, frequent illness and weak immunity — with growth monitoring and gentle nutrition counselling that helps children overcome obstacles and thrive, and builds healthy eating habits early.",
    planCovers: [
      "Growth tracking and age-appropriate targets",
      "Immunity-building foods and routines",
      "Practical strategies for fussy eaters",
      "Habit-building the whole family can support",
    ],
    duration: "Monthly",
    price: 2999,
  },
  {
    title: "Care for Old Age",
    emoji: "🧓",
    icon: "Footprints",
    image: "/media/gallery/2021-b-2/webinar-for-senior-citizen-role-of-nutrition-in-aging-webinar-hisar-april-2021/senior-citizen-webinar3-1600.webp",
    category: "family",
    forWho: "Seniors and their families.",
    shortDesc: "Balanced nutrition plans designed for healthy aging, digestion, bone health, immunity, and chronic disease management.",
    description:
      "Nutrition tailored to senior health — supporting immunity, strength, digestion and overall wellbeing through balanced, easy-to-follow food plans, with special attention to conditions like IBS and IBD.",
    planCovers: [
      "Gentle, balanced plans that are easy to follow",
      "Digestive support, including IBS and IBD",
      "Bone, muscle and immunity nutrition",
      "Management of common age-related conditions",
    ],
    duration: "",
    price: 3999,
  },
  {
    title: "Specially-Abled Children",
    emoji: "🌈",
    icon: "Accessibility",
    image: "/media/gallery/2020/dharwad-school-feb-2020/feb-2020-jss-dharwad-nutrition-for-cdifferently-abled-children-2-day-workshop-for-parents-and-caregivers-1600.webp",
    category: "specialised",
    forWho: "Children with ASD/Autism, ADHD, cerebral palsy, hearing impairment, intellectual disability or epilepsy.",
    shortDesc: "Customized nutrition support for ASD/Autism, ADHD, cerebral palsy, epilepsy, sensory disorders, and developmental conditions.",
    description:
      "This is at the heart of Dr. Sushma's work — over 3,000 diet plans delivered for children with special needs. Plans are gut-microbiome-focused, with gluten- and casein-free protocols where appropriate, and regular monitoring that supports behaviour and wellbeing. Every plan works with a child's sensitivities, not against them.",
    planCovers: [
      "Gut-focused, individualised nutrition protocols",
      "Elimination diets (gluten/casein-free) where indicated",
      "Behaviour and wellbeing tracking over time",
      "Practical guidance and support for parents",
    ],
    credibility: "Certified in Autism & ADHD Nutrition Therapy (Level 1 & 2), Cambridge International Institute for Professional Development, UK.",
    duration: "",
    price: 5999,
  },
  {
    title: "Oncology Nutrition",
    emoji: "🎗️",
    icon: "Cross",
    image: "/media/gallery/2024/30-mar-2024-cancer-infertility-roopanagar/20240330-162127-1600.webp",
    category: "specialised",
    forWho: "Patients during and after cancer treatment.",
    shortDesc: "Clinical nutrition support to improve immunity, strength, recovery, and quality of life during cancer treatment.",
    description:
      "Nourishing, therapeutic diets to help maintain strength, immunity and energy through cancer treatment and recovery — preventing muscle loss, managing weight, and easing the side-effects that make eating hard.",
    planCovers: [
      "Strength and immunity support through treatment",
      "Management of nausea, appetite loss and taste changes",
      "Muscle-preserving, weight-stabilising nutrition",
      "Recovery-focused plans for after treatment",
    ],
    duration: "",
    price: 6999,
  },
  {
    title: "Sports Nutrition",
    emoji: "🏋️",
    icon: "Dumbbell",
    image: "/home-gallery/home-09.jpg",
    category: "performance",
    forWho: "Athletes and serious fitness enthusiasts.",
    shortDesc: "Performance nutrition plans for athletes and fitness enthusiasts focusing on energy, recovery, muscle gain, endurance, and body composition.",
    description:
      "Performance nutrition matched to your sport, intensity and training. We guide what, how much and when to eat — for energy, strength and recovery — backed by body composition monitoring so your plan tracks with your results.",
    planCovers: [
      "Sport-specific fuelling for training and competition",
      "Macro planning for energy, strength and recovery",
      "Nutrient timing around your sessions",
      "Ongoing body composition tracking",
    ],
    duration: "Custom",
    price: 7999,
  },
  {
    title: "Nutrigenomics & Gut Health",
    emoji: "🧬",
    icon: "Dna",
    image: "/media/gallery/2021-b-2/role-of-intestinal-microbiota-probiotics-in-health-and-disease-webinar-by-yakulth-aug-2021/role-of-probiotics-by-golz-in-collaboration-with-yakult-1600.webp",
    category: "performance",
    forWho: "Anyone who wants precision, DNA-based nutrition.",
    shortDesc: "Advanced personalized nutrition based on genetics, gut microbiome analysis, metabolic health, and precision nutrition.",
    description:
      "Diet plans based on genetic mapping and gut-microbiome analysis — advanced, DNA-personalised nutrition delivered with precision, in collaboration with Gene Box Academy. This is nutrition tailored not just to your condition, but to how your genes and gut actually respond to food.",
    planCovers: [
      "Interpretation of your DNA and gut-microbiome results",
      "A gene- and microbiome-informed nutrition plan",
      "Precision recommendations beyond generic guidelines",
      "Ongoing refinement as your results evolve",
    ],
    credibility: "Advanced Nutrigenomics Expert, Genebox Academy.",
    duration: "Custom",
    price: 9999,
  },
];

const BLOGS = [
  {
    title: "10 Foods That Naturally Boost Your Immunity",
    category: "Immunity",
    tags: ["immunity", "superfoods", "nutrition"],
    cover: "/media/gallery/2021-b-1/nutrition-immunity-and-covid-management-webinar-cro-karnataka-july-2021/nutrition-and-covid-attended-by-almost-80-participants-1600.webp",
    excerpt: "From citrus to mushrooms — discover the evidence-backed foods that keep your immune system strong all year round.",
    content: `<p>Your immune system works around the clock, and the right foods give it the ammunition it needs. Here are the top 10 research-backed foods to include in your weekly diet.</p><h2>1. Citrus Fruits</h2><p>Vitamin C is famous for a reason — it supports the production of white blood cells. Include oranges, lemons, and grapefruit.</p><h2>2. Garlic</h2><p>Garlic's allicin content has been shown to reduce the severity of infections in several studies.</p><h2>3. Ginger</h2><p>A natural anti-inflammatory that helps soothe sore throats and supports digestion.</p><h2>4. Spinach</h2><p>Rich in vitamin C, beta-carotene and antioxidants — lightly cooked so the nutrients stay bioavailable.</p><h2>5. Yogurt</h2><p>Probiotics in yogurt feed healthy gut bacteria, where 70% of your immune system lives.</p><h2>6. Almonds</h2><p>Vitamin E is a fat-soluble antioxidant that protects cell membranes from damage.</p><h2>7. Turmeric</h2><p>Curcumin, turmeric's active compound, is a powerful anti-inflammatory and antioxidant.</p><h2>8. Green Tea</h2><p>Full of flavonoids and the amino acid L-theanine, which may support T-cell function.</p><h2>9. Mushrooms</h2><p>Beta-glucans in mushrooms modulate immune response — shiitake and maitake are excellent choices.</p><h2>10. Papaya</h2><p>Packed with vitamin C, folate and papain, an enzyme that aids digestion.</p><p><strong>Remember:</strong> food is only half the story. Sleep, movement and stress management complete your immune picture.</p>`,
  },
  {
    title: "The Complete PCOS-Friendly Diet Guide",
    category: "PCOS",
    tags: ["PCOS", "hormones", "women's health"],
    cover: "/media/gallery/2021-b-1/obesity-myths-and-facts-get-in-depth-understanding-webinar-april-2021-by-golz/obesity-1-1600.webp",
    excerpt: "PCOS affects 1 in 10 women. Learn how strategic food choices can improve insulin sensitivity and balance your hormones.",
    content: `<p>Polycystic Ovary Syndrome is largely an insulin-resistance disorder. That's good news — because it means nutrition has tremendous power to help.</p><h2>Why Insulin Matters</h2><p>When insulin levels run high, the ovaries produce more testosterone, worsening PCOS symptoms. Stabilising insulin is therefore the core of the PCOS diet.</p><h2>What To Eat</h2><ul><li>High-fibre vegetables and legumes</li><li>Lean proteins at every meal</li><li>Healthy fats — nuts, seeds, avocado</li><li>Low-glycemic fruits in moderation</li></ul><h2>What To Limit</h2><ul><li>Refined sugar and white flour</li><li>Sugary beverages</li><li>Highly processed snacks</li></ul><h2>Build Balanced Meals</h2><p>Combining protein, fibre-rich carbohydrates, vegetables and healthy fats on one plate creates meals that satisfy you for longer and help keep blood sugar steady.</p><h2>Timing Matters</h2><p>Eating protein with every meal and avoiding long gaps between meals keeps blood sugar steady.</p><h2>Supplements Worth Discussing</h2><p>Inositol, omega-3 and vitamin D show meaningful benefits in PCOS research — always discuss with your nutritionist before starting.</p><p>Consistency beats perfection. Small, sustainable swaps create real change over time.</p>`,
  },
  {
    title: "How To Lose Weight Without Losing Energy",
    category: "Weight Loss",
    tags: ["weight loss", "energy", "metabolism"],
    cover: "",
    excerpt: "Crash diets leave you exhausted. Here's how to create a calorie deficit while keeping your energy, mood and muscle intact.",
    content: `<p>Most diets fail because they ask you to eat less and suffer more. The science says otherwise — you can lose fat while feeling great.</p><h2>1. Moderate, Not Extreme, Deficit</h2><p>A 300–500 calorie deficit per day is enough to lose 0.5–1 kg weekly without crashing your metabolism.</p><h2>2. Protein At Every Meal</h2><p>Protein protects muscle, keeps you full and costs more energy to digest. Aim for 1.6–2.2 g per kg of body weight.</p><h2>3. Don't Skip Carbs</h2><p>Complex carbs fuel your brain and workouts. Focus on whole grains, fruits and vegetables.</p><h2>4. Move Daily</h2><p>NEAT — non-exercise activity like walking — burns more calories than most people realise.</p><h2>5. Sleep Is Non-Negotiable</h2><p>Sleep deprivation raises ghrelin and lowers leptin, driving hunger. Prioritise 7–8 hours.</p><p>Weight loss is a marathon, not a sprint. Build habits you can keep for life.</p>`,
  },
  {
    title: "The Balanced Plate: Portion Control Made Simple",
    category: "Nutrition",
    tags: ["portion control", "balanced diet"],
    cover: "/media/gallery/2020/invited-program-to-wcd-7th-sep-2020/pictures-of-the-program-wcd-1600.webp",
    excerpt: "No weighing scales required — the simple plate method helps you build balanced meals anywhere.",
    content: `<p>Portion control doesn't need a kitchen scale. The plate method is visual, flexible and works for every cuisine.</p><h2>Half The Plate: Vegetables</h2><p>Fill half your plate with non-starchy vegetables — colour equals nutrients.</p><h2>Quarter: Lean Protein</h2><p>Chicken, fish, eggs, paneer, tofu or legumes — about the size of your palm.</p><h2>Quarter: Whole Grains</h2><p>Rice, roti, quinoa or millets — roughly a closed fist.</p><h2>Don't Forget The Thumb</h2><p>Healthy fats — oil, ghee, nuts — about a thumb's worth per meal.</p><h2>Why It Works</h2><p>The method naturally balances macros, controls calories and prevents the "clean plate club" trap.</p><p>Use the plate method for one week and watch your portions transform.</p>`,
  },
  {
    title: "Diabetes And Diet: What Actually Works",
    category: "Diabetes",
    tags: ["diabetes", "blood sugar", "diet"],
    cover: "/media/gallery/2019/one-day-workshop-enteral-nutrition-in-the-critically-dec-2019/pic-2-1600.webp",
    excerpt: "Blood-sugar friendly eating isn't about eliminating carbs — it's about choosing the right ones at the right time.",
    content: `<p>Diabetes management through diet is often misunderstood. Let's separate fact from fad.</p><h2>Carbs Aren't The Enemy</h2><p>The type, amount and timing of carbohydrates matter far more than avoiding them entirely.</p><h2>Choose Low-GI Staples</h2><p>Switch white rice for brown rice or millets, white bread for whole grain, and add legumes to every meal — fibre slows sugar absorption.</p><h2>The Order Of Eating</h2><p>Research shows eating protein and vegetables before carbohydrates significantly blunts post-meal blood sugar spikes.</p><h2>Portion Discipline</h2><p>Consistent portion sizes at consistent times help stabilise daily glucose patterns.</p><h2>What To Watch</h2><ul><li>Hidden sugars in sauces and packaged foods</li><li>Sweetened beverages — the worst offenders</li><li>"Diet" foods that spike glucose anyway</li></ul><p>Pair your nutrition plan with regular monitoring and your doctor's guidance.</p>`,
  },
  {
    title: "Eating Right During Pregnancy: A Trimester Guide",
    category: "Pregnancy",
    tags: ["pregnancy", "prenatal", "maternal health"],
    cover: "/media/gallery/2017/aiish-nov-2017/childrens-days-camp-to-celebrate-childrens-day-aiish-1600.webp",
    excerpt: "From folate in the first trimester to iron and calcium later — here's how your nutrition needs evolve through pregnancy.",
    content: `<p>Nutrition during pregnancy shapes both maternal health and foetal development. Here's what changes in each trimester.</p><h2>First Trimester</h2><p>Focus on folate (400–800 mcg), ginger for nausea, and small frequent meals. Your calorie needs barely change — quality matters more than quantity.</p><h2>Second Trimester</h2><p>Calorie needs rise by roughly 300 kcal. Prioritise iron (with vitamin C for absorption), calcium and protein-rich foods.</p><h2>Third Trimester</h2><p>Omega-3 DHA supports baby's brain development. Watch sodium for swelling, and eat fibre-rich foods to combat constipation.</p><h2>Foods To Avoid</h2><ul><li>Raw or undercooked meat and eggs</li><li>Unpasteurised dairy</li><li>High-mercury fish</li><li>Excess caffeine (limit to 200 mg/day)</li></ul><p>Every pregnancy is unique — always pair your plan with your obstetrician's guidance.</p>`,
  },
];

const TESTIMONIALS = [
  {
    name: "Chandrakala N",
    role: "Weight Management Program",
    photo: "",
    rating: 5,
    result: "Lost 2.2 kg & 6 cm off waist in 2 months",
    text: "I had a very positive experience following the program. Within two months I saw clear and measurable improvements — my weight reduced by 2.2 kg and my waist came down by 6 cm. My body fat percentage and BMI also improved, and my overall InBody score increased. What stood out even more was how I felt — more energetic, lighter, better sleep and almost no leg pain. The approach felt structured and sustainable rather than extreme. I would recommend this to anyone looking for a disciplined and result-oriented plan.",
  },
  {
    name: "Geetha Murthy",
    role: "Weight & Body Composition Program",
    photo: "",
    rating: 5,
    result: "Lost 5.8 kg in 3 months",
    text: "I had an excellent experience with Dr. Sushma Appaiah over the last 3 months. I lost 5.8 kg with major improvements in body fat, waist and hip measurements, visceral fat, and overall body composition. My energy levels are good and my periods remained regular, which shows the diet was healthy and well balanced. The results feel sustainable, not extreme. Truly professional guidance — highly recommend Dr. Sushma Appaiah.",
  },
  {
    name: "Shruthi Vinayak",
    role: "Gut Health & Weight Gain",
    photo: "",
    rating: 5,
    result: "Healthy weight gain & new energy in 3 months",
    text: "I went to GOLZ with gut issues. Dr. Sushma gave me a diet plan which was not only simple to follow — all the ingredients were from the kitchen and easily available in the market. In just 3 months I saw tremendous change in my health. I was underweight and struggling to gain weight; my weight started increasing and I started feeling more energetic. Along with the diet she gave me pranayama which helped me become more stable emotionally and mentally. It was a complete holistic approach in a natural way. I would recommend GOLZ nutrition to everyone who wants to lead a happy, healthy and peaceful life. Thank you Dr. Sushma from the bottom of my heart.",
  },
];

const GENERAL = {
  clinicName: "GOLZ (Giggles of Livez)",
  tagline: "Personalized Nutrition Care, Mysuru",
  email: "nutrigolz@gmail.com",
  phone: "+91 934-267-4406",
  whatsapp: "919342674406",
  address: "@Kshema Healthcare, #338, Bogadi Main Road, Bogadi, Mysuru, Karnataka 570026",
  mapEmbed: "https://maps.google.com/maps?q=Bogadi%20Main%20Road%20Mysuru%20Karnataka%20570026&t=&z=14&ie=UTF8&iwloc=&output=embed",
  workingHours: [
    { day: "Monday – Saturday", hours: "10:30 AM – 5:00 PM" },
    { day: "Sunday", hours: "Closed" },
  ],
  socials: {
    facebook: "https://www.facebook.com/company/golzmysuru",
    instagram: "https://www.instagram.com/golzmysuru/",
    youtube: "",
    twitter: "https://x.com/GolzMysuru",
    linkedin: "",
  },
  currency: "₹",
};

const HOMEPAGE = {
  heroTitle: "Real food. Real plans. Real results—built around you.",
  heroSubtitle:
    "GOLZ is a science-backed platform offering personalized nutrition plans designed to improve your health without giving up the foods you love, serving a global clientele with clinical nutrition.",
  heroBadge: "Personalized Nutrition Care Since 2015",
  heroImage: "/media/gallery/2019/one-day-workshop-enteral-nutrition-in-the-critically-dec-2019/pic-2-1600.webp",
  heroPortrait: "/hero-banner.png",
  ctaPrimary: { label: "Book a Consultation", link: "/contact" },
  ctaSecondary: { label: "Explore Services", link: "/services" },
  stats: [
    { value: 19, suffix: "+", label: "Years of changing lives with nutrition and wellness programs" },
    { value: 13, suffix: "+", label: "Countries with global clientele" },
    { value: 5000, suffix: "+", label: "Personalized diet plans delivered" },
    { value: 3000, suffix: "+", label: "Specialized diet plans for children" },
  ],
  trustItems: [
    { title: "Certified Nutrition Expert", text: "Ph.D. — CSIR-CFTRI, Mysuru" },
    { title: "Personalized Plans", text: "Every plan built around your body & goals" },
    { title: "Online & In-Clinic", text: "Consult from home or visit us in Mysuru" },
    { title: "Science-Based Nutrition", text: "Every recommendation is evidence-backed" },
    { title: "Continuous Support", text: "We stay with you until results stick" },
  ],
  aboutPreview: {
    title: "Meet Dr. Sushma Appaiah",
    text: "Dr. Sushma Appaiah is the Founder of GOLZ (Giggles of Livez) and a distinguished nutrition scientist with 19 years of experience in clinical nutrition, corporate wellness, and health counselling.\n\nKarnataka Pride Award for remarkable achievements & transformative contributions in the field of nutrition and wellness.\n\nShe holds a Ph.D. in Food Science & Technology from CSIR-CFTRI, Mysore, and an M.Sc. in Food & Nutrition (2nd Rank) from the University of Mysore.\n\nOver the years, she has helped clients across 13 countries achieve sustainable health through evidence-based nutrition and personalized care.\n\nA recipient of the DST Women Scientist Award and recognized as the Most Innovative Nutrition Counsellor of the Year, Dr. Sushma is known for developing innovative food formulations for special children and translating scientific research into practical nutrition solutions.\n\nHER AREAS OF EXPERTISE INCLUDE REVERSING DIABETES, PCOD (RECENTLY TERMED AS PMOS), THYROID DISORDERS, PREGNANCY NUTRITION, SPORTS NUTRITION, ASD/ AUTISM AND SPECIAL CHILDREN NUTRITION, NUTRIGENOMICS, GUTBIOMICS, EMPOWERING INDIVIDUALS AND FAMILIES TO BUILD HEALTHIER LIVES THROUGH PERSONALIZED NUTRITION.",
    image: "/doctor-portrait.jpg",
    buttonLabel: "Know More",
    buttonLink: "/about",
    list: [
      "Clinical Nutrition Expert",
      "Lifestyle Disease Management",
      "Personalized Diet Plans",
      "Child & Women's Nutrition Specialist",
    ],
  },
  whyChooseUs: [
    { icon: "Utensils", title: "Personalized Meal Plans", text: "Custom plans for your body type, lifestyle and food preferences." },
    { icon: "FlaskConical", title: "Evidence-Based Guidance", text: "Protocols grounded in clinical research, not trends." },
    { icon: "HeartHandshake", title: "Special-Child Expertise", text: "Proven plans for autism, ADHD and specially-abled children." },
    { icon: "Wallet", title: "Affordable Packages", text: "Premium care at prices designed for every budget." },
    { icon: "RefreshCcw", title: "Regular Follow-Ups", text: "Structured check-ins keep you on track week after week." },
    { icon: "TrendingUp", title: "Long-Term Results", text: "Habits that last — so results stay, for good." },
  ],
  cta: {
    title: "Ready to Start Your Health Journey?",
    subtitle: "Book your consultation today and get a plan designed around you.",
    buttonLabel: "Book Now",
    buttonLink: "/contact",
    image: "/media/gallery/2021-b-1/obesity-myths-and-facts-get-in-depth-understanding-webinar-april-2021-by-golz/obesity-1-1600.webp",
  },
};

const ABOUT = {
  heroTitle: "About Dr. Sushma Appaiah",
  name: "Dr. Sushma Appaiah",
  designation: "Founder & Nutrition Scientist, GOLZ",
  image: "/doctor-portrait.jpg",
  bio: "Dr. Sushma Appaiah is the Founder of GOLZ (Giggles of Livez) and a distinguished nutrition scientist with 19 years of experience in clinical nutrition, corporate wellness, and health counselling.\n\nKarnataka Pride Award for remarkable achievements & transformative contributions in the field of nutrition and wellness.\n\nShe holds a Ph.D. in Food Science & Technology from CSIR-CFTRI, Mysore, and an M.Sc. in Food & Nutrition (2nd Rank) from the University of Mysore.\n\nOver the years, she has helped clients across 13 countries achieve sustainable health through evidence-based nutrition and personalized care.\n\nA recipient of the DST Women Scientist Award and recognized as the Most Innovative Nutrition Counsellor of the Year, Dr. Sushma is known for developing innovative food formulations for special children and translating scientific research into practical nutrition solutions.\n\nHER AREAS OF EXPERTISE INCLUDE REVERSING DIABETES, PCOD (RECENTLY TERMED AS PMOS), THYROID DISORDERS, PREGNANCY NUTRITION, SPORTS NUTRITION, ASD/ AUTISM AND SPECIAL CHILDREN NUTRITION, NUTRIGENOMICS, GUTBIOMICS, EMPOWERING INDIVIDUALS AND FAMILIES TO BUILD HEALTHIER LIVES THROUGH PERSONALIZED NUTRITION.",
  story:
    "Dr. Sushma Appaiah is the Founder of GOLZ (Giggles of Livez) and a distinguished nutrition scientist with 19 years of experience in clinical nutrition, corporate wellness, and health counselling. She holds a Ph.D. in Food Science & Technology from CSIR-CFTRI, Mysore, and an M.Sc. in Food & Nutrition (2nd Rank) from the University of Mysore. Over the years, she has helped clients across 13 countries achieve sustainable health through evidence-based nutrition and personalized care.",
  approach:
    "Since founding GOLZ in Mysore in 2015, she's grown it into two centres serving clients across 13 countries — but the philosophy has never changed: nutrition should be personal. She doesn't hand out generic meal charts. She reads your body — your condition, your labs, even your genetics through nutrigenomics — and builds a plan that fits your life. Over the years, that approach has helped thousands reverse diabetes, manage PCOS and thyroid issues, recover from illness, and simply feel better.",
  helpGroups: [
    {
      title: "Metabolic & Lifestyle",
      items: ["Diabetes reversal", "PCOS", "Thyroid", "Weight management", "Onco (cancer recovery)", "Sports nutrition", "Stress & mental wellbeing"],
    },
    {
      title: "Life-stage & Family",
      items: ["Pregnancy, GDM & lactation", "ASD/Autism & ADHD child nutrition", "Nutrigenomics, Gutbiomics"],
    },
  ],
  specialNeeds: {
    heading: "Nutrition for children with special needs",
    text: "Specialised child nutrition is at the heart of Dr. Sushma's work — she's delivered over 3,000 diet plans for children with ASD/Autism, ADHD, and developmental needs, through institutions like AIISH (Mysore) and early-intervention school programs. Certified in Autism & ADHD Nutrition Therapy (Cambridge International Institute, UK), she builds gentle, practical plans that work with a child's sensitivities, not against them.",
    stat: { value: 3000, suffix: "+", label: "diet plans delivered for children with special needs" },
    credibility: "Certified in Autism & ADHD Nutrition Therapy, Level 1 & 2 — Cambridge International Institute, UK",
    ctaLabel: "Book a consultation for your child",
  },
  credentials: [
    "Ph.D, Food Science & Technology — CSIR-CFTRI, Mysore",
    "M.Sc, Food & Nutrition (2nd Rank) — University of Mysore",
    "Advanced Nutrigenomics Expert — Genebox Academy",
    "Autism & ADHD Nutrition Therapy, Level 1 & 2 — Cambridge International Institute, UK",
    "19 years in personalised nutrition counselling",
  ],
  recognition: [
    "Karnataka Pride Award for remarkable achievements & transformative contributions in nutrition and wellness",
    "Women Achiever entrepreneur from Academia",
    "Changemaker Award Feb/2022 by Aryan Institute",
    "Awarded women achiever entrepreneur impacting Global health",
    "Most Innovative Nutrition counsellor of the year 2019-20",
    "Special Recognition for Innovative food formulations",
    "DST Women Scientist Awardee",
    "Won awards for best research presentations",
  ],
  recognitionFootnote: "…among 10+ national and international honours.",
  speaking: {
    eyebrow: "Speaking",
    title: "Speaking Engagements & Expertise",
    since: "Since 2015 onwards",
    items: [
      "Invited speaker for more than 40–45 national and international conferences.",
      "Delivered more than 250 invited talks on prevention and management of disease as nutrition counsellor/invited speaker at academic and public forums, Pan India.",
    ],
  },
  professionalAffiliations: {
    eyebrow: "Memberships",
    title: "Professional Affiliations",
    items: [
      "Life member — Association of Food Scientists and Technologists, India (AFSTI)",
      "Life member — Indian Dietetics Association (IDA)",
      "Life member — Indian Nutritional Medical Association (INMA)",
    ],
  },
  beyondClinic:
    "Beyond her practice, Dr. Sushma shapes how nutrition is taught in India. She's developed UGC-approved nutrition programs, convenes the Indian Dietetics Association's Mysore chapter, has delivered 250+ invited talks, published 15+ peer-reviewed papers, and — during the pandemic — coordinated nutrition training for 20,000+ Anganwadi and ASHA workers across the country.",
  affiliations: "AFSTI · Indian Dietetics Association (IDA) · Indian Nutritional Medical Association (INMA)",
  mission: "To make evidence-based nutrition simple, accessible and enjoyable — so every client can achieve lasting health without deprivation or fad diets.",
  vision: "A world where personalized nutrition is the first line of defence against lifestyle disease, not the last resort.",
  qualifications: [
    "Ph.D. Food Science & Technology, CSIR-CFTRI, Mysore",
    "M.Sc. Food & Nutrition (2nd Rank), University of Mysore",
    "Certified Diabetes Educator (CDE)",
    "Certified Sports Nutritionist",
  ],
  certifications: [
    "DST Women Scientist Award recipient",
    "Most Innovative Nutrition Counsellor of the Year",
    "Certified Nutrigenomics Counsellor — Gene Box Academy",
    "Special Child Nutrition Specialist",
  ],
  experienceYears: 19,
  achievements: [
    "Recipient of the DST Women Scientist Award",
    "Recognized as the Most Innovative Nutrition Counsellor of the Year",
    "Helped clients across 13 countries",
    "Developed innovative food formulations for special children",
  ],
  stats: [
    { value: 19, suffix: "+", label: "Years Experience" },
    { value: 15000, suffix: "+", label: "Programs Completed" },
    { value: 5000, suffix: "+", label: "Diet Plans Delivered" },
    { value: 3000, suffix: "+", label: "Plans for Special Kids" },
  ],
  timeline: [
    { year: "2007", title: "Began Clinical Practice", text: "Started her journey in clinical nutrition and food science after completing M.Sc. with 2nd Rank at the University of Mysore." },
    { year: "2012", title: "Ph.D. from CSIR-CFTRI", text: "Completed doctoral research in Food Science & Technology at India's premier food research institute." },
    { year: "2015", title: "Founded GOLZ", text: "Launched GOLZ (Giggles of Livez) in Mysuru with a vision of joyful, personalized nutrition care." },
    { year: "2019", title: "15,000+ Programs Milestone", text: "Crossed 15,000 nutrition & health programs completed for clients across India and beyond." },
    { year: "2022", title: "Clients Across 13 Countries", text: "Expanded online consultations, serving clients worldwide with precision, DNA-personalized nutrition." },
    { year: "2025", title: "National Recognition", text: "Honored as the Most Innovative Nutrition Counsellor of the Year." },
  ],
  whyTrust: [
    { icon: "Award", title: "Evidence-Based Care", text: "Protocols follow the latest clinical research and food science." },
    { icon: "HeartHandshake", title: "Special-Child Expertise", text: "Trusted plans for autism, ADHD and specially-abled children." },
    { icon: "ClipboardCheck", title: "Precision Tracking", text: "Body composition analysis and regular monitoring at every step." },
    { icon: "Clock", title: "On-Time Results", text: "Clear milestones and measurable, sustainable progress." },
  ],
};

const SEO = {
  metaTitle: "GOLZ (Giggles of Livez) — Personalized Nutrition Care, Mysuru",
  metaDescription:
    "Dr. Sushma Appaiah's GOLZ — science-backed, personalized nutrition plans in Mysuru for weight, diabetes, thyroid, PCOS, pregnancy, children & special needs. Online & in-clinic consultations.",
  keywords: "nutritionist Mysuru, dietitian Mysuru, diabetes diet, PCOS diet, thyroid nutrition, special child nutrition, pregnancy diet, weight loss program",
  ogImage: "/media/gallery/2021-b-1/obesity-myths-and-facts-get-in-depth-understanding-webinar-april-2021-by-golz/obesity-1-1600.webp",
  favicon: "",
};

const CONTACT_SEED = [
  { name: "Meera Joshi", email: "meera@example.com", phone: "+91 90000 11111", subject: "Weight management plan", message: "Hello, I would like to know about the weight management program pricing and whether online consultations are available.", read: true, replied: true },
  { name: "Vikram Rao", email: "vikram@example.com", phone: "+91 90000 22222", subject: "Diabetes consultation", message: "My father (58) was diagnosed with prediabetes. Can you please share details about the diabetes program?", read: false, replied: false },
];

const RESET = process.argv.includes("--reset");

export async function seedIfEmpty({ force = RESET } = {}) {
  const count = await User.countDocuments();
  if (!force && count > 0) {
    console.log("[seed] data already present, skipping. Use `npm run seed -- --reset` to re-seed.");
    return false;
  }

  if (force) {
    console.log("[seed] resetting database…");
    await mongoose.connection.dropDatabase();
  }

  console.log("[seed] seeding demo content...");

  await User.create({
    name: "Admin",
    email: "nutrigolz@gmail.com",
    password: await bcrypt.hash("Newwebgolz@2026", 10),
    role: "admin",
  });

  const services = [];
  for (const [i, s] of SERVICES.entries()) {
    services.push(await Service.create({ ...s, slug: slugify(s.title), order: i + 1 }));
  }

  for (const [i, b] of BLOGS.entries()) {
    await Blog.create({
      ...b,
      slug: slugify(b.title),
      author: "Dr. Sushma Appaiah",
      readingTime: estimateReadingTime(b.content),
      published: true,
      publishedAt: new Date(Date.now() - i * 4 * 86400000),
      views: Math.floor(300 + Math.random() * 4000),
    });
  }

  for (const [i, t] of TESTIMONIALS.entries()) {
    await Testimonial.create({ ...t, featured: true });
  }

  await ContactMessage.create(CONTACT_SEED);
  await Setting.create({ key: "general", value: GENERAL });
  await Setting.create({ key: "homepage", value: HOMEPAGE });
  await Setting.create({ key: "about", value: ABOUT });
  await Setting.create({ key: "seo", value: SEO });

  // Sample visitor analytics for the dashboard chart
  const paths = ["/", "/about", "/services", "/gallery", "/blog", "/contact", "/blog/10-foods", "/services/weight-management"];
  for (let d = 13; d >= 0; d--) {
    const date = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
    for (const p of paths) {
      if (Math.random() > 0.35) {
        await Visitor.create({ date, path: p, count: Math.floor(10 + Math.random() * 90) });
      }
    }
  }

  console.log("[seed] done. Admin login → nutrigolz@gmail.com / Admin1234");
  return true;
}

async function main() {
  await connectDB();
  await seedIfEmpty();
  await mongoose.disconnect();
  process.exit(0);
}

if (process.argv[1]?.endsWith("seed.js")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
