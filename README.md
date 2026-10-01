# SémioGarde 🩺 — Le jeu de sémiologie médicale

> A 3D, game-first study app for **symptomatologie / sémiologie médicale**, built for a medical student at a **Moroccan Faculté de Médecine et de Pharmacie (FMP)**.
> All in-app content and UI are in **French**. This document is the complete specification for the AI assistant that will build the project.

---

## 0. How to use this document (instructions for the AI builder)

1. Read the whole file before writing code. Sections 3–5 (art, 3D, game design) and section 8 (content model) are the heart of the project.
2. Build in the **phases described in section 16**. Each phase must end in a working, playable build.
3. **Never invent medical content silently.** Use the sample content in section 8.5 as given. When you generate additional cards or cases, mark each with `"status": "draft"`; drafts only become `"validated"` after the student reviews them in the in-app editor (section 14).
4. The design reference images (isometric 3D dioramas) are stored in `docs/design-references/`. Match their look as closely as possible (section 3).
5. Everything shown to the player is in **French**. Code, comments, and commit messages are in English.
6. Target: smooth on a **mid-range Android phone** (she will mostly study on her phone) and on a laptop browser.

---

## 1. Vision

The student plays a young doctor working **gardes (shifts)** at a stylized 3D Moroccan university hospital, the **CHU SémioGarde**. Patients arrive, she examines them in 3D (inspection, palpation, percussion, auscultation), asks questions, spots signs, and names the **syndrome** and its likely cause.

Every patient is secretly a flashcard or exam question. A spaced-repetition engine decides which patients come back. She should feel like she's **playing a cozy hospital game**, never "doing revision".

**Design pillars**
- **Diagnosis is the game.** The core loop is clinical reasoning, not reading cards.
- **Short sessions.** One garde = 10–15 min. Can stop any time without losing progress.
- **Rewarding, never punishing.** Mistakes become "follow-up patients", not game over.
- **Faithful to her curriculum.** French medical terminology, the Moroccan faculty exam format, and the diseases she will actually see in Morocco.

---

## 2. Academic context (Morocco)

### 2.1 Curriculum
- Studies are at a Moroccan FMP (Rabat, Casablanca, Marrakech, Fès, Oujda, Agadir, Tanger, Laâyoune or a private faculty). Courses are taught **in French**.
- Sémiologie is usually taught in the pre-clinical/early clinical years, organized by system. The **year and module list must be configurable** in settings (`Paramètres → Mon cursus`), since faculties differ.
- Terminology must follow French medical usage: *interrogatoire, examen physique, inspection, palpation, percussion, auscultation, signe fonctionnel, signe physique, syndrome*, etc.

### 2.2 Exam formats to reproduce (boss fights and "Mode Examen")
Moroccan faculty exams in sémiologie typically use:
- **QCM à réponse unique** (single best answer)
- **QCM à réponses multiples** (one or more correct answers, often 5 propositions A–E). Support configurable grading: all-or-nothing, or partial credit with penalty for wrong ticks.
- **QROC** (questions à réponse ouverte courte): short typed answer, matched against accepted synonyms with accent/case-insensitive comparison.
- **Cas cliniques**: a clinical vignette followed by a series of linked questions, revealed progressively.
- Optional **oral/ECOS-style station**: a timed simulated consultation (the 3D Consultation mode covers this).

> Do NOT reference the French EDN/ECN as her exam. Exam names and grading rules must be configurable in a settings JSON so the student can match her own faculty.

### 2.3 Moroccan clinical reality (use it in cases)
Include diseases and contexts common in Morocco, for example:
- **Tuberculose** (pulmonaire, ganglionnaire, pleurale, ostéo-articulaire / mal de Pott)
- **Kyste hydatique** (foie, poumon), with rural context and contact with dogs
- **Rhumatisme articulaire aigu** and valvulopathies rhumatismales
- **Brucellose** (consumption of raw milk, contact with livestock)
- **Leishmaniose** (cutanée, viscérale)
- **Fièvre typhoïde**
- Diabetes, hypertension, viral hepatitis, iron-deficiency anaemia

Patients have **Moroccan names** (Fatima Zahra, Khadija, Hajar, Youssef, Mohammed, Hamza, Aïcha, Omar, Salma, Brahim…), ages, professions and origins (urban/rural, region). Optional flavor: a short **darija** line in the patient's speech bubble with the French translation below (toggle in settings). For example: *« Kandour 3liya rassi bzaf » — « J'ai très mal à la tête »*.

---

## 3. Art direction

### 3.1 Style (from the reference images)
The references are **isometric 3D miniature dioramas**: a city or island sits on a thick square base slab, with soft clay-like rendering, pastel colors, and large bold title typography above it. Reproduce this exactly:

- **Isometric diorama tiles.** Each hospital wing is a square tile on a rounded, slightly beveled base slab with a visible side thickness (earth/stone layer), like the Tokyo, Okinawa and Bali references.
- **Miniature / tilt-shift feel.** Small cars, tiny people, trees, benches and details scattered around.
- **Soft lighting.** One warm directional "sun" from the top left, soft long shadow falling to the bottom right, gentle ambient occlusion. No harsh black shadows.
- **Pastel, low-saturation palette** with one strong accent per wing.
- **Solid pastel background** behind each scene (no skybox), changing color per wing, exactly like the reference images.
- **Big title above the diorama** in a heavy, slightly condensed sans-serif with letter spacing (e.g. "CARDIOLOGIE"), in a muted darker tone of the background color.
- Materials are **matte, smooth, slightly rounded edges** (toy/clay look). Glass buildings get a soft blue reflection. Water is turquoise and semi-transparent where used.

