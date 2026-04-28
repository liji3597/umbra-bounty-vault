# SPEC.md

## 1. Product Summary

**Umbra Bounty Vault** is a privacy-first payout workflow for bounties, grants, and contributor rewards.

It is not a generic private transfer app and not a protocol-only demo. The product is designed as a user-facing dApp that turns Umbra’s privacy primitives into a complete reward lifecycle:

- private payout creation
- recipient discovery and claim
- controlled disclosure when verification is needed
- activity visibility across the lifecycle

---

## 2. Product Positioning

### 2.1 Core Positioning
Umbra Bounty Vault is a **privacy-preserving reward distribution product** for:
- hackathon bounty payouts
- contributor rewards
- ecosystem grants
- selective verification use cases

### 2.2 What It Is Not
This project should **not** be positioned as:
- a generic privacy wallet
- a mixer-like UX shell
- a protocol debugger UI
- a full treasury management suite
- a complete enterprise audit platform

### 2.3 Sponsor Fit
The project exists to demonstrate how Umbra can power a real user workflow, not just a hidden transfer primitive. The strongest sponsor-fit angle is:

> Umbra as infrastructure for private reward distribution.

---

## 3. Problem Statement

Most contributor reward and bounty flows are fully public by default. That creates unwanted visibility around:
- who got rewarded
- when they were rewarded
- how much they were rewarded
- how often a team funds the same recipient

In many real settings, teams want:
- a usable reward issuance flow
- recipient-side claimability
- privacy around recipient relationships and payout patterns
- limited verification capability without turning everything public

---

## 4. Solution Statement

Umbra Bounty Vault provides a privacy-first workflow where a sender can issue a private reward, the recipient can discover and claim it, and the application can later present a controlled disclosure view when verification is needed.

This turns Umbra’s underlying privacy capabilities into a productized reward workflow.

---

## 5. Target Users

### 5.1 Primary Users
- small crypto teams distributing contributor rewards
- bounty managers issuing task-based payouts
- ecosystems experimenting with privacy-first grants
- builders who want recipient privacy without losing usability

### 5.2 Secondary Users
- reviewers or stakeholders who need limited payout verification
- demo judges evaluating sponsor-track fit

---

## 6. Core User Scenarios

### Scenario A — Private Contributor Reward
A team wants to reward a contributor without exposing the reward relationship publicly.

### Scenario B — Private Bounty Settlement
A bounty manager wants to issue a payout for completed work while keeping the reward flow private.

### Scenario C — Controlled Verification
A team needs to show a limited verification view for a reward without turning the entire payout graph into a public ledger narrative.

---

## 7. Product Principles

1. **Workflow over primitive**  
   The app must feel like a reward product, not a protocol wrapper.

2. **Privacy with usability**  
   Privacy should not remove clarity around what the user can do next.

3. **Claim-centric recipient flow**  
   The recipient experience is based on discovery and claim, not just visible receipt.

4. **Controlled disclosure, not full audit tooling**  
   Verification should be possible in bounded ways without turning the app into an enterprise audit suite.

5. **Demo-ready narrative**  
   Every major screen should contribute to the hackathon story: payout -> claim -> disclosure -> lifecycle.

---

## 8. Phase 1 Scope Lock

### 8.1 Scope Direction
Phase 1 follows an **A2-leaning** direction: make the claim-oriented payout narrative work as a convincing product experience first, while deferring a fully live claim mechanism to a later phase.

### 8.2 Scope Boundaries
Phase 1 is intentionally constrained to:
- **devnet-first execution**
- **single-asset scope**
- **smallest end-to-end claim narrative**
- **wallet-scoped continuity across create -> claim -> disclosure -> activity**

### 8.3 Deferred Work
Phase 1 should explicitly defer:
- heavy backend / indexer infrastructure as a hard prerequisite
- a fully live claim discovery mechanism
- a fully live claim settlement mechanism
- fully real disclosure and activity data assembly

### 8.4 Honest Capability Standard
Disclosure and Activity should remain **live-aware**, not fully real, while staying coherent with the same wallet-scoped payout session and avoiding overstatement.

---

## 9. In Scope

### 9.1 Product Scope
- landing page with clear value proposition
- wallet-connected app shell
- create payout flow
- claim center flow
- disclosure / verification flow
- activity timeline / lifecycle view

### 9.2 Technical Scope
- Next.js App Router frontend
- wallet-based integration flow
- Umbra SDK wrapper layer
- devnet-first demo path
- typed wallet-scoped demo session continuity across create -> claim -> disclosure -> activity
- form validation and typed UI state

---

## 10. Out of Scope

- multi-team admin console
- payroll system features
- DAO governance workflow
- notification systems
- analytics suite
- enterprise-grade audit dashboard
- multi-chain support
- fully generalized treasury operations
- mandatory backend/indexer rollout in Phase 1

---

## 11. Page Map

### 11.1 Marketing Surface
- `Landing`

### 11.2 App Surfaces
- `Dashboard`
- `Create Payout`
- `Claim Center`
- `Disclosure / Verification`
- `Activity`

---

## 12. Core User Flows

### 12.1 Create Payout Flow
1. User connects wallet
2. User enters payout details
3. User reviews privacy-aware reward setup
4. User submits private payout
5. User sees success state and next actions

