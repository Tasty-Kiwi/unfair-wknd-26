# Needtrace — demo video production guide

Everything needed to record the Unfair Weekend submission video. **Target 2:40–2:45; acceptable range 2:30–2:50; never longer than 3:00.**

Every button label, click and screen state below was checked on the production site (`https://domino-os.tasty-kiwi.workers.dev`, `main` at `91bf9b4`) on 13 November 2026. A silent, automated reference run of this exact shot list hit every timestamp and finished at 2:45 (see [Reference footage](#reference-footage)). **No narrated video has been recorded.** That is a human task.

The story in one line: **one late delivery → the exact order it breaks → why → two fixes → apply one → it's your network too.** The product is on screen from the first frame. Don't use intro slides.

---

## 1. Setup (10 minutes before recording)

### Screen and browser

| Setting                | Value                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Display                | 1920×1080                                                                                                                                              |
| Browser                | Edge or Chrome, **new InPrivate/Incognito window** (clean storage, so **Core example** loads without prompts)                                          |
| Browser zoom           | **125%** (Ctrl + `+` until it shows 125%). The page then lays out at 1536×864, so the headline and the whole graph fit in one frame                    |
| Window                 | **Fullscreen (F11)**, so no tabs, address bar or bookmarks are visible                                                                                 |
| Theme                  | **Light.** Click the moon/sun button top-right of `/` until the page is light. The red shortage and blue alternative read best after video compression |
| On a 2560×1440 display | Use 167% zoom instead to get the same layout                                                                                                           |

### Tabs (open both before pressing F11)

1. `https://domino-os.tasty-kiwi.workers.dev/` is the simulator, where recording starts.
2. `https://domino-os.tasty-kiwi.workers.dev/landing` is the closing screen. Switch to it with **Ctrl+Tab** in shot 8.

### Starting state checklist

- [ ] Simulator shows **Normal operations** selected, the header says **All 10 covered**, and the headline reads **Every order has its required materials**. If not, click **Reset demo**.
- [ ] The page is scrolled to the very top.
- [ ] `https://domino-os.tasty-kiwi.workers.dev/api/health` returns `"cloudEnabled":false`. No sign-in controls appear anywhere, and none should be shown.
- [ ] Windows **Do not disturb** is on; notifications, chat apps and email are closed.
- [ ] The mouse pointer is enlarged slightly (Windows: Settings → Accessibility → Mouse pointer → size 2), or the recorder highlights clicks.
- [ ] Mic is tested, room is quiet, and a glass of water is at hand.

### Recorder

Any of these works. Use what the presenter knows.

- **OBS Studio (free):** Display Capture, canvas and output 1920×1080, **60 fps** (smooth scrolling), recording format MKV (remux to MP4 afterwards), encoder quality "High Quality" or CQP 18–20, audio 48 kHz.
- **Screen Studio** (event sponsor, macOS): its automatic zoom on clicks suits this demo well. Keep the zoom gentle.
- **Windows Snipping Tool / Xbox Game Bar:** acceptable fallback. Check that the output is 1080p.

Record the narration **live while clicking** (most natural), or record clean screen takes and add a voice-over in the editor. Either is fine. Don't use AI-generated voices: the voice should be a team member's.

---

## 2. Shot list and narration

Times are targets for the **final edit**. Speak at a relaxed pace, about 2.3 words per second. The narration totals about 300 words (no shot needs more than 2.4 words per second), which leaves room for pauses. **Bold** text in the Action column is the exact on-screen label to click.

### Shot 1 — 0:00–0:07 · Baseline (present the stakes immediately)

| Action                                                                                                                                       | Narration                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Start on `/` at the top. Rest the cursor on the headline **Every order has its required materials**, then on **All 10 covered** (top right). | "This is Needtrace. Here's a factory's order book: ten customer orders, and every one has its materials." |

### Shot 2 — 0:07–0:25 · The supplier delay breaks an order

| Action                                                                                                                                                                                                                                                                                       | Narration                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| At 0:07 click **Supplier disruption** (scenario bar). The headline turns red: **1 order at risk due to material shortage**. Then slowly move the cursor along the graph: **Aster Motion** (Late) → **Servo motor** (Short) → **Precision actuator** (At risk) → **ORD-102** (Short 2 units). | "Now one delivery slips. Aster's servo motors arrive six days late. Needtrace follows that delay through the motor and the product, straight to the order it breaks: ORD-102. Two motors short, and thirty-six thousand euros of order value at risk." |

On screen to let linger: the stat row **1 / 2 / 1** and the header **1 short · 2 units · €36,000**.

### Shot 3 — 0:25–0:50 · Why two motors? (inspectable allocation)

| Action                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Narration                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| At 0:25 click the **ORD-102** card in the graph. This opens ORD-102 in Allocation evidence further down, without scrolling. Scroll down to **Servo motor: supply against need**. Point at **ORD-101 needs 6**, then **ORD-102 needs 4 · Short 2 by 22 Nov, next receipt 23 Nov**. At about 0:40 scroll further to the **ORD-102 · Precision actuator** evidence and point at the red **Servo motor (pcs) · 2 of 4 allocated · short 2** card and **Arriving after 2026-11-22**. | "Why two? There are eight motors in stock. ORD-101 is due first, so it reserves six. That leaves two for ORD-102, which needs four by the twenty-second, and the late delivery only lands on the twenty-third. The allocation evidence spells out every quantity, so you can check the answer yourself." |

### Shot 4 — 0:50–1:15 · Two ways to recover

| Action                                                                                                                                                                                                                                                              | Narration                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scroll **up** to **Ways to recover**. Point at **Restore PO-101 timing**, then **Use Vector Components** (each shows **2 net units recovered · 0 orders still at risk**). Rest briefly on the assumption line **Assumes 2 approved units available on 2026-11-18…** | "So what can we do? Needtrace tests each option separately. We could get Aster back to its original date, or use two approved motors from Vector Components, available on the eighteenth. Both close the gap, and the assumptions stay visible: supply still needs confirming, and costs aren't modeled." |

### Shot 5 — 1:15–1:35 · Apply the alternative

| Action                                                                                                                                                                                                                                                                                                                                                                                                                                           | Narration                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| At 1:15 click **Apply recovery** on **Use Vector Components** (the dark button). The page stays on the timeline: point at **ALT-01 · 2 · 18 Nov**, with **PO-101 · 5 · 23 Nov** still late, and the header now reads **All 10 covered** (scenario **Approved recovery**). At about 1:24 scroll to the top: the headline is back to **Every order has its required materials**, and the graph card reads **Recovery active · Vector Components**. | "Let's apply Vector. The alternative motors land before the twenty-second, and all ten orders are covered again, even though Aster's delivery is still late. Up top, every order has its materials, and Vector is marked as the active recovery." |

### Shot 6 — 1:35–1:47 · Scenarios side by side (cut first if running long)

| Action                                                                                                                                                  | Narration                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Scroll down to **Scenarios side by side**. Point at the **Supplier disruption** row (1 · 2 · €36,000), then the **Approved recovery** row (0 · 0 · €0). | "And here are all three scenarios side by side: the normal plan, the disruption, and the recovery." |

### Shot 7 — 1:47–2:22 · The visual builder and local saving

| Action                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Narration                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Scroll to the top and click **Build a network** (top bar). Click **Core example**: the page title becomes **Motor assembly network**. Scroll down about a third of a screen so the canvas fills the frame. Click the **Servo motor** node; the inspector on the right shows it. Glide across **Customer A** and **Receipt**. Scroll back up, click **Save workspace**, and point at **Saved locally** (right end of the toolbar), then at **Export workspace JSON**. | "The same engine works on your own network. In the builder, you connect suppliers, components, deliveries, products and customer orders, then test named disruptions against your baseline. Click any item to edit it. Your workspace saves right here on this device, with no account needed, and you can export it as JSON." |

Do **not** click **Import workspace JSON** (it opens a system file dialog), and don't show any sign-in or cloud controls.

### Shot 8 — 2:22–2:45 · Close

| Action                                                                                                                                                                                                                                                    | Narration                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Press **Ctrl+Tab** to the `/landing` tab. Its hero reads **One late delivery. See the orders at risk.**, with the Aster Motion **17 → 23 Nov** card and **ORD-102 · 2 motors short**. Keep the mouse still. Hold for about 5 seconds after the last word. | "Needtrace. See what breaks before it breaks, and test a fix before you commit. Everything you saw uses fictional data, and Needtrace models material availability, not factory capacity or costs. Try it yourself at the link below." |

**Final screen (added in the editor, last 4–5 s, over the landing hero or a plain light background):**

```
Needtrace — see what breaks before it breaks
Try it: domino-os.tasty-kiwi.workers.dev/landing
Demo:   domino-os.tasty-kiwi.workers.dev
Fictional data · material availability only
```

### If the take runs long

Cut in this order until you're inside 2:50: (1) shot 6 entirely (−12 s); (2) the Customer A / Receipt glide in shot 7 (−6 s); (3) the second half of the shot 5 narration (−5 s). Don't cut shots 2–5; they are the story.

---

## 3. Words to keep and avoid

| Say                                                            | Don't say                                                  |
| -------------------------------------------------------------- | ---------------------------------------------------------- |
| "€36,000 of order value **at risk**"                           | "saves €36,000", "prevents losses", "ROI"                  |
| "approved alternative supply", "supply still needs confirming" | "orders the parts", "contacts the supplier"                |
| "models material availability"                                 | "schedules the factory", "predicts shipments", "optimizes" |
| "saves on this device", "export as JSON"                       | "cloud sync", "sign in", "your team's workspace"           |
| "deterministic", "you can check every number"                  | "AI-powered", "smart", "intelligent"                       |
| "fictional factory / data"                                     | "our customers", "used by manufacturers"                   |

Avoid filler ("basically", "so yeah", "as you can see"), and don't explain the tech stack. The Devpost page covers that.

---

## 4. Editing

1. **Trim** dead air at the start and end, and any pause longer than about 1 second. Keep every click visible; never cut away mid-click.
2. **Zoom (optional, gentle, 1.3–1.5×, about 0.5 s ease):** the red headline in shot 2, the ORD-102 evidence card in shot 3, the two recovery cards in shot 4, and the ALT-01 / PO-101 timeline row in shot 5. Don't zoom during scrolling.
3. **Captions:** burn in subtitles or upload an `.srt`, because judges often watch muted. Use the narration above as the transcript and check the spelling of ORD-102, PO-101, Aster, Vector and Needtrace.
4. **Audio:** normalize the voice to about −16 LUFS (−1 dBTP peak), apply light noise reduction, and use **no music**, or very quiet music under −30 dB that stops during narration-heavy shots.
5. **Optional lower-third** in shot 2, for 3 s: "Fictional demo data".
6. **Final card** as in shot 8. Don't add intro slides, logos or animations before the product appears.
7. **Export:** MP4, H.264 High, 1920×1080, the same fps as the recording (30 or 60), **12–16 Mbps** VBR, AAC 48 kHz 192 kbps.

---

## 5. Quality control before upload

Watch the **exported file** from start to finish, with sound, once at full screen and once at phone size.

- [ ] Duration between **2:30 and 2:50** (hard limit 3:00), as shown on the exported file, not the editor timeline.
- [ ] The product is visible in the first second; there are no intro slides.
- [ ] By 0:25 the viewer has seen **ORD-102 · 2 motors short · €36,000 at risk**.
- [ ] Allocation evidence is readable at 1080p: **2 of 4 allocated · short 2** and **Arriving after 2026-11-22**.
- [ ] The **Apply recovery** click is visible, and **All 10 covered** appears afterwards.
- [ ] The builder shows **Core example**, a selected node and **Saved locally**.
- [ ] No sign-in, GitHub, cloud, notification, bookmark bar, personal tab or desktop is visible.
- [ ] No claim of AI, savings, customers, supplier commitments, factory scheduling or cloud saving is spoken or written.
- [ ] Captions are in sync and correctly spelled. Audio has no clipping, hum or long silences.
- [ ] The final card URLs are exactly `domino-os.tasty-kiwi.workers.dev/landing` and `domino-os.tasty-kiwi.workers.dev`.
- [ ] A second team member has watched it and agrees it's ready.

---

## 6. Upload

Upload by **18:30 Vilnius time on 14 November** at the latest. YouTube can take 10–30 minutes to finish HD processing, and the project and video are due at 20:00.

1. **YouTube** (or Vimeo). Visibility: **Unlisted** or **Public**. Don't use Private, because judges can't open it.
2. **Title:** `Needtrace — see what breaks before it breaks (Unfair Weekend 2026 demo)`
3. **Description:**

   ```
   Needtrace traces a late supplier delivery to the exact customer order it breaks, shows why, and lets you test recovery options.

   Try it: https://domino-os.tasty-kiwi.workers.dev/landing
   Interactive demo: https://domino-os.tasty-kiwi.workers.dev/

   Fictional demo data. Needtrace models material availability only. It does not place purchases, confirm supplier commitments or schedule production.
   ```

4. Upload the `.srt` captions, if they aren't burned in.
5. Pick the thumbnail frame from shot 2 (the red **1 order at risk** headline with the graph).
6. **Verify signed out:** open the link in an Incognito window. It must play, show the right title, and reach 1080p once processing completes.
7. Paste the link into Devpost. Keep the exported MP4 on two devices offline as a backup for the live presentation.

---

## 7. Plan B if the live site is down while recording

Record from the local guest build instead. The fallback steps are in the release notes ([NEEDTRACE_RELEASE.md](NEEDTRACE_RELEASE.md)), and the screens are identical. Retake only shot 8 on the live `/landing` once it's back. Fullscreen (F11) keeps the local `127.0.0.1` address off screen, and the final card should still show the public URLs.

---

## Reference footage

An **automated, silent** browser run of shots 1–8 was captured from production for timing reference and optional B-roll. It is **not** the submission video: it has no narration, and its cursor is a drawn-on circle. It is stored **outside the repository**:

- `Videos/Needtrace-demo-footage/needtrace-silent-reference-1536x864.webm` on the preparer's machine (2:45, 1536×864, VP8, about 29 MB, no audio)
- `Videos/Needtrace-demo-footage/SHOT-LOG.txt` (timestamps per shot)

Its marks landed on schedule: 0:07 disruption, 0:25 ORD-102, 0:40 evidence, 0:50 recovery options, 1:15 apply, 1:35 side-by-side, 1:47 builder, 2:22 landing, 2:45 end. Watch it once while reading the narration aloud as a timing rehearsal. Share it through team storage if teammates need it; don't commit video files to this repository.
