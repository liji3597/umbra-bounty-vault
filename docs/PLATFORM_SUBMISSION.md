# PLATFORM_SUBMISSION.md

## Title
Umbra Bounty Vault

## Tagline
**Private rewards, claimable payouts, controlled disclosure.**

## One-line Description
Umbra Bounty Vault is a privacy-first reward workflow for bounties, grants, and contributor rewards.

## At a Glance

| Topic | Summary |
| --- | --- |
| Product shape | A user-facing workflow for private payout creation, recipient claim, controlled disclosure, and lifecycle review |
| Sponsor fit | Umbra is used as privacy infrastructure for reward distribution, not as a generic transfer demo |
| Current live anchor | `Create Payout` can submit a real devnet SOL transfer through the injected wallet authority |
| Current boundary | `Claim Center`, `Disclosure`, and `Activity` still rely on wallet-scoped typed demo continuity |
| Validation posture | Current evidence supports a bounded demo submission, not a full audit-complete delivery |

## Project Overview
Contributor rewards are usually distributed through fully visible transfer flows. That makes recipient relationships, reward timing, and payout patterns easy to trace.

Umbra Bounty Vault reframes Umbra as product infrastructure for reward distribution rather than as a generic private transfer demo. The workflow centers on private payout creation, recipient claim, and controlled disclosure when verification is needed.

## Problem
Teams often need to distribute bounties, grants, and contributor rewards without exposing the full recipient relationship publicly.

A normal transfer UI can move funds, but it does not model the full reward lifecycle:
- private payout issuance
- recipient-side discovery and claim
- limited disclosure for verification
- one coherent activity narrative across the flow

## Solution
Umbra Bounty Vault turns that lifecycle into a demo-oriented user-facing application flow:
- teams create a structured private payout
- recipients discover a wallet-scoped claimable payout and complete a linked claim step through the app
- disclosure views provide bounded verification context for the same flow
- activity summarizes payout, claim, and disclosure as one product narrative

## Why Umbra
The core requirement is not just sending funds. It is making reward distribution private, claimable, and selectively revealable in a user-facing workflow.

Umbra is used here as the privacy-oriented foundation for:
- private payout creation semantics
- claim-oriented recipient flow
- privacy-first reward distribution framing
- controlled disclosure for verification contexts

## Key Features
- Create Payout flow for private reward issuance
- Claim Center flow for recipient discovery and linked claim states
- Disclosure / Verification view for controlled disclosure
- Activity narrative view for lifecycle closure
- real wallet adapter entry with wallet-scoped demo-session continuity

## Tech Stack
- Next.js App Router
- TypeScript
- React 19
- Tailwind CSS 4
- TanStack Query
- Zod
- Vitest
- Playwright
- pnpm

## Current Scope Note
This repository currently demonstrates the workflow through a linked demo session with a real wallet adapter entry.

The current implementation includes:
- a real wallet adapter entry with wallet-scoped demo-session continuity
- a typed demo Umbra service boundary
- a live devnet anchor in `Create Payout`
- linked disclosure and activity surfaces for lifecycle explanation
- browser-manual validation of the main demo path
- one focused Playwright golden-path spec for the linked demo path

Current implementation boundary:
- real devnet support is anchored in `Create Payout`
- the live devnet gateway currently supports `createPrivatePayout` only
- `Claim Center`, `Disclosure`, and `Activity` rely on wallet-scoped typed demo continuity or prepared states rather than a full live backend or indexer stack
- the current live path supports direct SOL transfer semantics with optional memo and `disclosureLevel: 'none'`

It should not be described as:
- a finished production treasury system
- a full live Umbra protocol integration
- a fully implemented end-to-end devnet claim/disclosure/activity flow
- protocol behavior proven beyond the current demo boundary
- exhaustive automated E2E coverage across failure paths or future workflow extensions

## Validation Evidence Note
Current evidence for the repository is strong enough to support a bounded demo submission, but it is not yet a full P7 audit artifact set.

Current evidence available in-repo:
- browser-manual validation of the main demo path
- one focused Playwright golden-path spec for the linked demo path
- typed service-boundary tests and feature-level Vitest coverage
- WSL validation notes captured in `docs/WSL_CLAUDE_CODE_VALIDATION.md`

Evidence still missing as committed artifacts:
- a dedicated responsive screenshot pack across target breakpoints (the checklist now lives in `docs/P7_RESPONSIVE_EVIDENCE_CHECKLIST.md`)
- a standalone accessibility report or issue ledger checked into the repo
- a committed Lighthouse or key-page performance report

Reviewer-safe framing:
- the project is submission-ready as a demo workflow with a minimal live devnet anchor
- the current validation evidence is targeted and honest, not exhaustive across every failure path or quality dimension

## Demo Flow
1. Landing
2. Create Payout
3. Claim Center
4. Disclosure / Verification
5. Activity

## Future Roadmap
- batch payout campaigns
- team-level payout policies
- richer disclosure templates
- stronger shared-context continuity across the workflow
- organization-facing treasury workflows
- a more complete recipient reward inbox

