# Coupa Cyber Arcade — Setup Guide

Everything here works with a normal employee account. No admin rights, no service accounts, no servers, no budget.

**Time to set up: about 25 minutes.** Most of it is creating the Google Form.

---

## 1. What you have

| File | What it is |
|---|---|
| `index.html` | The hub. This is the link you send people. |
| `week1-phishing.html` | Week 1 — *Inbox Zero-Day* |
| `week2-ai-deepfakes.html` | Week 2 — *Synthetic* |
| `week3-data-passwords.html` | Week 3 — *Vault Breaker* |
| `week4-incident-reporting.html` | Week 4 — *Code Blue* |
| `arcade.css` / `arcade.js` | Shared look and shared engine (scoring, tracking, leaderboard) |
| `config.js` | **The only file you edit.** |

All seven files must sit in the **same folder**. Don't rename anything.

---

## 2. Where to host it

### Option A — GitHub Pages (recommended)

You already have repos, and this is the option that makes the leaderboard work properly.

1. Create a new repo, e.g. `cyber-arcade`. **Public** is required for free GitHub Pages.
2. Upload all seven files to the root of the repo (drag and drop in the browser works).
3. **Settings → Pages → Source: Deploy from a branch → Branch: `main`, folder: `/ (root)` → Save.**
4. Wait 1–2 minutes. Your link is `https://<your-username>.github.io/cyber-arcade/`

**A note on "public":** the repo being public means anyone who finds the URL can play. There is nothing confidential in these files — every company, person and incident is invented, and no real Coupa system, domain or process is referenced. Worth a quick sanity check with your security team anyway, since it will carry Coupa branding. If they'd rather it not be public, use Option B.

### Option B — SharePoint / OneDrive

Works, with one limitation: SharePoint often serves HTML as a download rather than rendering it, and the live leaderboard usually won't load because of how SharePoint handles cross-origin requests. Scores still submit to your form fine.

1. Upload the folder to a SharePoint document library.
2. Share the folder with **Everyone in the organisation → can view**.
3. Send people the link to `index.html`.
4. Test it in an incognito window first. If it downloads instead of opening, use Option A.

### Option C — Netlify Drop (fastest, zero account setup)

Go to `app.netlify.com/drop` and drag the folder in. You get a URL instantly. Sign in afterwards if you want to keep it permanently. Good for testing even if you deploy elsewhere.

---

## 3. Create the Google Form (score capture)

Create a **new blank form** called something like "Cyber Arcade Scores". Add these **ten questions, in this order**, all as **Short answer**:

1. `Email`
2. `Name`
3. `Department`
4. `Week`
5. `Game`
6. `Score`
7. `Max Score`
8. `Accuracy`
9. `Time Seconds`
10. `Completion Code`

Important settings:

- Leave **every question not required**. The games submit silently; a required field can block a submission.
- **Do not** turn on "Collect email addresses" — the game sends the email itself, and Google's own collection would force a sign-in prompt.
- **Do not** turn on "Limit to 1 response" — people replay, and you want their best score.

### Get the Form ID

Your form's edit URL looks like:

```
https://docs.google.com/forms/d/e/1FAIpQLSdXXXXXXXXXXXXXXXXXXXXXXXX/viewform
```

Click **Send → link icon** to see the `/viewform` URL. The long string starting `1FAIpQL...` is your **Form ID**. Paste it into `config.js`.

### Get the ten field IDs (no dev tools needed)

1. In the form editor, click the **⋮ menu (top right) → Get pre-filled link**.
2. Type a **different number into each field**: `1` in Email, `2` in Name, `3` in Department, `4` in Week, `5` in Game, `6` in Score, `7` in Max Score, `8` in Accuracy, `9` in Time Seconds, `10` in Completion Code.
3. Click **Get link → Copy link**.
4. Paste it into a text editor. You'll see something like:

```
...viewform?usp=pp_url&entry.1234567890=1&entry.9876543210=2&entry.5555555555=3...
```

The number you typed tells you which field each `entry.` ID belongs to. `=1` is Email, `=2` is Name, and so on.

