# ARCHITECTURE_DIAGRAM.md

## Goal

Provide a submission-friendly architecture diagram source for `Umbra Bounty Vault` that stays aligned with the current repository scope.

This diagram is intentionally scoped to the current implementation:

- product-grade preview flow
- real wallet adapter entry with demo-session continuity
- typed demo Umbra service boundary
- prepared disclosure and activity narrative surfaces

It should not be read as a claim of full live Umbra protocol integration or one shared live on-chain payout context across every page.

---

## Diagram (Mermaid)

```mermaid
flowchart TD
    A[Landing / Marketing\nPrivacy-first reward workflow framing] --> B[App Shell\nDashboard + route contract]

    B --> C[Create Payout\nStructured preview payout flow]
    C --> D[Typed Umbra Service Boundary\npayout / claim / disclosure contracts]

    B --> E[Claim Center\nPreview discovery + prepared claim state]
    E --> D

    B --> F[Disclosure / Verification\nBounded disclosure preview]
    F --> D

    B --> G[Activity\nPrepared lifecycle narrative]
    G --> D

    H[Wallet Provider\nReal wallet adapter + network state] --> B
    H -.demo session context.-> C
    H -.demo session context.-> E

    D --> I[Demo Umbra Gateway Layer\nPreview-oriented integration]

    J[Zod Schemas + Typed Models\nvalidated workflow inputs and outputs] --> D
    K[Query Provider + Local UI State\nfoundation in place for workflow state] --> B
```

---

## Reading Guide

Use this reading order when presenting the diagram:

1. `Landing` frames the problem as privacy-first reward distribution.
2. `App Shell` holds the route contract across dashboard and app surfaces.
3. `Create Payout`, `Claim Center`, `Disclosure`, and `Activity` express the main product lifecycle.
4. `Wallet Provider` supplies the real wallet adapter entry, network state, and demo-session continuity where the current flow uses it.
5. `Typed Umbra Service Boundary` keeps payout, claim, and disclosure semantics behind app-layer contracts.
6. `Demo Umbra Gateway Layer` represents the current preview/demo integration boundary.

---

## Presenter Notes

### What to emphasize

- this is a workflow diagram, not a low-level protocol topology
- Umbra is presented as product infrastructure for reward distribution
- the strongest narrative is create -> claim -> disclosure -> activity
- typed boundaries and preview states are deliberate, not accidental

### What to avoid

Avoid saying:

- this is the final production architecture
- this is a full live Umbra integration map
- every page is driven by one shared live payout context
- the disclosure layer is a complete audit or compliance system

### Honest scope note

If asked about implementation scope, say:

- the current repository demonstrates a preview-oriented workflow architecture
- the wallet layer starts from a real wallet adapter path, while demo continuity and prepared states explain the broader lifecycle
- the service boundary is typed and demo-friendly so the product lifecycle can be shown clearly
- disclosure and activity remain bounded preview surfaces in the current implementation
