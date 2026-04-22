# PLATFORM_SUBMISSION.md

## Title
Umbra Bounty Vault

## Tagline
**Private rewards, claimable payouts, controlled disclosure.**

## One-line Description
Umbra Bounty Vault is a privacy-first reward workflow for bounties, grants, and contributor rewards.

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
- local wallet demo session with typed demo service boundary

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
This repository currently demonstrates the workflow through a linked demo session rather than a production deployment.

The current implementation includes:
- a local wallet demo session
- a typed demo Umbra service boundary
- linked disclosure and activity surfaces for lifecycle explanation
- browser-manual validation of the main demo path

It should not be described as:
- a finished production treasury system
- a full live Umbra protocol integration
- protocol behavior proven beyond the current demo boundary
- automated E2E already fully green

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
