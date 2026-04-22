# DESIGN.md

## 1. Design Intent

The product should look like a **serious privacy-fintech product with editorial character**, not like a generic hackathon dashboard or a default component-library shell.

The design goal is to make privacy feel:
- intentional
- premium
- comprehensible
- operationally useful

The interface should visually communicate that this is a reward workflow with trust boundaries, not a toy crypto experiment.

---

## 2. Visual Direction

### Chosen Direction
**Editorial Privacy Fintech**

### Why This Direction
This direction balances:
- credibility
- product polish
- privacy atmosphere
- presentation clarity for a hackathon demo

It avoids two weak extremes:
- sterile enterprise dashboard UI
- flashy cyberpunk privacy cliché

### Desired Impression
The product should feel like:
- a refined operator tool
- a modern crypto-native product
- a designed experience with narrative flow
- a calm but high-signal interface

---

## 3. Personality

The visual and interaction personality should be:
- composed
- deliberate
- high-trust
- focused
- slightly premium
- privacy-aware without becoming theatrical

Avoid:
- meme styling
- dark-only hacker aesthetics
- overloaded glassmorphism
- default Tailwind / shadcn screenshot vibes

---

## 4. Theme Strategy

### Primary Theme
**Light-first**

### Accent Strategy
Use selective darker surfaces or deeper tonal blocks to emphasize:
- privacy-sensitive actions
- disclosure boundaries
- key transactional review moments

### Reasoning
A light-first theme improves:
- readability
- demo clarity
- perceived product maturity
- visual contrast for editorial hierarchy

Dark should feel intentional where used, not like a global fallback.

---

## 5. Color Strategy

### Palette Behavior
The palette should support:
- strong information hierarchy
- clear state signaling
- subtle privacy atmosphere
- disciplined accent usage

### Recommended Palette Logic
- **Base:** warm or neutral light surfaces
- **Text:** deep neutral ink tones
- **Accent:** a controlled violet / indigo / blue family for privacy-tech cues
- **Success:** muted but readable green
- **Warning / Pending:** amber or gold with restrained usage
- **Error:** disciplined red, not overly saturated

### Color Principles
- do not rely on one neon accent everywhere
- use color semantically, not decoratively
- preserve strong text contrast
- use darker sectional surfaces sparingly to create emphasis and depth

---

## 6. Typography

### Typographic Goal
Typography should create an editorial product feel with strong hierarchy.

### Recommended Pairing Strategy
- one display face with character for headings / hero moments
- one highly readable sans-serif for product UI and body text

### Typography Principles
- landing and major headings should feel intentional and high-contrast
- product UI should remain compact and readable
- disclosure and activity views should feel precise and structured

### Hierarchy Requirements
The interface should visibly differentiate:
- product promise
- page title
- section title
- supporting explanation
- metadata / auxiliary labels

Avoid flat typography where everything feels the same weight and scale.

---

## 7. Layout Rhythm

### Layout Direction
Use a layout rhythm closer to editorial product design than to uniform admin cards.

### Requirements
- intentional spacing changes between sections
- asymmetric composition where it helps hierarchy
- moments of breathing room around primary actions
- clear grouping for sensitive transactional steps

### Avoid
- uniform card grid everywhere
- same radius / same padding / same spacing across all blocks
- feature list layouts that look like startup boilerplate

---

## 8. Surface Strategy

The interface should use layered surfaces with distinct roles.

### Surface Roles
- **Base surface:** primary background
- **Panel surface:** structured content containers
- **Emphasis surface:** review steps, privacy-sensitive states, important summaries
- **Inset surface:** metadata, helper info, supportive state descriptions

### Surface Principles
- depth should come from layering, contrast, and composition
- shadows and borders should be controlled, not decorative spam
- disclosure and claim surfaces should feel “bounded” and intentional

---

## 9. Motion and Interaction

### Motion Goal
Motion should clarify product flow, not distract from it.

### Motion Use Cases
- step transitions in create payout
- scanning / discovery feedback in claim center
- progressive readiness states in disclosure
- timeline reveal or state progression in activity

### Motion Principles
- prefer composited motion (`transform`, `opacity`)
- use short, decisive transitions
- reduce motion when system preference requires it
- avoid large ornamental animations that weaken product seriousness

### Interaction Principles
- hover states should feel designed, not default
- focus states must be visible and deliberate
- review and confirmation interactions should feel trustworthy and explicit

---

## 10. Page-by-Page Design Notes

## 10.1 Landing
### Purpose
Communicate the category immediately: private reward distribution, not generic private payments.