5. Copy each ID into `config.js`:

```js
googleForm: {
  enabled: true,                       // <-- change to true
  formId: "1FAIpQLSdXXXXXXXXXXXXXXXX",
  fields: {
    email:          "entry.1234567890",
    name:           "entry.9876543210",
    department:     "entry.5555555555",
    week:           "entry....",
    gameTitle:      "entry....",
    score:          "entry....",
    maxScore:       "entry....",
    accuracy:       "entry....",
    timeSeconds:    "entry....",
    completionCode: "entry...."
  }
}
```

### Test it

Play a game to the end. Then open the form's **Responses** tab. Your row should be there within a few seconds.

If nothing arrives: re-check the Form ID, confirm no question is marked required, and confirm you didn't enable email collection.

---

## 4. Turn on the live leaderboard

The leaderboard reads a **published CSV** of your responses. Anyone with the game link could in principle find that CSV URL, so publish a **separate tab that excludes email addresses**. Five minutes, and it means no work email is ever exposed on a public URL.

1. In the form's **Responses** tab, click the Sheets icon to create the responses spreadsheet.
2. In that spreadsheet, add a new tab called `Leaderboard`.
3. In cell `A1` of the new tab, paste:

```
=QUERY('Form Responses 1'!A:J, "SELECT C, E, G WHERE C IS NOT NULL LABEL C 'Name', E 'Week', G 'Score'", 1)
```

4. **Check the column letters.** In the responses tab, column A is the timestamp, so your ten questions land in B–K: B = Email, C = Name, D = Department, E = Week, F = Game, G = Score. Adjust the letters in the formula if your order differs. You want exactly three columns out: Name, Week, Score.
5. **File → Share → Publish to web.** In the dialog: select the **`Leaderboard`** tab (not "Entire document"), choose **Comma-separated values (.csv)**, click **Publish**.
6. Copy the URL it gives you and put it in `config.js`:

```js
leaderboard: {
  enabled: true,                       // <-- change to true
  publishedCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=123&single=true&output=csv",
  topN: 15,
  columns: { email: "Email", name: "Name", week: "Week", score: "Score" }
}
```

Leave the `columns` block exactly as-is even though your published tab has no Email column — the engine falls back to Name automatically.

**How totals work:** each player's **best score per week** is kept, and the four weeks are added. Everyone can reach 4,000. Replaying can only improve someone's total, never hurt it.

**Refresh delay:** published sheets cache for around five minutes, so a new score may take a few minutes to appear on the board. This is normal and worth mentioning in your comms so nobody reports it as a bug.

---

## 5. Finish `config.js`

The rest is quick:

```js
allowedEmailDomains: ["coupa.com"],    // add others if contractors need to play
enforceUnlockDates: true,              // set false to open all four immediately
weekUnlockDates: { 1:"2026-10-01", 2:"2026-10-08", 3:"2026-10-15", 4:"2026-10-22" },
securityContact: "",                   // add your real address to show it in-game
reportPhishingHowTo: "Use the Report Phishing button in Outlook, or forward to your security team."
```

**Set `enforceUnlockDates: false` while you're testing**, or weeks 2–4 will be locked and you can't check them.

Please do put a real `securityContact` in. Week 1 spends ten rounds teaching people to report things, and it lands much better when it can point at an actual address.

---

## 6. Pre-launch checklist

- [ ] All four games open from the hub and play through to a score
- [ ] A test row appears in your Google Form responses
- [ ] The leaderboard renders on the hub (allow five minutes after the first score)
- [ ] Tried it on a phone — all four games are built to work on mobile
- [ ] Someone outside your team played one game without you explaining anything
- [ ] Set `enforceUnlockDates: true` and confirmed weeks 2–4 show as locked
- [ ] Your security team has seen the Week 1 content, in case any scenario cuts close to a real incident

---

## 7. Verifying completion for prizes

Two independent ways to confirm someone played:

**The form responses** are your source of truth. Filter by `Week` to see who completed each one. This is what you'd use to draw a prize.

