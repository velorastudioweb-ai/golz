/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14231B",
        primary: {
          DEFAULT: "#1C4B37",
          dark: "#245B43",
          darker: "#14231B",
          light: "#E7EEE4",
          soft: "#D6E2D1",
        },
        terracotta: {
          DEFAULT: "#C97858",
          dark: "#B5694A",
        },
        olive: {
          DEFAULT: "#6E8B5C",
          dark: "#5C7A4C",
        },
        beige: "#F7F4EF",
        cream: "#FFFDF8",
        sageLight: "#EDF4EC",
        paper: "#F7F8F5",
        sage: "#E7EEE4",
        sage2: "#D6E2D1",
        lime: "#A3C644",
        limeDark: "#8BB531",
        honey: "#DFA63B",
        gold: "#DFA63B",
        charcoal: "#14231B",
        muted: "#5A6B60",
        accent: "#A3C644",
        offwhite: "#F7F8F5",
        line: "rgba(20, 35, 27, 0.12)",
      },
      fontFamily: {
        heading: ["Fraunces", "serif"],
        display: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      fontSize: {
        /* Standard body size is 16px everywhere. Re-pointing the Tailwind
           `sm` tier (used for nav, descriptions, labels, footer and admin
           tables) to 1rem resolves all of those areas to 16px at the source;
           `text-xs` remains the compact badge/metadata tier. */
        sm: ["1rem", { lineHeight: "1.6" }],
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(20, 35, 27, 0.25)",
        card: "0 22px 40px -28px rgba(20, 35, 27, 0.45)",
        lift: "0 30px 60px -30px rgba(20, 35, 27, 0.4)",
        popup: "0 40px 80px -30px rgba(0, 0, 0, 0.5)",
      },
      backgroundImage: {
        "hero-pattern":
          "radial-gradient(circle at 12% 18%, #E7EEE4 0%, transparent 50%), radial-gradient(circle at 88% 12%, #D6E2D1 0%, transparent 45%), radial-gradient(circle at 75% 85%, rgba(163, 198, 68, 0.14) 0%, transparent 40%)",
        "section-sage": "linear-gradient(180deg, #F7F8F5 0%, #E7EEE4 100%)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "spin-slow": "spin 14s linear infinite",
        marquee: "marquee 30s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
