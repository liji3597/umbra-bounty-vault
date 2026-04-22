# Umbra Bounty Vault

**Private rewards, claimable payouts, controlled disclosure.**

Umbra Bounty Vault is a privacy-first reward distribution workflow for bounties, grants, and contributor rewards. It frames Umbra as product infrastructure for payout creation, recipient claim, and controlled disclosure instead of as a generic private transfer demo.

## Problem

Contributor rewards are often distributed through fully visible transfer flows. That makes payout timing, recipient relationships, and reward patterns easy to trace even when teams want discretion.

A normal transfer interface can move funds, but it does not model the full reward lifecycle:

- private payout issuance
- recipient-side discovery and claim
- limited disclosure when verification is needed
- one coherent activity narrative across the flow

## Solution

Umbra Bounty Vault turns that lifecycle into a user-facing application flow:

- teams create a structured private payout
- recipients discover a wallet-scoped claimable payout and complete a linked claim step
- disclosure views present controlled verification context for the same demo session
- activity summarizes payout, claim, and disclosure as one product narrative

The current repository focuses on a product-grade demo flow rather than a production treasury backend.

## Why Umbra

This project is built around a simple idea: privacy should apply to reward distribution, not only to hidden transfers.

The current repository models an Umbra-oriented workflow through a typed demo service boundary with:

- private payout creation semantics
- claim-oriented recipient flow
- privacy-first reward distribution framing
- controlled disclosure for verification contexts
- wallet-scoped demo session continuity across create -> claim -> disclosure -> activity

The goal is to show how Umbra primitives can be shaped into an application experience for bounties, grants, and contributor rewards, while the current codebase stays explicit about its demo and implementation scope.

## Core Flows

Current page contract:

- `Landing` — `/`
- `Dashboard` — `/app/dashboard`
- `Create Payout` — `/app/payouts/new`
- `Claim Center` — `/app/claim`
- `Disclosure / Verification` — `/app/disclosure`
- `Activity` — `/app/activity`

Current demo narrative centers on this linked wallet-scoped demo path:

1. enter landing
2. connect the wallet demo session
3. create a private payout
4. discover and claim the same payout in claim center
5. review the matching disclosure context
6. review lifecycle closure in activity

This is a browser-verified demo sequence across aligned product surfaces. It should be described as demo-session continuity built on a typed service boundary, not as a production-complete live treasury workflow.

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

## Local Development

### Requirements

- Node.js
- pnpm

### Install

```bash
pnpm install
```

### Start the app

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

Note: `pnpm test:e2e` is currently present but the Playwright golden-path assertions still need refresh for current UI copy. The latest closeout relies on browser manual validation for the linked demo session, plus typecheck and targeted test coverage.

Available scripts from `package.json`:

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`
- `pnpm lint:fix`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:run`
- `pnpm test:e2e`
- `pnpm test:e2e:headed`

## Demo Flow

For a short demo, use this order:

1. Landing
2. Create Payout
3. Claim Center
4. Disclosure / Verification
5. Activity

The strongest product story is:

- a team creates a private reward flow
- the recipient discovers and claims the linked payout in the same demo session
- the app shows controlled disclosure rather than full public exposure
- the lifecycle is reviewed in Activity as a product narrative

## Architecture

The repository is organized around product surfaces and typed feature boundaries.

- `src/app/` contains route entry points
- `src/features/payout/` contains payout flow UI and schema
- `src/features/claim/` contains claim discovery and claim flow
- `src/features/disclosure/` contains disclosure / verification views
- `src/features/activity/` contains lifecycle narrative assembly
- `src/features/protocol/` contains the typed Umbra-facing service boundary
- `src/components/` contains shared layout and UI primitives
- `src/lib/routes.ts` defines the stable page contract

## Status / Current Scope

This repository currently demonstrates a typed demo flow for the main lifecycle. The implementation uses a demo Umbra service boundary for payout, claim, disclosure, and activity composition, plus a local wallet demo session that preserves the active payout context across the core flow.

That means the current app should be understood as:

- a product prototype with executable demo flows
- a demo-friendly integration boundary around Umbra-oriented actions
- a submission-ready sequence for create -> claim -> disclosure -> activity
- a wallet-scoped session narrative that has been manually validated in the browser

It should not be described as:

- a finished production treasury system
- a full live Umbra protocol integration
- a compliance or audit platform
- protocol behavior proven beyond the current demo boundary

## Future Work

Natural next extensions include:

- team-level payout policies
- batch payout campaigns
- richer disclosure templates
- stronger shared-context continuity across the full flow
- organization-facing treasury workflows
- a more complete recipient reward inbox

## Repository Notes

Planning and submission context live in:

- `docs/SPEC.md`
- `docs/DESIGN.md`
- `docs/TASKS.md`
- `docs/SUBMISSION.md`