**Completion codes** are the backup. Each game shows a code like `CYB-W2-4KX9P-847`. It's derived from the player's email and the week, so:

- The same person always gets the same middle segment for a given week — a code cannot be borrowed from a colleague.
- The final number is their score.
- `W2` is the week.

So `CYB-W2-4KX9P-847` means "this person scored 847 on Week 2". If someone's tracking failed but they have a code, you can accept it and cross-check it against a code they generate in front of you.

**Suggested prize structure**, since raw score favours whoever plays most:

- **Completion prize** — a draw among everyone who finished all four weeks. This drives the behaviour you actually want.
- **Leaderboard prize** — top three by total score.
- **Team prize** — highest average score by department, using the Department field. This one tends to generate the most chat.

---

## 8. Rollout copy you can lift

**Week 1 announcement:**

> October is Cybersecurity Awareness Month, and this year it isn't a slide deck.
>
> Four games, one a week, eight minutes each. Week 1 drops you into an inbox where some messages are real and some will cost the company money — you have 38 seconds per message to work out which. There's a leaderboard.
>
> Play Week 1: [link]
>
> Finish all four and you're in the draw for [prize].

**Weekly nudge:**

> Week [N] is live: **[game name]** — [one line]. Eight minutes. [link]
>
> [X] people have played so far. Current leader: [name] on [score] of 4,000.

Publishing the leaderboard standings in each weekly message is the single biggest driver of participation. It costs you thirty seconds and it works.

---

## 9. Troubleshooting

**Scores aren't reaching the form.** Nine times in ten it's a required question. Open the form editor and confirm every question's "Required" toggle is off. Then re-check the Form ID has no trailing spaces.

**The leaderboard says it can't be reached.** Confirm you published the sheet as **CSV** (not "web page"), and that you selected a specific tab rather than "Entire document". Then open the published URL directly in a browser — you should see raw comma-separated text. If SharePoint is your host, the leaderboard may be blocked there; use GitHub Pages or Netlify for the hub.

**The leaderboard is empty but scores are arriving.** Check the column letters in your QUERY formula. Open the `Leaderboard` tab and confirm you're seeing three columns headed Name, Week, Score with data under them.

**Someone says a game is locked.** Either the unlock date hasn't passed, or their browser cached an older `config.js`. Ask them to hard-refresh (Ctrl+Shift+R / Cmd+Shift+R).

**Fonts look wrong.** The games load Poppins from Google Fonts. If your network blocks it, they fall back to a system font and everything still works — it just isn't quite on-brand. If that matters, download the Poppins `.woff2` files into the folder and swap the `@import` at the top of `arcade.css` for a local `@font-face`.

**Progress disappeared.** Completion codes and the "Your progress" table are stored in the browser only, so they don't survive clearing cookies or switching device. Submitted scores are unaffected — the form has them.

---

## 10. Editing the content

Everything is plain text inside each game file, right at the top of the `<script>` block. No build step, no dependencies — edit, save, re-upload.

- **Week 1** — the `ITEMS` array. Each entry is one message. `answer` is `'report'`, `'legit'` or `'verify'`; the `c(text, 1, 'why')` wrappers mark clickable clues (`1` = a real clue, `0` = a decoy that costs points).
- **Week 2** — `CALLS` (call scenarios), `PROMPTS` (the AI triage rounds), and the `FRAME_A_SPOTS` / `FRAME_B_SPOTS` arrays, where `hit:1` is a real artifact.
- **Week 3** — `ASSETS` (classification items), `LEVELS` (the crack-lab targets), `CASCADE` (the reuse puzzle), and `WORDS` if you want the analyser to recognise more common words. Coupa-specific words are already in there.
- **Week 4** — the `CASES` array. Each choice has `q` (quality, 0–100), `d` (meter effects) and `fb` (the explanation shown afterwards).

Two suggestions if you do edit. **Keep some legitimate messages in Week 1** — reporting a genuine email is scored as wrong on purpose, and that's the part that stops people from reflexively reporting everything. And **keep the "manager asks you not to escalate" decision in Week 4**, even though it's uncomfortable. It's the most valuable question in the whole set.
