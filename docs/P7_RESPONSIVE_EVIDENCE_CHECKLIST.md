# P7 Responsive Evidence Checklist

Date: 2026-04-28  
Environment target: Local browser/manual validation for the current repository surfaces

## Purpose

Define the committed responsive evidence scope for Phase P7-1 and provide a capture checklist for screenshot artifacts without overstating current completion.

This file is an evidence entry point, not a claim that the screenshot pack is already complete.

## Required breakpoints

- 320
- 375
- 768
- 1024
- 1440
- 1920

## Critical surfaces

| Surface | Route | State to capture | Why it matters |
| --- | --- | --- | --- |
| Landing | `/` | Hero visible with primary CTA | Establishes first-screen readability and headline integrity |
| Create Payout | `/app/payouts/new` | Wallet-disconnected gated state | Confirms the live entry surface stays usable before wallet connection |
| Claim Center | `/app/claim` | Wallet-disconnected preview state | Confirms claim messaging and wallet gate remain readable on narrow widths |
| Disclosure / Verification | `/app/disclosure` | Overview + revealed fields + verification artifacts visible | Confirms multi-region layout remains coherent across breakpoints |
| Activity | `/app/activity` | Narrative summary visible | Confirms lifecycle narrative remains readable and non-overlapping |

## Acceptance checks

For each surface and breakpoint, verify:

- no horizontal overflow
- no clipped or overlapping headings, body copy, buttons, or badges
- primary action remains visible and tappable
- named regions/cards stack in a readable order
- wallet-gated messaging remains visible without truncation
- disclosure and activity summary regions remain fully readable
- navigation and shell chrome remain usable

## Screenshot checklist

Status legend:

- `Pending` — target screenshot not yet committed
- `Captured` — screenshot committed in the repository
- `N/A` — not applicable for that surface/state

| Surface | 320 | 375 | 768 | 1024 | 1440 | 1920 | Current status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Landing | Pending | Pending | Pending | Pending | Pending | Pending | Checklist only |
| Create Payout | Pending | Pending | Pending | Pending | Pending | Pending | Checklist only |
| Claim Center | Pending | Pending | Pending | Pending | Pending | Pending | Checklist only |
| Disclosure / Verification | Pending | Pending | Pending | Pending | Pending | Pending | Checklist only |
| Activity | Pending | Pending | Pending | Pending | Pending | Pending | Checklist only |

## Recommended artifact naming

If screenshots are added later, keep names deterministic:

- `landing-320.png`
- `create-payout-320.png`
- `claim-center-320.png`
- `disclosure-320.png`
- `activity-320.png`

Repeat the same pattern for `375`, `768`, `1024`, `1440`, and `1920`.

## Current committed status

What exists now:

- this responsive evidence checklist
- `docs/P7_VALIDATION_EVIDENCE.md` as the current cross-area evidence summary
- browser-manual validation references elsewhere in project materials

What does not exist yet:

- a committed screenshot pack across all target breakpoints
- a committed overflow issue ledger with before/after captures

## Safe wording for reviewers

Reviewer-safe summary:

> The repository now includes a committed responsive evidence checklist that defines the required surfaces, breakpoints, and acceptance checks for Phase P7-1. This improves auditability of the responsive validation scope, but it is not the same as a completed screenshot pack, which is still missing as a committed artifact.