### 3.2 Moroccan architectural identity
The hospital is a modern CHU with Moroccan touches:
- A central **riad-style courtyard** (the main hub) with a fountain, zellige floor patterns, orange trees and palm trees.
- Arches, white and sand-colored walls, green-tiled roofs (like traditional green glazed tiles), wooden mashrabiya details on some windows.
- Small surrounding details: ambulances, a taxi (petit taxi), people in white coats, a pharmacy cross, a café with tea glasses, cats.

### 3.3 Palette (CSS / theme tokens)
| Token | Usage | Hex |
|---|---|---|
| `--bg-hub` | Hub background (pale sky) | `#BFE0EE` |
| `--bg-cardio` | Cardiologie | `#F6D5D5` |
| `--bg-pneumo` | Pneumologie | `#D3E9F5` |
| `--bg-digestif` | Gastro-entérologie | `#F4E6C9` |
| `--bg-neuro` | Neurologie | `#E2DAF2` |
| `--bg-nephro` | Uro-néphrologie | `#D6EEE6` |
| `--bg-endo` | Endocrinologie | `#F7E9D6` |
| `--bg-rhumato` | Appareil locomoteur | `#E7E2D8` |
| `--bg-hemato` | Hématologie / ganglions | `#F5DCE6` |
| `--bg-dermato` | Dermatologie | `#F2E3D5` |
| `--ink` | Main text | `#2F3B4C` |
| `--accent` | Primary buttons, XP | `#2E8B7A` (Moroccan green-teal) |
| `--gold` | Rewards, streaks | `#E2A93B` |
| `--danger` | Wrong answer (soft) | `#E07A6B` |
| `--success` | Right answer | `#5DB37E` |

Provide a dark mode with the same hues at lower brightness.

### 3.4 Typography
- Titles: **Bebas Neue** or **Oswald** (heavy condensed, matches "TOKYO, JAPAN"). Alternative: **Montserrat ExtraBold** with wide tracking (matches "OKINAWA"/"BALI").
- UI and body text: **Nunito** or **Inter**, which render French accents well.
- Load from Google Fonts. Minimum body size 16px on mobile.

### 3.5 2D UI over 3D
- UI panels are **rounded cards (16–24px radius)** with a soft blur/frosted glass effect over the 3D scene, a subtle shadow, and pastel backgrounds.
- Buttons look slightly "toy-like": raised, with a bottom shadow that compresses on press.
- Icons: rounded line icons (Lucide or Phosphor).
- Animations: springy and playful (Framer Motion), 150–300ms.

---

## 4. The 3D world

### 4.1 Hub: the CHU (hospital map)
- An **isometric diorama of the whole hospital** on a base slab: the central riad courtyard surrounded by wings (pavillons). Each wing is a building with a sign in French.
- **Locked wings** appear greyed out, under construction (scaffolding, cones). Unlocking a wing plays a short animation where the scaffolding disappears and the building "pops" into color.
- **Wing mastery is visible**: the more she masters a wing, the busier and more detailed it becomes (more trees, people, an ambulance, lights at night). This is the main long-term reward.
- The **player's doctor** walks around the courtyard. Tapping a wing makes the camera glide to it (smooth tween) and opens the wing menu.
- Day/night cycle tied to the real time of day (soft: just lighting tint and window lights).
- Camera: orthographic isometric camera, pinch/scroll zoom within limits, drag to pan within bounds, no free rotation (or limited 90° steps).

### 4.2 Wing scenes (diorama per specialty)
Each specialty has its own diorama tile in the reference style, with its title above:
- **Cardiologie**: building with a big heart sign, ECG line on the roof, ambulance bay.
- **Pneumologie**: building with lung-shaped topiary, a terrace with patients breathing fresh air.
- **Gastro-entérologie**, **Neurologie**, **Uro-néphrologie**, **Endocrinologie**, **Appareil locomoteur**, **Hématologie**, **Dermatologie**, and **Sémiologie générale** (the first, always unlocked wing: "Pavillon des Urgences").

