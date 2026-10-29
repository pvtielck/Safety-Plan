# Ethical design notes

This document explains how My Safety Plan's design decisions were guided by the
[NASW Code of Ethics](https://www.socialworkers.org/About/Ethics/Code-of-Ethics/Code-of-Ethics-English)
and by the NASW, ASWB, CSWE, & CSWA *Standards for Technology in Social Work Practice* (2017). It also
names the trade-offs, because good intentions in software still have costs.

An app that holds someone's warning signs, the people they trust, and their reasons for living holds some of
the most sensitive information a person can write down. People using it may be in crisis, may share a phone
with someone who doesn't know they are struggling, or may be living with someone who controls their
technology. Those people were the starting point for every decision below.

---

## Self-determination (Standard 1.02)

*In brief:* people have the right to make their own choices, and social workers help them clarify and pursue
their own goals.

- **The person writes the plan in their own words.** Example ideas are never added straight to the plan.
  Tapping an idea copies it into the text field so the person can reword it, which echoes the
  collaborative, client-centered spirit of safety planning.
- **No step is required.** The builder says "It's okay to skip a step and come back to it later." People can
  jump to any step, reorder entries to match their own priorities, and edit or delete anything at any time.
- **The person decides where their information goes.** The app never sends data anywhere. Printing,
  downloading, calling, and texting happen only when the person chooses to.
- **The person can leave, and can erase everything.** "Delete all data" removes the plan, photos, PIN, and
  settings from the device, after a confirmation that suggests printing a copy first.
- **No automatic contact.** The app never alerts anyone, even if a plan suggests high risk. Automatically
  notifying a contact or clinician would override the person's choices and could expose them (for example, to
  an abusive partner listed as an emergency contact). This is a deliberate limit, and it is stated in the
  README.

**Trade-off:** respecting autonomy means the app can't step in during a crisis. It reduces this risk by
keeping crisis lines one tap away on every screen, by encouraging people to make their plan with a
clinician, and by including professionals and crisis lines as a step of the plan itself.

## Informed consent and integrity (Standards 1.03, 4.04, and the value of integrity)

*In brief:* people should be told, in clear language, what a service is for, what its risks and limits are,
and what will happen to their information.

- **The welcome screen states plainly** what a safety plan is, that it works best when made with someone
  trusted, and that **the app does not replace professional care.**
- **The PIN is described honestly.** Settings says it is *a privacy screen, not encryption*, that the plan is
  stored unencrypted, and that a forgotten PIN can't be recovered. It would have been easy to imply more
  protection than the app provides. Doing so would mislead people about a real risk.
- **Export warnings.** Before printing or downloading, people are told that a copy outside the app isn't
  protected by their PIN.
- **Honest limits.** The README lists what the app can't do, including that it has not been clinically
  evaluated.

## Privacy and confidentiality (Standard 1.07)

*In brief:* respect people's privacy, collect only what is needed, and use reasonable safeguards to protect
electronic information. The technology standards add that practitioners should understand the privacy
risks of the digital tools they use or recommend. Design responses:

- **Data minimization by architecture.** No server, no accounts, no analytics, no third-party scripts or
  fonts. Data that is never collected can't be breached, sold, or subpoenaed.
- **Enforced, not just promised.** A Content-Security-Policy in the production build blocks the page from
  connecting to any other origin, so even a mistake in the code can't leak a plan.
- **Shared-device protections.** An optional PIN with auto-lock; a Quick exit that blanks the screen,
  leaves no back-button path into the plan, and sends no referrer; a neutral home-screen name and icon;
  discreet file names for downloads.
- **Hidden metadata.** Photos are re-encoded on the device, which strips GPS location and other EXIF data.
- **Crisis help is never behind the PIN.** Confidentiality measures must not become a barrier to safety.

**Trade-offs:** Quick exit works by keeping the app to a single browser-history entry, so the browser's
Back button doesn't move between screens (in-app Back/Next buttons do). And without analytics, I can't
measure whether the app helps anyone. Any future evaluation would need explicit, informed, opt-in
consent and ethical review, not silent tracking.

## Competence (Standard 1.04)

*In brief:* work within the limits of one's knowledge, base practice on evidence, and take reasonable steps
to make sure technology-based services are competent and safe.

- **Grounded in evidence, scoped modestly.** The structure follows the Safety Planning Intervention
  (Stanley & Brown, 2012), which has supporting outcome research (Stanley et al., 2018; Nuij et al., 2021).
  The app doesn't claim those outcomes for itself, and it encourages people to build and review their plan
  with a clinician.
