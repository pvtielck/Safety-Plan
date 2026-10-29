# My Safety Plan

A private, bilingual (English/Spanish) safety-planning app that works offline. It is inspired by the
six-step structure of the Stanley-Brown Safety Planning Intervention.

**Live site: https://pvtielck.github.io/Safety-Plan/**

> **If you are in crisis right now:** call or text **988** (Suicide & Crisis Lifeline), text **HOME** to
> **741741** (Crisis Text Line), or call **911** if you are in immediate danger. In Los Angeles County you
> can also call the LA County Department of Mental Health 24/7 Help Line at **1-800-854-7771**.
>
> **This app is not a substitute for professional care.** See the [disclaimer](#not-a-substitute-for-professional-care).

---

## Purpose

A safety plan is a short, personal, written list of steps a person can follow when suicidal thoughts or a
crisis start to build. It is usually written together with a clinician during a calmer moment, so that it
is ready when thinking clearly is hardest.

Paper plans get lost, and many existing apps require accounts or collect data. **My Safety Plan** is a
small, free, installable web app that helps someone write and keep a plan:

- **privately:** nothing ever leaves the device unless the person chooses to print, download, call, or text;
- **accessibly:** plain language, large text, screen-reader support, and English and Spanish;
- **reliably:** it works with no internet connection, which is often exactly when it's needed.

I built it as a portfolio project for a Master of Social Work application, to show how social work values
(self-determination, confidentiality, competence, and access) can shape technical design decisions. The
reasoning is written up in [docs/ETHICS.md](docs/ETHICS.md).

## Features

**Guided builder**: one section per screen, with a progress bar, step shortcuts, and Back/Next:

| Step | Section | What the person adds |
| ---- | ------- | -------------------- |
| 1 | My warning signs | Thoughts, feelings, or situations that signal a crisis may be building |
| 2 | Things I can do on my own | Internal coping strategies |
| 3 | People and places that help me take a break | Names, phone numbers, places |
| 4 | People I can ask for help | Names and phone numbers (tap to call or text) |
| 5 | Professionals and crisis lines | Clinicians and services; crisis lines are pre-filled |
| 6 | Making my space safer | Steps to reduce access to means |
| 7 | My reasons for living | Text, plus optional photos stored on the device |

Each section has a short plain-language explanation, a reflective question, and "ideas to get you
started". Entries can be added, edited, reordered (with Move up / Move down buttons), and deleted, with
**Undo**. Everything **autosaves**, including text that was typed but not yet added when the person moves
to another step.

**My Plan view**: the whole plan on one calm screen with large text and big **Call** / **Text** buttons.
It is built to be read at a glance during distress: "start with step 1, keep going until you feel safe."

**"Need help now?"**: a button on every screen, including the PIN lock screen, that opens a panel
with 988 (call or text), Crisis Text Line, the LA County DMH 24/7 Help Line, and 911. Keyboard focus starts on
"Call 988". All hotline details live in one config file: [`src/config/crisisResources.ts`](src/config/crisisResources.ts).

**Quick exit**: instantly blanks the screen and replaces the page with a neutral site.

**Export**: a print stylesheet (clean black-on-white, no buttons, phone numbers written out) and a
**Download PDF** button that builds the PDF on the device with jsPDF.

**Settings**: language (English/Español), text size (3 levels), colors (match device / light / dark),
optional 4-digit PIN lock, a privacy summary, and **Delete all data** (with confirmation).

**Installable PWA**: can be added to the home screen and works fully offline after the first visit.

## Evidence base

The app follows the structure of the **Safety Planning Intervention (SPI)** developed by Barbara Stanley
and Gregory Brown. The SPI is a brief intervention in which a clinician and a person at risk of suicide
collaboratively write a prioritized list of coping strategies and sources of support. The person works
through the steps in order, moving to the next step if the previous one doesn't help: from noticing
warning signs, to coping alone, to social contact, to asking for help, to professional and crisis
services, along with reducing access to lethal means.

- Stanley, B., & Brown, G. K. (2012). Safety planning intervention: A brief intervention to mitigate
  suicide risk. *Cognitive and Behavioral Practice, 19*(2), 256–264.
  https://doi.org/10.1016/j.cbpra.2011.01.001
- Stanley, B., Brown, G. K., Brenner, L. A., Galfalvy, H. C., Currier, G. W., Knox, K. L., Chaudhury, S. R.,
  Bush, A. L., & Green, K. L. (2018). Comparison of the safety planning intervention with follow-up vs usual
  care of suicidal patients treated in the emergency department. *JAMA Psychiatry, 75*(9), 894–900.
  https://doi.org/10.1001/jamapsychiatry.2018.1776. In this cohort study, SPI plus telephone follow-up was
  associated with about half the odds of suicidal behavior over six months compared with usual care.
- Nuij, C., van Ballegooijen, W., de Beurs, D., Juniar, D., Erlangsen, A., Portzky, G., O'Connor, R. C.,
  Smit, J. H., Kerkhof, A., & Riper, H. (2021). Safety planning-type interventions for suicide prevention:
  Meta-analysis. *The British Journal of Psychiatry, 219*(2), 419–426. https://doi.org/10.1192/bjp.2021.50.
  Across six studies (n = 3,536), safety planning-type interventions were associated with lower risk of
  suicidal behavior (RR ≈ 0.57) but showed no significant effect on suicidal ideation.

**What this app is and isn't.** The research above evaluates safety planning done *with a clinician*.
This app has not been clinically evaluated. It is a tool for writing down and carrying a plan, ideally one
made together with a counselor, therapist, doctor, or trusted person. All section explanations,
questions, and example ideas are original wording written for this app. They do not reproduce the
official Stanley-Brown Safety Plan form, and the app is not affiliated with or endorsed by its authors.

## Privacy design decisions

| Decision | Why |
| -------- | --- |
| **No backend, accounts, analytics, ads, or third-party requests** | There is nothing to breach, subpoena, or sell. Fonts and icons are bundled with the app, not loaded from a CDN, so no third party even learns that someone opened the app. |
| **Data stays in `localStorage` on the device** | The person stays in control. "Your data stays on this device" appears on the welcome screen and in Settings. |
| **Content-Security-Policy `connect-src 'self'`** | The production build ships a CSP that only lets the page talk to its own origin. Even a bug or a compromised dependency couldn't send plan data elsewhere: the browser would block it. |
| **Optional PIN stored as a salted PBKDF2 hash** | Uses Web Crypto (PBKDF2-SHA-256, 150,000 iterations, random 16-byte salt). The UI says plainly that this is **a privacy screen, not encryption**: 4 digits can be brute-forced, and the plan itself is not encrypted. If the PIN is forgotten, the only way in is to erase the data, and the app explains why. |
| **Crisis help is never behind the PIN** | Someone locked out of their own phone in a crisis must still reach 988. |
| **Auto-lock** | With a PIN set, the app locks again after 5 minutes in the background. |
| **Quick exit** | Blanks the screen synchronously, then `location.replace()`s to a neutral site. In-app navigation *replaces* history entries instead of pushing them, so Back doesn't return to the plan. `<meta name="referrer" content="no-referrer">` keeps the destination from learning where the visitor came from. If the browser restores the page from its back/forward cache, the app reloads (showing the PIN screen if one is set). |
| **Photos are re-encoded on the device** | Resizing through a canvas strips EXIF metadata, including GPS location, before anything is saved. Remote image URLs are rejected when loading saved data. |
| **Discreet naming** | The home-screen name is "My Plan", the icon is a neutral sprout, and downloaded files are named `my-plan-YYYY-MM-DD.pdf`. |
| **Export is explicit and explained** | Print and PDF are user-initiated, and the export panel notes that a copy outside the app isn't protected by the PIN. |
| **Nothing is silently lost** | Saves happen synchronously on every change. Unreadable saved data is backed up before being replaced. If the device runs out of space, the app says so instead of pretending to save. The app also asks the browser for persistent storage once a plan has content. |

## Accessibility choices

The goal is WCAG 2.1 AA.

- **Semantic HTML:** landmarks, one `h1` per screen, real `<button>`/`<a>`, `<fieldset>`/`<legend>` radio
  groups, native `<dialog>` for modals (built-in focus trap, Escape to close, inert background).
- **Keyboard and screen readers:** a skip link; focus moves to the new heading on every screen change;
  every icon button has a label naming its item ("Move up: Go for a walk"); actions such as add, move,
  delete, and undo are announced in a polite live region; focus is restored after reordering (which
  otherwise drops focus in most browsers). Reordering uses buttons, not drag-and-drop, so it works with
  keyboards, switches, and screen readers.
- **Visible focus:** a 3px high-contrast focus ring on every interactive element, kept clear of the sticky
  header with `scroll-padding`.
- **Contrast:** every text/background token pair was measured. The lowest body-text pair is 6.2:1 (AA
  needs 4.5:1), and form-control borders are 3.9:1 or higher (AA needs 3:1).

  | Pair | Light | Dark |
  | ---- | ----- | ---- |
  | Body text on background | 14.2:1 | 15.4:1 |
  | Muted text on background | 7.1:1 | 10.1:1 |
  | Primary button text | 6.2:1 | 9.0:1 |
  | "Need help now?" button text | 8.5:1 | 9.6:1 |
  | 911 button text | 6.6:1 | 6.6:1 |
  | Input border on surface | 4.2:1 | 4.8:1 |

- **Text size:** three settings that scale every rem-based size. Labels wrap rather than truncate.
- **Large touch targets:** buttons are at least 48px tall; icon buttons are 48×48px.
- **Motion and color scheme:** honors `prefers-reduced-motion` and `prefers-color-scheme`, with a manual
  light/dark override.
- **Legible typeface:** [Atkinson Hyperlegible Next](https://www.brailleinstitute.org/freefont/), designed
  by the Braille Institute for low-vision readers (self-hosted).
- **Calm, non-clinical design:** warm neutrals and soft teal. Red is used **only** for 911; the help
  button is a calm plum.
- **Plain language:** short sentences, aimed at about a 6th-grade reading level, written in second person
  for instructions and first person for the plan ("My warning signs").
- **Bilingual:** every string lives in [`en.json`](src/i18n/locales/en.json) / [`es.json`](src/i18n/locales/es.json);
  `<html lang>` follows the chosen language; language options are labelled in their own language with
  `lang` attributes. The Spanish uses informal *tú* and gender-neutral phrasing (for example "a salvo" instead
  of "seguro/segura", "por tu cuenta" instead of "solo/sola"). A test fails if the two files ever have
  different keys or placeholders.

## How it's built

**Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, react-i18next, vite-plugin-pwa (Workbox),
jsPDF (lazy-loaded), lucide icons, and Vitest with React Testing Library.

```
src/
  config/        crisisResources.ts (all hotline info, bilingual), app.ts (quick-exit URL, limits)
  model/         plan.ts (types + section definitions), planReducer.ts, settings.ts, schemas.ts
  lib/           storage.ts (versioned persistence), pin.ts, image.ts, pdf.ts, phone.ts, quickExit.ts
  hooks/         usePersistentState.ts, useHashRoute.ts, useAnnouncer.ts, useFlushOnUnmount.ts
  state/         AppStore.tsx (React context: plan, settings, actions)
  components/    AppShell, CrisisPanel, Dialog, EntryList, Text/ContactSectionEditor, PhotoEditor, ...
  screens/       Welcome, Builder, Plan, Settings, Lock
  i18n/          setup + locales/en.json, locales/es.json
docs/ETHICS.md
```

**Data model** ([`src/model/plan.ts`](src/model/plan.ts)):

```ts
interface TextItem    { id: string; text: string }
interface ContactItem { id: string; name: string; phone: string; detail: string }
interface PhotoItem   { id: string; dataUrl: string; caption: string } // caption doubles as alt text

type SafetyPlan = {
  warningSigns: TextItem[]; copingStrategies: TextItem[]; safeEnvironment: TextItem[]; reasonsForLiving: TextItem[]
  distractions: ContactItem[]; helpers: ContactItem[]; professionals: ContactItem[]
  photos: PhotoItem[]
}
```

All changes go through a pure reducer ([`planReducer.ts`](src/model/planReducer.ts)).

**Persistence** ([`src/lib/storage.ts`](src/lib/storage.ts), [`usePersistentState.ts`](src/hooks/usePersistentState.ts)):
the plan and settings are stored under separate keys as `{ version, savedAt, data }` envelopes. On load,
older versions run through `migrations[n]` one step at a time, and everything passes through a
`normalize` function, so partial or hand-edited data can't crash the app. Corrupt data, or data from a
newer app version, is copied to a `:backup` key first. The hook saves **synchronously inside the setter**
and returns the result, so callers can react to a full disk (for example, by not keeping a photo that didn't
fit). It also syncs across tabs via the `storage` event.

**Routing:** a tiny hash router, which works on any static host and offline. It replaces history entries
for the privacy reason described above.

## Run it locally

Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 83 unit and component tests
npm run typecheck
npm run lint       # oxlint with jsx-a11y rules
npm run build      # production build in dist/ (adds the CSP and service worker)
npm run preview    # serve the production build at http://localhost:4173
```

The service worker and CSP are only active in the production build (`npm run build && npm run preview`).
To check offline support, load the preview once, stop the server, and reload.

## Deploy

The output in `dist/` is a fully static site.

- **Netlify:** build command `npm run build`, publish directory `dist`. The included
  [`public/_headers`](public/_headers) adds security headers.
- **Vercel:** import the repo; the Vite preset works as-is.
- **GitHub Pages:** the included workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
  builds with `VITE_BASE=/<repo-name>/` and publishes to Pages. Enable *Settings → Pages → Source: GitHub
  Actions*. For any other sub-path, set `VITE_BASE` the same way.

PWAs require HTTPS (all three hosts provide it). `crypto.subtle`, which the PIN uses, also requires a
secure context.

### Adapting it for another region

Edit only [`src/config/crisisResources.ts`](src/config/crisisResources.ts): replace the entries, fill in
every language, and update `lastReviewed`. Tests check that every resource has text in every language and
builds a valid `tel:`/`sms:` link. To add a language, add `src/i18n/locales/<code>.json` (the key-parity
test shows what's missing), add the code to `LANGUAGES` in `src/model/settings.ts`, and add its name in
`src/i18n/index.ts`.

## Limitations

- **Not clinically validated.** The evidence above is for clinician-delivered safety planning, not this app.
- **No backup or sync.** Data lives in one browser on one device. Clearing browser data, or Safari's
  automatic deletion of storage for websites that haven't been visited in a while (installing the app to the
  home screen avoids this), will erase the plan. A printed or PDF copy is the backup.
- **PIN is not encryption.** It deters a casual look only (stated in the UI).
- **Shared devices.** Anyone with the device and enough technical skill can read localStorage. The app
  also can't hide the browser's own history of having visited the site, though in-app navigation adds no
  extra entries.
- **No monitoring or automatic alerts, by design.** The app never contacts anyone. It can't recognize a
  crisis or call for help on someone's behalf.
- **Crisis resources need upkeep.** Numbers and texting keywords change, so re-check them against the
  providers' websites before each release (last checked: see `lastReviewed`).
- **Translation review.** The Spanish was written carefully but should be reviewed by a native speaker
  with clinical experience, ideally with input from people with lived experience, before real-world use.
- **PDF characters.** The PDF uses built-in Latin-1 fonts, so emoji and non-Latin scripts are left out of
  the PDF. The Print option keeps them.
- **Photos** are limited to 6 to stay within localStorage limits (about 5 MB per site).
- **`sms:` pre-filled text** behaves slightly differently across phones and desktop browsers.
- Accessibility was checked by automated linting (jsx-a11y), keyboard testing, and measured contrast,
  but has not yet been tested by screen-reader users or audited by a third party.

## Not a substitute for professional care

My Safety Plan is a self-help tool for organizing a personal safety plan. **It does not provide medical,
psychological, or crisis services, and it does not replace care from a qualified professional.** It does
not monitor anyone, and no one is notified when it's used. Safety plans work best when made with a
clinician or trusted person and reviewed regularly. If you or someone you know is in danger, call **911**.
For support, call or text **988**, or text **HOME** to **741741**.