### 4.3 Consultation room (the main gameplay scene)
A small isometric room diorama: examination table, desk with a computer, a window, a lamp, posters on the wall, and a stethoscope on the desk.
- The **patient** sits or lies on the table. The **doctor** (the player's avatar) stands beside them.
- The camera can switch between **room view** (isometric) and **close examination view** (closer perspective on the patient's body).
- **Body zones are clickable hotspots** with a soft glow on hover/tap:
  - Tête et visage (yeux/conjonctives, bouche, langue)
  - Cou (thyroïde, veines jugulaires, ganglions cervicaux)
  - Thorax antérieur et postérieur (cardiaque et pulmonaire)
  - Abdomen divided into the **9 regions**: hypochondre droit, épigastre, hypochondre gauche, flanc droit, région ombilicale, flanc gauche, fosse iliaque droite, hypogastre, fosse iliaque gauche
  - Aires ganglionnaires (cervicales, axillaires, inguinales)
  - Membres supérieurs et inférieurs (pouls, œdèmes, mains/ongles)
  - Peau
  - Examen neurologique (réflexes, force, sensibilité, marche)
- Tapping a zone opens a **radial tool menu**: 👁 Inspection, ✋ Palpation, 👆 Percussion, 🩺 Auscultation, 🔨 Marteau à réflexes, 🔦 Lampe. Only relevant tools are enabled for each zone.
- Each exam action plays a short doctor animation (leans in with the stethoscope, palpates, taps) and then reveals the finding in a card.

### 4.4 Characters

#### Player doctor (customizable)
- **Stylized chibi proportions** (large head, about 1/3 of body height), soft rounded shapes, matching the miniature look.
- White coat with a name badge ("Dr. [prénom]"), stethoscope around the neck.
- Customization screen at first launch (and later via the "Vestiaire"):
  - Sex/body type, skin tone (wide range), face shape, eyes, eyebrows
  - Hair style and color, **with a hijab option** (several colors/styles)
  - Glasses on/off
  - Scrubs color (unlockable), coat accessories, stethoscope color, shoes
- Unlockable cosmetics bought with in-game currency (section 6).
- Animations: idle (breathing, looking around), walk, wave/celebrate, think (hand on chin), examine (stethoscope, palpation, percussion, reflex hammer), write notes, sad shrug (wrong answer, gentle and funny, never humiliating).

#### Patients (procedurally assembled)
- Same stylized style. Assembled from **modular parts** so each patient looks different: age group (enfant, adolescent, adulte, personne âgée), sex, skin tone, hair/beard/hijab/headscarf, clothing (djellaba, everyday clothes, work clothes, hospital gown).
- **Visible signs shown on the 3D model** (this is a key gameplay feature: inspection is real observation):
  | Sign | Visual implementation |
  |---|---|
  | Ictère | Yellow tint on skin and sclera (shader color shift) |
  | Pâleur | Desaturated, lighter skin and pale conjunctivae |
  | Cyanose | Bluish lips and fingertips |
  | Dyspnée / polypnée | Fast chest/shoulder breathing animation, tripod posture option |
  | Toux | Periodic cough animation with sound |
  | Œdèmes des membres inférieurs | Swollen lower-leg blend shape |
  | Turgescence jugulaire | Visible neck vein (normal map / mesh) |
  | Hippocratisme digital | Clubbed fingertips blend shape |
  | Amaigrissement | Thinner body blend shape |
  | Douleur abdominale | Hand on belly, bent posture |
  | Fièvre | Flushed cheeks, sweat drops, shivering option |
  | Exophtalmie | Eye blend shape |
  | Ascite | Distended abdomen blend shape |
- Facial expressions: neutral, pain, worry, relief, thanks (at the end of a successful consultation).
- Speech bubbles for the interrogatoire answers (French, optional darija line).

### 4.5 3D tech and asset pipeline
- **Engine:** Three.js through **React Three Fiber** with **@react-three/drei** helpers.
- **Models:** glTF/GLB, compressed with **Draco/Meshopt** and **KTX2** textures through `gltf-transform`. Target under 15 MB total for the first load, wings lazy-loaded.
- **Asset sources (free, check each licence and credit in `CREDITS.md`):**
  - Kenney (CC0): buildings, furniture, city props
  - Quaternius (CC0): low-poly characters, nature
  - KayKit (CC0): characters and props
  - Poly Pizza: individual low-poly models (licences vary, check each)
  - Mixamo: animation retargeting (free with an Adobe account)
  - Custom models in **Blender** for the hospital, the Moroccan details and the blend shapes for clinical signs
- **Phase-1 fallback:** if final models aren't ready, build the characters and buildings from **rounded primitive shapes** (capsules, rounded boxes, spheres) in the same pastel style, so the game is playable from day one. Swap in real models later without changing game logic (models are referenced by ID in a manifest).
- **Rendering:** soft shadows (`ContactShadows` + one shadow-casting directional light), `Environment` preset for soft reflections, light SSAO only on desktop. No heavy post-processing on mobile.
- **Performance budget:** 60 fps desktop, 30+ fps on a mid-range phone, under 150 draw calls per scene (use instancing for trees, people, cars), automatic quality presets (Haute / Moyenne / Basse) based on a quick GPU benchmark at first launch.
- **Accessibility fallback:** a **"Mode 2D léger"** setting that replaces the 3D scenes with illustrated 2D screens using the same game logic, for old phones or low battery.

---

## 5. Game design

### 5.1 Core loop
```
Choose a wing → Start a garde (10–15 patients) → For each patient:
   Read the motif de consultation → Interrogatoire → Examen physique (3D)
   → Propose the syndrome (+ étiologie when relevant) → Feedback + mini-lesson
→ End-of-garde report (XP, accuracy, cards learned, follow-ups scheduled)
→ Back to the hub (wing grows, rewards, streak)
```

### 5.2 Game modes

#### 🏥 Consultation (main mode)
1. **Arrival:** the patient walks in. Card with name, age, profession, origin and **motif de consultation** (e.g. « Douleur thoracique depuis 2 heures »).
2. **Interrogatoire:** choose questions from a list (antécédents, mode de début, caractéristiques de la douleur with the classic SIÈGE / IRRADIATION / TYPE / INTENSITÉ / DURÉE / FACTEURS DÉCLENCHANTS ET CALMANTS / SIGNES ASSOCIÉS, habitudes toxiques, contage, contexte). Some questions are irrelevant (distractors, small time cost).
3. **Examen physique:** in the 3D scene, as described in 4.3. Each action costs in-game time.
4. **Synthèse:** choose (or type) the **syndrome** from a searchable list, then the **étiologie la plus probable** when the case asks for it. Optional bonus question (e.g. « Quel signe manque pour confirmer ? »).
5. **Feedback:** correct/incorrect with a short, clear explanation in French, the key signs she found vs. missed (highlighted on the 3D body), and a "fiche mémo" she can save.

**Time and scoring**
- Each garde has an in-game clock (starts 08:00). Questions cost 1 min, exam actions 2 min, irrelevant actions 3 min.
- Score per patient: `base 100` × accuracy multiplier (syndrome correct = 1.0; étiologie also correct = +0.5) + **efficiency bonus** (up to +50 if she reached the diagnosis using only key findings) + **streak multiplier** (×1.1 per consecutive correct patient, capped at ×2.0).
- No game over. A wrong diagnosis gives a small score and schedules the patient as a **follow-up** (section 7).

#### ⚡ Garde rapide (speed round)
- 60 or 90 seconds of rapid-fire questions: sign → meaning, syndrome → signs, name the eponymous sign.
- Patients appear in a queue in the 3D waiting room. Combo meter, ambulance siren sound when the combo is high.

#### 🕵️ Qui suis-je ?
- An eponymous or classic sign is described step by step with progressive clues (description → how it's elicited → what it indicates). The fewer clues used, the more points.
- Examples: signe de Murphy, Blumberg, Rovsing, Babinski, Kernig, Brudzinski, Lasègue, Chvostek, Trousseau, Troisier, godet, flot, glaçon.

#### 🧠 Mémo (memory pairs)
- Flip tiles in the 3D staff room to match a sign with its syndrome, or a term with its definition. Timer and move counter.

#### 🎧 Auscultation (sound recognition)
- Play a heart or lung sound; identify it (murmure vésiculaire normal, râles crépitants, ronchi, sibilants, frottement pleural, souffle systolique, B3, etc.).
- **Only use audio with a clear CC0/CC-BY licence**, credited in `CREDITS.md`. Ship with placeholder files and a clear `TODO` if licensed audio is not available, and let the student add files through the editor.

#### 👑 Examen du chef de service (boss fight)
- Unlocked at the end of each wing. A senior professor character asks an exam-format series: QCM, QROC and a cas clinique, in the faculty format (section 2.2).
- Passing threshold: 70% (configurable). Passing unlocks the next wing and a cosmetic reward.
- The professor has a stern-but-kind personality and short French dialogue lines.

#### 📝 Mode Examen blanc
- A "serious" mode with no game visuals, timer and exam conditions, configurable (number of questions, wings included, grading rule). Full correction at the end. For the weeks before real exams.

#### ☀️ Visite du matin (daily challenge)
- 5 patients mixing due follow-ups and new cards, available every day. Completing it keeps the **streak**.

#### 📋 Staff / RMM (mistake review)
- After each garde, a cozy "staff meeting" screen reviews the mistakes, with the correct reasoning and the fiche mémo. Framed as learning, not punishment.

### 5.3 Feedback tone
- Encouraging and a little funny, always respectful. Example lines:
  - Correct: « Excellent diagnostic, Docteur ! » / « Le chef serait fier de vous. »
  - Wrong: « Pas tout à fait… regardons ensemble ce qui nous a échappé. »
- Never mock the player or the patients.

---

## 6. Progression and rewards

### 6.1 Career ranks (Moroccan path)
| Rank | XP required | Unlocks |
|---|---|---|
| Étudiant(e) en sémiologie | 0 | Urgences wing, Consultation, Garde rapide |
| Externe | 1 000 | Qui suis-je, Mémo, second wing |
| Interne | 5 000 | Auscultation mode, boss fights |
| Résident(e) | 15 000 | Examen blanc settings, harder cases |
| Spécialiste | 35 000 | Golden stethoscope, rare cosmetics |
| Professeur agrégé(e) | 70 000 | Can "teach" (create and share cards) |
| Professeur(e) | 120 000 | Prestige mode |

XP values are tunable in `config/progression.json`.

### 6.2 Currency: Dirhams (DH) 💰
- Earned from patients, daily challenges and achievements.
- Spent on cosmetics (coat colors, scrubs, hijab styles, glasses, stethoscopes, office decorations, courtyard decorations: fountains, lanterns, zellige patterns, plants).
- **Thé à la menthe (atay) 🍵** = streak freeze: protects the streak for one missed day. Max 2 stored.
- No real money, no ads, no energy system that stops her from studying.

### 6.3 Mastery per wing
- Each wing shows a mastery percentage (share of its cards in a "mastered" spaced-repetition state).
- Mastery thresholds (25/50/75/100%) visually upgrade the wing diorama (section 4.1) and give a badge.

### 6.4 Achievements (examples)
- « Œil de lynx »: spot an ictère at inspection 10 times
- « Main experte »: find the correct abdominal region 50 times
- « Oreille d'or »: 20 correct auscultations in a row
- « Garde de nuit »: play a garde after 22:00
- « Sans filet »: diagnose a case with only key findings
- « Marathon »: 30-day streak
- « Pneumologue en herbe »: master the Pneumologie wing

### 6.5 Streak and goals
- Daily goal set by the student (e.g. 10 / 20 / 40 patients).
- Streak counter with a small flame on the hub, gentle reminder notification (PWA push, opt-in, configurable time).

---

## 7. Spaced repetition engine

Every playable item (card, case, question) has a scheduling record. Use **SM-2** (simple and robust), hidden behind the game.

### 7.1 Grade mapping from gameplay
| Gameplay result | SM-2 quality |
|---|---|
| Correct, fast, no extra clues | 5 |
| Correct, normal | 4 |
| Correct with hints / extra clues / after hesitation | 3 |
| Wrong but close (right system, wrong syndrome) | 2 |
| Wrong | 1 |
| Skipped / "je ne sais pas" | 0 |

### 7.2 Algorithm
```
if quality < 3:
    repetitions = 0
    interval = 1 day   (also re-queue in the same garde after 3–5 other patients)
else:
    if repetitions == 0: interval = 1
    elif repetitions == 1: interval = 3
    else: interval = round(interval * easeFactor)
    repetitions += 1
easeFactor = max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
dueDate = today + interval
```
- An item is **"maîtrisé"** when `interval >= 21 days`.

### 7.3 Session composition
For each garde: ~60% due follow-ups (oldest due first), ~30% new items (in curriculum order), ~10% random review of mastered items. Never more than 15 new items per day (configurable).

### 7.4 In-game framing
- Due items appear as **"Patients revenus en consultation de suivi"** with a small badge on the patient.
- A calendar view (« Mon agenda ») shows how many follow-ups are due in the coming days.

---

## 8. Content model

All content lives in versioned JSON files in `src/content/`, validated at build time with **Zod**. One folder per wing.

### 8.1 Wings (modules)
| ID | Name (FR) | Main content |
|---|---|---|
| `generale` | Sémiologie générale (Urgences) | Interrogatoire, examen général, constantes, fièvre, altération de l'état général, douleur, état de conscience (Glasgow) |
| `cardio` | Cardiologie | Douleur thoracique, dyspnée (NYHA), palpitations, syncope, auscultation cardiaque, souffles, insuffisance cardiaque droite/gauche, péricardite, pouls et TA, signes d'ischémie aiguë de membre |
| `pneumo` | Pneumologie | Toux, expectoration, hémoptysie, dyspnée, syndrome de condensation, épanchement pleural liquidien, pneumothorax, syndrome bronchique, cavitaire, hippocratisme digital, tuberculose |
| `digestif` | Gastro-entérologie | Douleur abdominale, 9 régions, dysphagie, vomissements, diarrhée, constipation, hémorragies digestives, ictère, hépatomégalie, splénomégalie, ascite, syndrome occlusif, péritonite, hypertension portale, insuffisance hépatocellulaire, kyste hydatique du foie |
| `neuro` | Neurologie | Syndrome pyramidal, extrapyramidal, cérébelleux, méningé, hypertension intracrânienne, réflexes, troubles sensitifs, syndrome vestibulaire, troubles de la conscience |
| `nephro` | Uro-néphrologie | Troubles mictionnels, hématurie, protéinurie, œdèmes, colique néphrétique, syndrome néphrotique et néphritique |
| `endo` | Endocrinologie | Hyper/hypothyroïdie, goitre, syndrome polyuro-polydipsique, Cushing, insuffisance surrénalienne, hypo/hypercalcémie |
| `locomoteur` | Appareil locomoteur | Douleur articulaire (mécanique vs inflammatoire), examen articulaire, rachis, sciatique (Lasègue), mal de Pott |
| `hemato` | Hématologie | Syndrome anémique, adénopathies, splénomégalie, syndrome hémorragique, syndrome tumoral |
| `dermato` | Dermatologie | Lésions élémentaires (macule, papule, vésicule, bulle, pustule, nodule…), purpura, leishmaniose cutanée |

### 8.2 Schema: Card (flashcard / quick question)
```json
{
  "id": "pneumo-condensation-001",
  "wing": "pneumo",
  "type": "card",
  "tags": ["syndrome", "examen-physique"],
  "difficulty": 1,
  "front": "Quels sont les signes physiques d'un syndrome de condensation pulmonaire ?",
  "back": "Matité à la percussion, augmentation des vibrations vocales, râles crépitants, souffle tubaire.",
  "explanation": "La densification du parenchyme pulmonaire transmet mieux les vibrations et s'oppose à l'aération normale.",
  "modes": ["garde-rapide", "memo", "qui-suis-je"],
  "source": "Cours de sémiologie, FMP — à vérifier",
  "status": "validated"
}
```

### 8.3 Schema: Clinical case (Consultation mode)
```json
{
  "id": "cas-pneumo-tb-001",
  "wing": "pneumo",
  "type": "case",
  "difficulty": 2,
  "patient": {
    "name": "Brahim",
    "age": 38,
    "sex": "M",
    "profession": "Ouvrier du bâtiment",
    "origin": "Quartier populaire, Casablanca",
    "appearance": {
      "skinTone": 4,
      "hair": "court-noir",
      "beard": true,
      "clothing": "tenue-travail",
      "visibleSigns": ["amaigrissement", "toux"]
    },
    "darija": "Kankoh chi chhar hadi o kantzel bzaf f lil"
  },
  "chiefComplaint": "Toux persistante depuis 6 semaines",
  "history": [
    { "q": "Depuis quand toussez-vous ?", "a": "Depuis environ un mois et demi.", "key": true },
    { "q": "Crachez-vous ? Y a-t-il du sang ?", "a": "Oui, des crachats, parfois avec un peu de sang.", "key": true },
    { "q": "Avez-vous de la fièvre ou des sueurs ?", "a": "J'ai des sueurs la nuit, surtout le soir je me sens fiévreux.", "key": true },
    { "q": "Avez-vous perdu du poids ?", "a": "Oui, environ 6 kilos en deux mois.", "key": true },
    { "q": "Quelqu'un dans votre entourage tousse-t-il ?", "a": "Mon collègue de chambre a été traité pour la tuberculose.", "key": true },
    { "q": "Fumez-vous ?", "a": "Un paquet par jour depuis 15 ans.", "key": false },
    { "q": "Avez-vous mal au ventre ?", "a": "Non.", "key": false, "irrelevant": true }
  ],
  "exam": [
    { "zone": "general", "tool": "inspection", "finding": "Patient amaigri, asthénique. T° 38,1 °C le soir.", "key": true },
    { "zone": "thorax-posterieur-droit-sommet", "tool": "auscultation", "finding": "Râles crépitants au sommet droit.", "key": true },
    { "zone": "thorax-posterieur-droit-sommet", "tool": "percussion", "finding": "Légère matité du sommet droit.", "key": false },
    { "zone": "aires-ganglionnaires-cervicales", "tool": "palpation", "finding": "Pas d'adénopathie palpable.", "key": false },
    { "zone": "abdomen-*", "tool": "palpation", "finding": "Abdomen souple, indolore.", "key": false, "irrelevant": true }
  ],
  "answer": {
    "syndrome": ["syndrome de condensation pulmonaire", "syndrome infectieux"],
    "etiology": "Tuberculose pulmonaire",
    "acceptedSynonyms": ["tuberculose", "TB pulmonaire", "tuberculose pulmonaire commune"],
    "distractors": ["Pneumopathie aiguë communautaire", "Cancer bronchique", "Kyste hydatique pulmonaire", "BPCO"]
  },
  "bonusQuestion": {
    "type": "qcm-unique",
    "question": "Quel examen demander en premier pour confirmer le diagnostic ?",
    "options": ["Recherche de BK dans les crachats (bacilloscopie)", "Échographie abdominale", "ECG", "IRM thoracique"],
    "correct": [0]
  },
  "teaching": "Toux prolongée + hémoptysie + sueurs nocturnes + amaigrissement + contage : tableau évocateur de tuberculose pulmonaire, fréquente au Maroc.",
  "status": "validated"
}
```

### 8.4 Schema: Exam question
```json
{
  "id": "qcm-neuro-012",
  "wing": "neuro",
  "type": "qcm-multiple",
  "question": "Parmi les signes suivants, lesquels font partie du syndrome méningé ?",
  "options": [
    "A. Céphalées",
    "B. Vomissements",
    "C. Raideur de la nuque",
    "D. Signe de Babinski obligatoire",
    "E. Photophobie"
  ],
  "correct": [0, 1, 2, 4],
  "explanation": "Le syndrome méningé associe céphalées, vomissements, photophobie (signes fonctionnels) et raideur méningée (raideur de nuque, signes de Kernig et Brudzinski). Le signe de Babinski n'en fait pas partie.",
  "grading": "faculty-default",
  "status": "validated"
}
```
Other question `type` values: `qcm-unique`, `qcm-multiple`, `qroc` (with `acceptedAnswers: []`), `cas-clinique` (a vignette + an ordered array of sub-questions), `association` (matching), `auscultation` (with `audioFile`), `image` (with `imageFile`, e.g. a skin lesion).

### 8.5 Sample validated content to include (seed set)
Seed the app with these items; they must appear exactly as written (the student may refine them later).

**Signes éponymes (Qui suis-je)**
| Signe | Description | Signification |
|---|---|---|
| Signe de Murphy | Douleur à la palpation de l'hypochondre droit provoquant un arrêt de l'inspiration profonde | Cholécystite aiguë |
| Signe de Blumberg | Douleur provoquée par la décompression brutale de la fosse iliaque droite | Irritation péritonéale (appendicite) |
| Signe de Rovsing | Douleur en fosse iliaque droite lors de la pression de la fosse iliaque gauche | Appendicite aiguë |
| Signe de Babinski | Extension lente du gros orteil à la stimulation de la plante du pied | Atteinte du faisceau pyramidal |
| Signe de Kernig | Résistance douloureuse à l'extension de la jambe, cuisse fléchie sur le bassin | Syndrome méningé |
| Signe de Brudzinski | Flexion involontaire des membres inférieurs lors de la flexion forcée de la nuque | Syndrome méningé |
| Signe de Lasègue | Douleur radiculaire lors de l'élévation de la jambe tendue | Radiculalgie (sciatique L5/S1) |
| Signe de Chvostek | Contraction de la commissure labiale à la percussion de la joue | Hypocalcémie (hyperexcitabilité neuromusculaire) |
| Signe de Trousseau | Spasme de la main (« main d'accoucheur ») après gonflement d'un brassard | Hypocalcémie |
| Signe du godet | Dépression persistante après pression du doigt sur un œdème | Œdème (rétention hydrosodée) |
| Ganglion de Troisier | Adénopathie sus-claviculaire gauche | Cancer digestif (néoplasie abdominale) |

**Syndromes pleuro-pulmonaires (cards / Mémo)**
| Syndrome | Percussion | Vibrations vocales | Auscultation |
|---|---|---|---|
| Condensation | Matité | Augmentées | Râles crépitants, souffle tubaire |
| Épanchement pleural liquidien | Matité | Abolies | Murmure vésiculaire aboli, souffle pleurétique possible |
| Pneumothorax | Tympanisme | Abolies | Murmure vésiculaire aboli |

**Other key cards**
- Triade de Charcot (angiocholite aiguë): douleur de l'hypochondre droit, puis fièvre, puis ictère, en 24–48 heures.
- Ictère cholestatique: urines foncées, selles décolorées, prurit.
- Insuffisance cardiaque droite: turgescence jugulaire, reflux hépato-jugulaire, hépatomégalie douloureuse, œdèmes des membres inférieurs.
- Syndrome méningé: céphalées, vomissements, photophobie, raideur de nuque.
- Score de Glasgow: ouverture des yeux (1–4), réponse verbale (1–5), réponse motrice (1–6); total 3–15.
- Classification NYHA de la dyspnée: stade I (pas de gêne) à stade IV (dyspnée de repos).
- Douleur articulaire inflammatoire vs mécanique: inflammatoire = nocturne, réveil, dérouillage matinal prolongé; mécanique = à l'effort, calmée par le repos.
- Hippocratisme digital: bombement des ongles en verre de montre et élargissement des dernières phalanges en baguettes de tambour.

**Seed cases**: include the tuberculosis case from 8.3 plus at least these, each written in the same schema, marked `"status": "draft"` until the student validates them:
1. Cholécystite aiguë (femme, 45 ans, Murphy positif)
2. Appendicite aiguë (jeune homme, douleur FID, Blumberg)
3. Kyste hydatique du foie (agriculteur, région rurale, contact avec des chiens, hépatomégalie)
4. Insuffisance cardiaque droite (patiente âgée, OMI, turgescence jugulaire)
5. Épanchement pleural liquidien
6. Méningite (syndrome méningé + fièvre)
7. Syndrome anémique (pâleur, asthénie, dyspnée d'effort)
8. Brucellose (fièvre ondulante, sueurs, arthralgies, consommation de lait cru)

### 8.6 Content volume targets
- v1: ~300 cards, ~40 cases, ~150 exam questions across the wings.
- Content files can grow without code changes. Images go to `public/media/images/`, sounds to `public/media/audio/`.

---

## 9. Screens and UX flows

1. **Splash / chargement**: hospital diorama assembles itself tile by tile while assets load (progress bar styled as an IV drip).
2. **Onboarding (first launch only)**: pick a name → create the doctor (Vestiaire) → choose faculty and year → set daily goal → guided **tutorial patient** that teaches the Consultation controls (under 3 minutes, skippable).
3. **Hub (CHU)**: isometric hospital map. Top bar: rank + XP bar, Dirhams, streak flame, settings. Bottom bar (mobile): Accueil, Agenda, Fiches, Vestiaire, Profil. Big button: « Commencer la garde ».
4. **Wing screen**: wing diorama with its title, mastery %, mode buttons (Consultation, Garde rapide, Qui suis-je, Mémo, Auscultation, Boss), due follow-ups count.
5. **Consultation**: 3D room + bottom sheet with tabs (Interrogatoire / Examen / Notes / Synthèse). In-game clock top left, patient card top right.
6. **Résultat patient**: animated feedback, signs found/missed highlighted on the 3D patient, fiche mémo, « Patient suivant ».
7. **Fin de garde**: report card (patients seen, accuracy, XP, DH, new items, follow-ups scheduled), confetti for records.
8. **Staff / RMM**: mistakes review.
9. **Agenda**: calendar of due follow-ups and streak history.
10. **Mes fiches**: all items she has seen, searchable and filterable by wing/tag/status; she can star items and read the fiche mémo.
11. **Vestiaire / Boutique**: cosmetics with the 3D doctor rotating on a pedestal.
12. **Profil / Statistiques**: accuracy per wing (radar chart), time studied, best streak, achievements.
13. **Examen blanc**: configuration screen → exam → full correction.
14. **Paramètres**: cursus (faculty, year, modules), grading rules, daily goal, sound/music, darija lines on/off, graphics quality, Mode 2D léger, dark mode, notifications, data export/import, reset.
15. **Éditeur de contenu** (section 14).

**UX rules**
- Every screen reachable in ≤ 2 taps from the hub.
- Thumb-friendly: main actions in the bottom half on mobile, minimum 44×44 px tap targets.
- Pausing is always possible; leaving mid-garde saves progress and resumes on the same patient.
- Loading states always animated, never a blank screen.

---

## 10. Tech stack and architecture

| Concern | Choice |
|---|---|
| Build | **Vite** + **TypeScript** (strict) |
| UI | **React 18+**, **Tailwind CSS**, **Framer Motion** |
| 3D | **three**, **@react-three/fiber**, **@react-three/drei**, light **@react-three/postprocessing** (desktop only) |
| State | **Zustand** (game state, settings), React Query not needed |
| Persistence | **Dexie** (IndexedDB) for progress and scheduling; settings in IndexedDB too |
| Validation | **Zod** schemas for all content files (build fails on invalid content) |
| Audio | **Howler.js** |
| Routing | **React Router** |
| PWA / offline | **vite-plugin-pwa** (installable, works fully offline after first load) |
| Tests | **Vitest** (logic), **Playwright** (end-to-end flows) |
| Lint/format | ESLint + Prettier |
| Hosting | Static hosting (Netlify, Vercel or GitHub Pages). No backend required for v1. |
| Optional v2 backend | **Supabase** for accounts, cloud sync and a class leaderboard |

### 10.1 Folder structure
```
semiogarde/
├─ docs/
│  └─ design-references/        # tokyo.jpg, okinawa.jpg, bali.jpg (isometric diorama references)
├─ public/
│  ├─ models/                   # .glb (compressed)
│  ├─ media/images/
│  ├─ media/audio/              # sfx, music, auscultation sounds
│  └─ icons/                    # PWA icons
├─ src/
│  ├─ app/                      # routes, layout, providers
│  ├─ scenes/                   # 3D scenes: Hub, Wing, ConsultationRoom, StaffRoom, Vestiaire
│  ├─ three/                    # reusable 3D: Diorama, Character, PatientBuilder, Hotspot, CameraRig, Lighting
│  ├─ ui/                       # 2D components: Button, Card, BottomSheet, XPBar, Toast...
│  ├─ features/
│  │  ├─ consultation/
│  │  ├─ garde-rapide/
│  │  ├─ qui-suis-je/
│  │  ├─ memo/
│  │  ├─ auscultation/
│  │  ├─ boss/
│  │  ├─ examen-blanc/
│  │  ├─ progression/           # XP, ranks, DH, achievements, streaks
│  │  ├─ srs/                   # SM-2 engine + session builder
│  │  └─ editor/                # content editor
│  ├─ content/                  # JSON content per wing + index
│  │  ├─ schemas.ts             # Zod schemas
│  │  ├─ generale/ cardio/ pneumo/ digestif/ neuro/ nephro/ endo/ locomoteur/ hemato/ dermato/
│  ├─ config/                   # progression.json, exam-formats.json, faculties.json
│  ├─ db/                       # Dexie schema and repositories
│  ├─ i18n/fr.json              # all UI strings (French)
│  ├─ audio/                    # Howler wrapper
│  └─ utils/                    # text normalization (accents), random, dates
├─ scripts/                     # validate-content.ts, compress-models.sh, import-csv.ts
├─ CREDITS.md
└─ README.md
```

### 10.2 Key modules
- **`srs/engine.ts`**: pure functions `review(item, quality, now)` and `buildSession(wing, date, limits)`. 100% unit-tested.
- **`features/consultation/caseRunner.ts`**: state machine (XState-like, or a reducer) with states `arrival → interrogatoire → examen → synthese → feedback`. Keeps the 3D layer dumb: the 3D scene only renders state and emits events (`ZONE_TOOL_USED`, `QUESTION_ASKED`, `DIAGNOSIS_SUBMITTED`).
- **`three/PatientBuilder.tsx`**: builds a patient from `appearance` (modular parts + blend shapes + shader tints for visible signs).
- **`utils/normalize.ts`**: answer matching for QROC: lowercase, strip accents, trim, collapse spaces, match against `acceptedAnswers` plus small typo tolerance (Levenshtein ≤ 2 for words over 6 letters).
- **`content/index.ts`**: loads and validates all content, builds lookups by wing, tag and type.

---

## 11. Data and persistence
- **IndexedDB tables:** `profile` (name, avatar, faculty, year), `progress` (XP, rank, DH, streak, achievements), `srs` (itemId → repetitions, interval, easeFactor, dueDate, history), `sessions` (garde logs), `customContent` (items created/edited by the student), `settings`.
- **Export/Import:** one-click export of all data to a `.json` file and re-import (so she never loses progress when changing phones). Reminder to export every 30 days if no cloud sync.
- Fully offline after first load. No personal data leaves the device in v1.

---

## 12. Audio
- **Music:** calm lo-fi loop in the hub, slightly more upbeat during Garde rapide; optional light Moroccan instrument touches (oud, guembri) if licensed tracks are available. Volume sliders for music and effects.
- **SFX:** button taps, patient footsteps, door, stethoscope, correct ding, soft wrong tone, combo sounds, level-up fanfare, ambulance siren (short, soft).
- All audio CC0 or properly licensed and listed in `CREDITS.md`.

---

## 13. Accessibility and language
- All UI strings in `src/i18n/fr.json` (structure ready for Arabic or English later, including RTL support for Arabic).
- Colorblind-safe feedback (icons + text, not only red/green).
- Text size setting, reduced motion setting (disables camera tweens and confetti), high-contrast option.
- Every 3D interaction has a 2D equivalent (list of zones and tools in the bottom sheet) for accessibility and for Mode 2D léger.
- Screen reader labels on all controls.

---

## 14. Content editor (in-app)
The student must be able to add and fix content herself without code:
- **« Éditeur »** screen (accessible from Paramètres, PIN-protected optional).
- Forms for each item type (card, case, QCM, QROC, cas clinique) with live preview of how it looks in the game.
- Case editor: pick patient appearance in a mini 3D preview, add history questions and exam findings by selecting zone + tool from dropdowns.
- **Status workflow:** `draft → validated`. Draft items can be played in a "Brouillons" practice mode, with a badge, and never count in exam modes.
- **Import:** CSV/Excel import for cards and QCMs (template provided in `docs/import-template.csv`), useful to convert her course notes and past exam questions in bulk.
- **Export/Share:** export a wing as JSON to share with classmates; import a shared pack.
- Report button « Signaler une erreur » on every feedback screen, which flags the item for review.

---

## 15. Testing and acceptance criteria

### 15.1 Automated
- Unit tests: SM-2 engine, session builder, scoring, XP/rank thresholds, QROC answer matching, content validation.
- E2E (Playwright): onboarding, complete a Consultation, complete a Garde rapide, pass a boss, export/import data, offline reload.
- CI script `npm run validate:content` fails on any invalid content file.

### 15.2 Acceptance criteria for v1
- [ ] The hub, wings and consultation room render in the isometric diorama style of the references (pastel background, base slab, big title, soft shadows).
- [ ] The doctor is customizable (including hijab option) and animated; patients are generated with varied appearances and visible clinical signs.
- [ ] Consultation mode is fully playable with 3D body zones, tools, interrogatoire and synthesis.
- [ ] Garde rapide, Qui suis-je, Mémo and Boss modes work.
- [ ] SM-2 scheduling works and follow-up patients appear when due.
- [ ] XP, ranks, Dirhams, streaks, achievements and wing mastery visuals work.
- [ ] All seed content from section 8.5 is present and correct; all UI is in French.
- [ ] Runs at 30+ fps on a mid-range phone in "Moyenne" quality; Mode 2D léger works.
- [ ] Works offline as an installed PWA; progress persists and exports/imports correctly.
- [ ] The content editor can create, edit, validate and import items.

---

## 16. Build phases

**Phase 1 — Foundations (playable prototype)**
Vite + React + TS setup, theme tokens, fonts, French i18n, content schemas + seed content, SM-2 engine with tests, Dexie storage, simple hub with primitive-shape 3D hospital, Garde rapide mode in 2D UI over a 3D background.

**Phase 2 — Consultation in 3D**
Consultation room diorama, primitive-shape doctor and patient, clickable body zones with tool menu, case runner state machine, feedback screen, seed cases playable.

**Phase 3 — Game layer**
XP, ranks, Dirhams, streaks, daily challenge, end-of-garde report, Staff/RMM, achievements, Agenda, Mes fiches, Qui suis-je and Mémo modes.

**Phase 4 — Final art**
Real GLB models (hospital with Moroccan details, wing dioramas, characters with modular parts, blend shapes for clinical signs), Mixamo animations, Vestiaire and shop, wing mastery upgrades, sounds and music, polish animations.

**Phase 5 — Exam modes and editor**
Boss fights, Examen blanc with faculty grading rules, Auscultation mode, content editor with CSV import and pack sharing.

**Phase 6 — Performance and release**
Quality presets, Mode 2D léger, accessibility pass, PWA install and offline, E2E tests, deployment to static hosting.

**Optional v2:** accounts + cloud sync + class leaderboard (Supabase), multiplayer "garde à deux" quiz duel with classmates, Arabic UI.

---

## 17. Credits, licences and medical disclaimer
- List every third-party model, texture, font, sound and music file in `CREDITS.md` with its licence and author.
- Show this disclaimer on the onboarding and in Paramètres → À propos:
  > « SémioGarde est un outil d'aide à la révision. Il ne remplace pas les cours de la faculté ni l'enseignement clinique. Vérifiez toujours le contenu avec vos supports de cours officiels. »
- Content created by the AI builder stays in `draft` status until the student validates it.

---

*Made with ❤️ for a future doctor.*