- **Original wording, proper attribution.** The app credits the intervention's developers and does not
  reproduce their copyrighted form. The About section says the app is not affiliated with or endorsed by
  them, and is not a medical device.
- **Safe messaging.** Language about suicide and lethal means is direct but not graphic, and it never
  describes methods. The "making my space safer" step focuses on time, distance, and asking for help, in
  line with lethal-means counseling practice.
- **Knowing what I don't know.** The translations and the crisis-resource list are flagged for
  expert review and regular re-checking. Each crisis entry links to its official source in the code, and
  the config records the date it was last verified.

## Cultural competence and access (Standard 1.05, and the value of social justice)

*In brief:* understand and respect the cultures and languages of the people served, and work to remove
barriers to access.

- **Multilingual from the start.** English and Spanish have the same content, chosen for Los Angeles County,
  where Spanish is the most common language other than English. Spanish users get the Spanish-language
  ways to reach each crisis line (988: press 2 or text AYUDA; Crisis Text Line: text AYUDA).
- **More languages, without overpromising.** French, Korean, and Simplified Chinese have the same content
  too. Crisis lines rarely have counselors who speak these languages, so each entry says honestly what to
  expect and how to get help anyway: 988 and 911 connect phone interpreters if you say the name of your
  language, the county help line has Korean, Mandarin, and Cantonese menu options, and texting services
  are English and Spanish only.
- **Inclusive language.** The Spanish avoids gendered adjectives where possible ("a salvo", "por tu cuenta",
  "una persona capacitada"). Examples include faith communities, pets, school, and work, so that people from
  different backgrounds see themselves in the prompts.
- **Free, with no barriers.** No sign-up, no email, no app store, and no cost. It works offline (useful with
  limited data plans or unreliable connections), runs on older phones, and can be printed for people who
  prefer paper.
- **Accessible to people with disabilities.** Designed to meet WCAG 2.1 AA, with a high-legibility font,
  adjustable text size, screen-reader announcements, and full keyboard use. (See the README for details.)
- **Plain language.** Written at about a 6th-grade reading level, because distress makes reading harder.

## Dignity and worth of the person

- **Warm and non-clinical.** No diagnostic language, no risk scores, no alarming red except for 911.
  The plan is written in the first person ("My reasons for living").
- **Reasons for living, with photos.** The plan ends with what matters to the person, not with risk.

---

### Open questions I would bring to supervision

1. Should the app ever suggest re-reviewing an old plan? A reminder could help, but it could also intrude
   on someone who chose to put the plan aside.
2. How should a future version support making the plan *with* a clinician (for example, a shared-screen
   mode) without adding a server or accounts?
3. Who should review translations and crisis resources, how often, and how is that review documented?

### References

- National Association of Social Workers. (2021). *Code of ethics of the National Association of Social
  Workers*. https://www.socialworkers.org/About/Ethics/Code-of-Ethics/Code-of-Ethics-English
- National Association of Social Workers, Association of Social Work Boards, Council on Social Work
  Education, & Clinical Social Work Association. (2017). *NASW, ASWB, CSWE, & CSWA standards for technology
  in social work practice*. https://www.socialworkers.org/Practice/Practice-Standards-Guidelines
- Nuij, C., van Ballegooijen, W., de Beurs, D., Juniar, D., Erlangsen, A., Portzky, G., O'Connor, R. C.,
  Smit, J. H., Kerkhof, A., & Riper, H. (2021). Safety planning-type interventions for suicide prevention:
  Meta-analysis. *The British Journal of Psychiatry, 219*(2), 419–426. https://doi.org/10.1192/bjp.2021.50
- Stanley, B., & Brown, G. K. (2012). Safety planning intervention: A brief intervention to mitigate suicide
  risk. *Cognitive and Behavioral Practice, 19*(2), 256–264. https://doi.org/10.1016/j.cbpra.2011.01.001
- Stanley, B., Brown, G. K., Brenner, L. A., Galfalvy, H. C., Currier, G. W., Knox, K. L., Chaudhury, S. R.,
  Bush, A. L., & Green, K. L. (2018). Comparison of the safety planning intervention with follow-up vs usual
  care of suicidal patients treated in the emergency department. *JAMA Psychiatry, 75*(9), 894–900.
  https://doi.org/10.1001/jamapsychiatry.2018.1776