### Design Notes
- strong hero with clear product framing
- visible explanation of payout -> claim -> disclosure lifecycle
- sponsor-fit story should appear early
- visual hierarchy should feel more editorial than template-marketing

### Must Avoid
- centered generic headline + gradient blob + CTA template
- generic “secure payments” language

---

## 10.2 Dashboard
### Purpose
Orient the user after wallet connection.

### Design Notes
- show concise overview, not analytics overload
- emphasize actionable next steps
- create payout, claim center, and disclosure should be legible pathways
- empty state should still feel like a product, not a blank app shell
- the surface should work as a workflow handoff into the linked demo path, not as a decorative placeholder

---

## 10.3 Create Payout
### Purpose
Frame payout creation as a careful, structured reward action.

### Design Notes
- form should feel guided, not raw
- review step should be visually distinct and high-trust
- sensitive or important fields should receive stronger emphasis surfaces
- success state should lead naturally into next actions

---

## 10.4 Claim Center
### Purpose
Make discovery and claim feel like a purposeful recipient experience.

### Design Notes
- scanning state should feel alive but controlled
- found / none / pending / success states should each have distinct presentation
- recipient should always understand what the system is doing
- this page should feel different from a wallet inbox or simple transfer list

---

## 10.5 Disclosure / Verification
### Purpose
Express the idea of controlled visibility.

### Design Notes
- visually communicate boundaries: what is shown vs what remains private
- use layered presentation to reinforce “limited view” semantics
- verification-ready state should feel formal and intentional
- avoid turning this into a dry table-only compliance page

---

## 10.6 Activity
### Purpose
Tie isolated actions into a lifecycle narrative.

### Design Notes
- timeline or event-sequenced composition works better than a plain log table
- emphasize causality: payout created -> claim discovered -> claim completed -> disclosure state
- this page should help close the demo story

---

## 11. Component Inventory

### 11.1 App Shell Components
- app header
- section navigation
- wallet status block
- network status block
- page intro / section intro modules

### 11.2 Marketing Components
- hero
- value proposition blocks
- flow explainer
- sponsor-fit section
- CTA section

### 11.3 Payout Components
- payout form
- review card
- disclosure option selector
- payout success summary

### 11.4 Claim Components
- scanning state module
- claimable payout card
- claim action panel
- empty / none-found state block

### 11.5 Disclosure Components
- disclosure readiness card
- verification summary block
- bounded visibility panel
- share / export action area if implemented

### 11.6 Activity Components
- activity timeline
- lifecycle event card
- status badge system

### 11.7 Shared UI Primitives
- buttons
- inputs
- badges
- panels
- steppers
- segmented controls
- inline helper text
- feedback toasts / notices

---

## 12. Shared Design Patterns

### 12.1 Hierarchy Through Contrast
Every major page should demonstrate strong hierarchy via scale, spacing, and density differences.

### 12.2 Designed States
Loading, empty, success, pending, and error states must feel designed, not default placeholders.

### 12.3 Surface Layering
Use different surfaces to distinguish:
- action
- review
- status
- disclosure boundary
- contextual explanation

### 12.4 Semantic Motion
Transitions should communicate progression, scanning, readiness, or confirmation.

---

## 13. Responsive Rules

The product must remain intentional across:
- 320
- 375
- 768
- 1024
- 1440
- 1920

### Responsive Priorities
- no overflow on primary flows
- create payout remains usable on mobile widths
- claim center states remain legible on mobile
- disclosure layout remains structured rather than collapsing into noise
- landing hero must retain hierarchy at narrow widths

---

## 14. Accessibility Rules

### Required
- keyboard-navigable major flows
- visible focus states
- adequate contrast
- reduced-motion compliance
- readable form labels and helper content

### Design Guidance
Accessibility must feel integrated into the design system rather than added after the fact.

---

## 15. Stitch Strategy

### Role of Stitch
Stitch should be used for **prototype acceleration**, not as the final architecture or final design authority.

### Intended Workflow
1. generate first-pass prototype
2. review against product and design constraints
3. refine layout, hierarchy, and page purpose
4. map prototype into real feature-based frontend architecture

### Stitch Constraints
The Stitch output should be corrected if it:
- looks like a generic startup landing page
- turns the app into a dashboard-by-numbers layout
- loses reward workflow specificity
- makes disclosure look like a plain admin report
- makes claim feel like a normal visible transfer list

---

## 16. Definition of Good Design for This Project

The design is successful if:
- it does not look template-generated
- it clearly communicates a privacy-first reward workflow
- each major page has a distinct purpose and visual identity
- the product feels polished enough for hackathon judging
- the visual system supports the payout -> claim -> disclosure -> activity narrative
