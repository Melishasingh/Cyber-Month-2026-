/* ============================================================
   CYBER ARCADE — CONFIGURATION
   This is the ONLY file you need to edit.
   See SETUP.md for step-by-step instructions.
   ============================================================ */

window.CYBER_CONFIG = {

  /* ---------- PROGRAM ---------- */
  programName: "Cybersecurity Awareness Month",
  programYear: "2026",

  /* Only these email domains may play. Keeps the leaderboard clean
     and stops random internet traffic from filling your sheet. */
  allowedEmailDomains: ["coupa.com"],

  /* Set to false if you'd rather not require an email to play.
     (Tracking and the leaderboard will be disabled.) */
  requireEmail: true,

  /* Mask emails on the public leaderboard: mel***@coupa.com
     Recommended ON. You still see full emails in your own sheet. */
  maskLeaderboardEmails: true,

  /* ---------- WEEK RELEASE DATES (America/Los_Angeles) ----------
     Games lock on the hub until their release date. Set all four to
     a past date if you want everything open immediately. */
  weekUnlockDates: {
    1: "2026-10-01",
    2: "2026-10-08",
    3: "2026-10-15",
    4: "2026-10-22"
  },
  /* Set to false to ignore the dates above and unlock everything. */
  enforceUnlockDates: false,

  /* ---------- GOOGLE FORM (score capture) ----------
     From your form's URL:
     https://docs.google.com/forms/d/e/1FAIpQLSev2LRvh_38bKi5GFZF4IYba9CKvmKesDDX-pirHv3WhjsGgQ/viewform
     Paste FORM_ID_HERE below (the long string starting 1FAIpQL...). */
  googleForm: {
    enabled: true,                 // <-- flip to true once IDs are filled in
    formId: "1FAIpQLSev2LRvh_38bKi5GFZF4IYba9CKvmKesDDX-pirHv3WhjsGgQ",

    /* Field IDs from your form. SETUP.md shows how to find these
       in 30 seconds. They look like "entry.1234567890". */
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

  /* ---------- LEADERBOARD (reads your responses sheet) ----------
     In your responses Sheet: File > Share > Publish to web >
     select the sheet > Comma-separated values (.csv) > Publish.
     Paste the whole published URL below. */
  leaderboard: {
    enabled: true,                 // <-- flip to true once URL is filled in
    publishedCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZ_MwFIJzZ7eQkIXmRm4wAx1KOQ7xwl6hiC_rIFjRenVqTqOLUn9iHevZ_6rzW_-CxSGc1feBuZ3e_/pub?gid=0&single=true&output=csv",
    topN: 15,
    /* Column headers in your sheet, as they actually appear. */
    columns: {
      email: "Email",
      name:  "Name",
      week:  "Week",
      score: "Score"
    }
  },

  /* ---------- OPTIONAL ---------- */
  /* Shown on the hub and in results. Point people somewhere real. */
  reportPhishingHowTo: "Use the Phish Hook button in Gmail to report a phish, or forward to your security team.",
  securityContact: "",              // e.g. "security@coupa.com" — leave blank to hide

  /* Departments offered in the start-screen dropdown. */
  departments: [
    "Engineering", "Product", "Sales", "Marketing", "Customer Success",
    "Finance", "Legal", "People / HR", "IT", "Operations", "Other"
  ],

  soundDefaultOn: true
};
