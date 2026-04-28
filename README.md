# Umbra Bounty Vault

> **Private rewards, claimable payouts, controlled disclosure.**

**Umbra Bounty Vault** is a privacy-first reward workflow for bounties, grants, and contributor rewards. It positions Umbra as product infrastructure for private payout creation, recipient claim, and controlled disclosure rather than as a generic hidden-transfer demo.

---

## At a Glance

| Topic | Summary |
| --- | --- |
| What this is | A user-facing reward distribution workflow: create payout -> claim -> disclosure -> activity |
| Why Umbra | The core requirement is not just sending funds, but making reward distribution private, claimable, and selectively revealable |
| What works today | Real wallet adapter entry, typed demo service boundary, and a live devnet anchor in `Create Payout` |
| Current boundary | `Claim Center`, `Disclosure`, and `Activity` remain demo-backed even when the wallet session is real |
| Validation status | Typecheck, Vitest, and one Playwright golden-path spec are committed evidence; responsive/a11y/perf artifacts are still partial |

## Why This Project Exists

Contributor rewards are often distributed through fully visible transfer flows. That makes payout timing, recipient relationships, and reward patterns easy to trace even when teams want discretion.

A normal transfer interface can move funds, but it does not model the full reward lifecycle:

- private payout issuance
- recipient-side discovery and claim
- limited disclosure when verification is needed
- one coherent activity narrative across the flow

## What the Product Demonstrates

Umbra Bounty Vault turns that lifecycle into a demo-oriented application flow:

- teams create a structured private payout
- recipients discover a wallet-scoped claimable payout and complete a linked claim step
- disclosure views present bounded verification context for the linked payout flow
- activity summarizes payout, claim, and disclosure as one product narrative

The current repository focuses on a product-grade demo flow rather than a production treasury backend.

## Quick Start

### Requirements

- Node.js
- pnpm

### Install

```bash
pnpm install
```

### Run locally

```bash
pnpm dev
```

### Build

```bash
pnpm build
pnpm start
```

### Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test:run
pnpm test:e2e
```

Note: `pnpm test:e2e` currently covers the repository's single Playwright golden-path spec for the linked demo session. Treat that as focused golden-path coverage, not as exhaustive end-to-end validation of every failure path or future workflow extension.

## Demo Flow

Current page contract:

- `Landing` — `/`
- `Dashboard` — `/app/dashboard`
- `Create Payout` — `/app/payouts/new`
- `Claim Center` — `/app/claim`
- `Disclosure / Verification` — `/app/disclosure`
- `Activity` — `/app/activity`

Current demo narrative centers on this linked wallet-scoped path:

1. enter landing
2. connect the wallet demo session
3. create a private payout
4. discover and claim the same payout in claim center
5. review the matching disclosure context
6. review lifecycle closure in activity

This should be described as demo-session continuity built on a typed service boundary, not as a production-complete live treasury workflow.

## Current Scope

This repository currently demonstrates the workflow through a real wallet adapter entry plus a typed demo Umbra service boundary.

What is implemented today:

- a real wallet adapter entry with wallet-scoped demo-session continuity
- a typed demo Umbra service boundary
- a live devnet anchor in `Create Payout`
- linked disclosure and activity surfaces for lifecycle explanation
- focused automated coverage for the current golden path

Current implementation boundary:

- real devnet support is anchored in `Create Payout`
- the live devnet gateway currently supports `createPrivatePayout` only
- `Claim Center`, `Disclosure`, and `Activity` remain demo-backed, even when the wallet session is real
- the current live path supports direct SOL transfer semantics with optional memo and `disclosureLevel: 'none'`

It should not be described as:

- a finished production treasury system
- a full live Umbra protocol integration
- a compliance or audit platform
- protocol behavior proven beyond the current demo boundary

## Validation Evidence

The current repository has evidence for the demo workflow boundary, but it does **not** yet have a complete P7 closeout package.

| Area | Current evidence | Status |
| --- | --- | --- |
| Lint / type safety / focused unit tests | `pnpm lint`, `pnpm typecheck`, `pnpm test:run` are the primary local verification commands | Available |
| Playwright golden path | `pnpm test:e2e` covers the repository's single linked-demo-session golden-path spec | Available but narrow |
| Browser manual validation | Main demo path is documented in project materials as manually validated for create -> claim -> disclosure -> activity continuity | Documented |
| Responsive evidence | `docs/P7_RESPONSIVE_EVIDENCE_CHECKLIST.md` defines the required surfaces, breakpoints, and acceptance checks, but a committed screenshot pack is not yet present in the repository | Checklist available; screenshot artifacts missing |
| Accessibility evidence | `docs/TASKS.md` records one round of fixes/revalidation, but no standalone committed a11y report is currently present | Partial |
| Performance evidence | `docs/TASKS.md` expects key-page performance records, but no committed Lighthouse/perf artifact is currently present | Missing as committed artifact |
| WSL validation | `docs/WSL_CLAUDE_CODE_VALIDATION.md` records a concrete environment check and current blocker state | Available with blockers |
| Native Windows validation snapshot | `docs/P7_VALIDATION_EVIDENCE.md` records current lint/typecheck/Vitest/Playwright results from a native Windows session | Available |

Interpretation:

- treat the current repository as **viable for a bounded demo submission**
- do **not** describe it as having a complete responsive / a11y / Lighthouse evidence pack checked into the repo
- do **not** describe the automated test coverage as exhaustive across failure paths or future workflow extensions

## Project Structure

The repository is organized around product surfaces and typed feature boundaries.

- `src/app/` contains route entry points
- `src/features/payout/` contains payout flow UI and schema
- `src/features/claim/` contains claim discovery and claim flow
- `src/features/disclosure/` contains disclosure / verification views
- `src/features/activity/` contains lifecycle narrative assembly
- `src/features/protocol/` contains the typed Umbra-facing service boundary
- `src/components/` contains shared layout and UI primitives
- `src/lib/routes.ts` defines the stable page contract

## Repository Docs

- `docs/SPEC.md` — scope and product/technical specification
- `docs/DESIGN.md` — design direction and UX framing
- `docs/TASKS.md` — implementation and closeout task ledger
- `docs/SUBMISSION.md` — sponsor-fit and submission narrative
- `docs/PLATFORM_SUBMISSION.md` — concise judge-facing submission copy
- `docs/DEMO_SCRIPT.md` — presenter-ready demo script
- `docs/P7_VALIDATION_EVIDENCE.md` — current native Windows validation snapshot
- `docs/P7_RESPONSIVE_EVIDENCE_CHECKLIST.md` — responsive evidence checklist and capture targets
- `docs/WSL_CLAUDE_CODE_VALIDATION.md` — WSL validation notes and blockers

## Future Work

Natural next extensions include:

- team-level payout policies
- batch payout campaigns
- richer disclosure templates
- stronger shared-context continuity across the full flow
- organization-facing treasury workflows
- a more complete recipient reward inbox
