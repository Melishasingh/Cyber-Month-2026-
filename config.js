/* ============================================================
   CYBER ARCADE — CONFIGURATION
   ============================================================ */

window.CYBER_CONFIG = {

  /* ---------- PROGRAM ---------- */
  programName: "Cybersecurity Awareness Month",
  programYear: "2026",

  allowedEmailDomains: ["coupa.com"],
  requireEmail: true,
  maskLeaderboardEmails: true,

  /* ---------- WEEK RELEASE DATES ---------- */
  weekUnlockDates: {
    1: "2026-10-01",
    2: "2026-10-08",
    3: "2026-10-15",
    4: "2026-10-22"
  },
  enforceUnlockDates: false,

  /* ---------- GOOGLE FORM (Background Score Capture) ---------- */
  googleForm: {
    enabled: true,
    formId: "1FAIpQLSev2LRvh_38bKi5GFZF4IYba9CKvmKesDDX-pirHv3WhjsGgQ",

    fields: {
      email:          "entry.872374964",
      name:           "entry.63413120",
      department:     "entry.895236575",
      week:           "entry.2005762378",
      gameTitle:      "entry.760262254",
      score:          "entry.120848288",
      maxScore:       "entry.1487419042",
      accuracy:       "entry.940510508",
      timeSeconds:    "entry.1499180504",
      completionCode: "entry.912360528"
    }
  },

  /* ---------- LEADERBOARD (Disabled) ---------- */
  leaderboard: {
    enabled: false,
    publishedCsvUrl: "",
    topN: 15,
    columns: { email: "Email", name: "Name", week: "Week", score: "Score" }
  },

  /* ---------- OPTIONAL ---------- */
  reportPhishingHowTo: "Use the Phish Hook button in Gmail to report a phish, or forward to your security team.",
  securityContact: "",

  departments: [
    "Engineering", "Product", "Sales", "Marketing", "Customer Success",
    "Finance", "Legal", "People / HR", "IT", "Operations", "Other"
  ],

  soundDefaultOn: true
};
