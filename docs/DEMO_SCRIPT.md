# DEMO_SCRIPT.md

## Goal

Provide a presenter-ready script for showing `Umbra Bounty Vault` as a privacy-first reward workflow rather than as a generic transfer demo.

This file is intentionally aligned with the current repository scope:

- real wallet adapter entry with linked demo-session continuity
- minimal live devnet anchor in Create Payout
- typed demo Umbra service boundary
- linked lifecycle continuity across product surfaces

It should not be read as a claim of full live end-to-end protocol integration or one shared on-chain payout context across every page.

---

## 1. Demo framing

### One-line opening

`Umbra Bounty Vault` is a privacy-first reward distribution workflow for bounties, grants, and contributor rewards.

### Core positioning

Use this framing early:

- this is not a generic wallet UI
- this is not just a hidden transfer demo
- this is a product workflow for private payout creation, recipient claim, and controlled disclosure

### Why Umbra

Use a short, repeatable line:

> Instead of treating privacy as a hidden transfer trick, we turned Umbra into a contributor reward workflow: private issuance, recipient claim, and controlled disclosure.

---

## 2. 3–5 minute demo script

### Scene 1 — Opening problem
**Time:** 20–30s  
**Screen:** Landing (`/`)

**Say:**
- Teams often need to send contributor rewards, grants, or bounties without exposing the full recipient relationship publicly.
- A normal transfer flow can move funds, but it does not model private issuance, recipient claim, and selective disclosure as one product experience.
- This project is built around that lifecycle.

**Goal:**
Establish that the problem is reward distribution privacy, not generic payments.

---

### Scene 2 — Why this product exists
**Time:** 20–30s  
**Screen:** Landing hero

**Say:**
- Umbra gives privacy-oriented primitives.
- We wanted to shape those primitives into a user-facing reward workflow.
- The point is not anonymous spending in general; the point is privacy-first reward distribution.

**Goal:**
Make sponsor fit clear before touching the detailed workflow.

---

### Scene 3 — Create Payout
**Time:** 40–60s  
**Screen:** Create Payout (`/app/payouts/new`)

**Do:**
- show wallet preview session connected
- fill recipient, token mint, amount
- move into review
- submit the preview payout

**Say:**
- Here the sender is guided through a structured payout flow instead of a raw transaction form.
- The product frames payout creation as part of a contributor reward workflow.
- In the current repo, this is where the minimal live devnet anchor exists, with the rest of the workflow staying inside a linked demo session and typed demo boundary.

**Goal:**
Show product structure, not just form submission.

---

### Scene 4 — Claim Center
**Time:** 45–60s  
**Screen:** Claim Center (`/app/claim`)

**Do:**
- show scan state
- reveal claimable payout list
- trigger claim on a prepared payout state

**Say:**
- On the recipient side, the experience is claim-based rather than a normal public wallet receipt.
- The user discovers eligible reward states and claims through the app.
- In the current demo scope, the recipient follows the same linked demo session through a wallet-scoped claim continuity flow rather than a fully live devnet claim indexer or settlement path.

**Goal:**
Highlight the strongest product differentiator: claimable rewards, not just direct transfer.

---

### Scene 5 — Disclosure / Verification
**Time:** 40–50s  
**Screen:** Disclosure / Verification (`/app/disclosure`)

**Do:**
- show the disclosure page as a bounded verification view
- point out revealed fields and verification artifacts
- explain that the view is intentionally limited

**Say:**
- Privacy does not have to mean zero explainability.
- Some workflows still require limited proof or verification context.
- In the current implementation, this page stays within the same linked demo narrative and demonstrates controlled disclosure through the typed service boundary rather than a full live disclosure backend.

**Goal:**
Explain that privacy and verification can coexist without implying one shared live payout context across pages.

---

### Scene 6 — Activity / Lifecycle
**Time:** 20–30s  
**Screen:** Activity (`/app/activity`)

**Do:**
- show the narrative summary
- point out payout, claim, and disclosure milestones
- describe the page as a prepared lifecycle narrative