### 12.2 Claim Flow
1. Recipient opens claim center
2. App checks wallet / network / eligibility state
3. App scans for claimable payout(s)
4. Recipient sees found / none / pending states
5. Recipient executes claim
6. Claim result updates activity and disclosure views for the same wallet-scoped session

### 12.3 Disclosure Flow
1. User enters disclosure / verification view
2. App shows whether disclosure is unavailable / partial / ready
3. User can inspect a bounded verification presentation
4. User may share or review the disclosure artifact depending on final implementation scope

### 12.4 Lifecycle Flow
1. Payout created
2. Claimable state detected
3. Claim recorded in the wallet-scoped session
4. Disclosure state becomes available where applicable
5. Activity view reflects the lifecycle

---

## 13. State Matrix

### 13.1 Global States
- wallet disconnected
- wallet connected
- unsupported network
- initialization loading
- initialization error

### 13.2 Dashboard States
- loading
- empty
- populated
- error

### 13.3 Create Payout States
- pristine
- invalid
- review
- submitting
- success
- failure

### 13.4 Claim Center States
- disconnected
- setup needed
- scanning
- claimable payouts found
- none found
- claim pending
- claim success
- claim failure

### 13.5 Disclosure States
- unavailable
- no disclosure
- partial disclosure
- verification-ready
- share success
- access limited

### 13.6 Activity States
- empty
- timeline available
- partial data
- refresh / sync pending

---

## 14. Functional Requirements

### FR-1 Wallet and Environment
- The app must support wallet connection before protected app actions.
- The app must clearly communicate unsupported or mismatched network states.

### FR-2 Create Payout
- The app must provide a structured payout form.
- The form must support validation before submission.
- The form must provide a review step before final action.
- The app must show clear success and failure outcomes.

### FR-3 Claim Center
- The app must support discovery of claimable payouts.
- The app must clearly distinguish scanning, no-result, and found-result states.
- The app must provide a recipient claim action when eligible.
- Phase 1 may satisfy this through wallet-scoped demo continuity rather than a fully live claim backend.

### FR-4 Disclosure / Verification
- The app must provide a bounded disclosure experience.
- The app must support different disclosure readiness states.
- The app must avoid presenting disclosure as full public audit tooling.
- Phase 1 disclosure may be live-aware without claiming full live disclosure assembly.

### FR-5 Activity View
- The app must present the lifecycle of payout, claim, and disclosure events in a coherent sequence.
- The app must preserve enough active wallet-session context for Activity and Disclosure to narrate the same payout after create and claim actions.
- Phase 1 activity may be live-aware without claiming fully real end-to-end protocol state.

### FR-6 Typed Interaction Boundaries
- UI state must be separated from protocol/service logic.
- Form validation and data access must use explicit schemas or typed boundaries.

---

## 15. Disclosure Information Model

The disclosure model should be framed as **controlled visibility**, not total transparency.

### 15.1 Disclosure Levels
- `No disclosure` — nothing intentionally revealed beyond the base product state
- `Partial disclosure` — limited contextual information for bounded verification
- `Verification-ready disclosure` — the most complete presentation allowed in the demo scope

### 15.2 Design Constraint
The disclosure surface should communicate:
- what can be shown
- what remains private
- why this limited view exists

It should not imply that the product is a complete audit suite.

---

## 16. Infrastructure Planning Requirements

Before implementation, the project must explicitly define app-layer boundaries for:
- Umbra client creation
- wallet signer requirements
- registration assumptions
- indexer dependency points
- relayer dependency points
- prover / MPC dependency points where relevant
- network handling for devnet / mainnet / localnet

### 16.1 Wrapper Boundary Requirement
The frontend should not scatter raw low-level SDK calls across pages. The app should prefer wrapper boundaries similar to:
- `createPrivatePayout(...)`
- `getPayoutStatus(...)`
- `scanClaimablePayouts(...)`
- `claimPrivatePayout(...)`
- `buildDisclosureView(...)`

### 16.2 Phase 1 Planning Constraint
Indexers, scanners, and other backend-like support layers may be designed as later enhancements, but they should not become mandatory infrastructure that blocks the smallest Phase 1 product-valid claim flow.

---

## 17. Acceptance Criteria

The product will be considered spec-complete when:
- a clear landing page communicates the product category and Umbra value
- the app supports a coherent create payout flow
- the app supports a coherent claim center flow
- the app supports a bounded disclosure / verification view
- the app supports an activity / lifecycle view
- all four core surfaces contribute to one demo story
- the project is clearly recognizable as an Umbra-powered reward workflow, not a generic wallet
- the Phase 1 narrative remains honest about real-vs-demo boundaries

---

## 18. Demo Narrative Requirements

The demo must clearly show:
1. why private reward distribution matters
2. how a private payout is created
3. how a recipient discovers and claims it
4. how disclosure can remain controlled rather than fully public
5. how the overall lifecycle forms a usable product flow

The demo must not depend on protocol-heavy jargon to explain value.

---

## 19. Success Criteria

### Product Success
- judges can understand the use case quickly
- the project feels productized, not exploratory
- the reward lifecycle is coherent end-to-end

### Sponsor Success
- Umbra is visibly central to the product’s value
- privacy is expressed through workflow, not just through terminology
- the project demonstrates meaningful sponsor-track fit