**Say:**
- Activity summarizes the reward lifecycle as one coherent product narrative.
- This is where isolated crypto actions become a readable workflow story.
- In the current implementation, this page stays wallet-scoped and live-aware within the linked demo narrative, while still falling back from a fully live end-to-end replay when no matching active session is available.

**Goal:**
Close the loop in product terms while staying honest about current continuity limits.

---

### Scene 7 — Closing
**Time:** 15–20s  
**Screen:** Landing or Activity

**Say:**
- Umbra Bounty Vault shows how Umbra can support a privacy-first reward workflow.
- Not just private transfers, but claimable contributor rewards with controlled disclosure.

**Closing line:**
> Private rewards, claimable payouts, controlled disclosure.

---

## 3. 90-second compressed script

### Opening
`Umbra Bounty Vault` is a privacy-first reward workflow for bounties, grants, and contributor rewards.

### Middle
- Teams need to issue rewards without exposing every recipient relationship publicly.
- This app shows a structured flow for private payout creation, recipient claim, and controlled disclosure.
- The current demo uses a minimal live devnet anchor in Create Payout plus prepared product states and a typed demo service boundary to explain the rest of the workflow clearly.

### Closing
- The result is a workflow narrative: create, claim, disclose, review.
- It is a product story, not just a protocol button.

---

## 4. Recommended screen order

### Core demo order

Use this order when time is limited or you want the clearest sponsor-fit path:

1. Landing
2. Create Payout
3. Claim Center
4. Disclosure / Verification
5. Activity
6. Closing frame

### Extended demo order

If you want to include more application framing, insert these optional surfaces:

1. Landing
2. Wallet preview connect moment
3. Dashboard
4. Create Payout
5. Claim Center
6. Disclosure / Verification
7. Activity
8. Closing frame

Why these orders work:

- both start from problem and sponsor fit
- core order stays tight around create -> claim -> disclosure -> activity
- extended order gives more product framing without changing the core narrative

---

## 5. Fallback script

Use fallback mode when wallet preview interaction, environment state, or page transitions are unstable.

### Ground rules

- do not pretend a live on-chain action succeeded
- do not debug live during the pitch
- keep the product story moving
- clearly label prepared or preview states when needed

---

### Fallback A — wallet preview interaction fails

**Say:**
- The local wallet preview interaction is not behaving reliably in this environment, so I’m switching to prepared product states.
- What matters here is the workflow: private payout creation, recipient claim, and controlled disclosure.
- I’ll use prepared screens to explain the lifecycle without implying a live confirmed transaction.

**Flow:**
Landing -> prepared Create Payout state -> prepared Claim Center state -> Disclosure -> Activity

---

### Fallback B — claim flow becomes unstable

**Say:**
- Normally the recipient would scan and claim here.
- If the environment is unstable, I stop the interaction and switch to prepared post-claim states.
- Those prepared states are only for explaining the rest of the lifecycle.

**Flow:**
Current Claim Center -> prepared claimed state -> Disclosure -> Activity

---

### Fallback C — time is cut to 90 seconds

Keep only:

1. Landing value frame
2. Create Payout
3. Claim Center
4. Disclosure
5. Closing line

---

## 6. Presenter notes

### What to emphasize

- privacy-first payout workflow
- claimable contributor rewards
- controlled disclosure for verification contexts
- turning Umbra-oriented primitives into a user-facing app flow

### What to avoid

Avoid saying:

- this is a generic privacy wallet
- this is a finished production treasury system
- this is a full live Umbra integration
- this demo proves one continuous on-chain context across every page

### Honest scope note

If asked directly about implementation scope, say:

- the current repository demonstrates the workflow through a linked demo session and prepared fallback states
- the service boundary is intentionally typed and demo-friendly
- Create Payout contains the current live devnet anchor
- claim, disclosure, and activity are not yet a fully live end-to-end devnet path
- disclosure and activity stay aligned with the same linked demo narrative rather than proving one shared live backend or indexer context
- the goal of this submission is to show a credible product shape and lifecycle
