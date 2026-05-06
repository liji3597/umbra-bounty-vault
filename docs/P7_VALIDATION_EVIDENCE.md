# P7 Validation Evidence

Date: 2026-05-05  
Environment: Native Windows session in `D:\Superteam\Umbra Side Track`

## Purpose

Record the current, repository-backed quality evidence for Phase P7 without overstating coverage.

This document is an evidence entry point, not a claim that all P7 work is complete.

## Scope of this record

This record captures:

- local command results that were run in this session
- which quality areas have direct in-repo evidence today
- which artifacts are still missing as committed evidence

It does not claim:

- exhaustive responsive validation across all target breakpoints
- a complete standalone accessibility report
- a committed Lighthouse or performance artifact pack
- exhaustive live-environment capture for create / scan / claim

## Command results

### `pnpm lint`

Status: **Passed with warnings**

Observed result:

- ESLint completed with `0 errors`
- `7 warnings` remain in test files
- all warnings are `react-hooks/exhaustive-deps` warnings in container test seeders that use `useLayoutEffect`

Files mentioned by the lint run:

- `src/features/activity/ActivityPageContainer.test.tsx`
- `src/features/claim/components/ClaimCenterPageContainer.test.tsx`
- `src/features/disclosure/DisclosurePageContainer.test.tsx`

Interpretation:

- lint is runnable and not blocked
- the repo is not lint-clean yet because of test-only warnings
- this should not be described as a fully warning-free quality pass

### `pnpm typecheck`

Status: **Passed**

Observed result:

- `tsc --noEmit` completed successfully

Interpretation:

- the current repository typechecks in the native Windows environment used for this record

### `pnpm test:run`

Status: **Passed**

Observed result:

- `33` test files passed
- `254` tests passed

Interpretation:

- the current unit / component / container / protocol coverage is runnable and green in this environment
- this run also caught and validated a test-environment regression fix in `src/providers/SolanaWalletBridgeProvider.tsx`

### `pnpm test:e2e`

Status: **Passed**

Observed result:

- Playwright executed `5` repository E2E specs in Chromium
- passing specs:
  - `e2e/p7-5-golden-path.spec.ts`
  - `e2e/p7-5-unavailable-states.spec.ts`
  - `e2e/p7-5-claim-unavailable.spec.ts`
  - `e2e/p7-5-claim-claim-unavailable.spec.ts`
  - `e2e/p7-5-create-registration-gate.spec.ts`

Interpretation:

- the linked demo-session golden path is covered by one passing Playwright spec
- the repo now also has explicit browser automation for the main bounded failure surfaces: disclosure unavailable, activity unavailable, scan unavailable, claim unavailable, and registration-required create gating
- this is still bounded automation, not exhaustive live devnet proof capture

## Phase 5 manual devnet smoke checklist

This checklist translates the Phase 5 closeout requirement into a reviewer-safe record using evidence that is already documented in the repository.

| Smoke step | Current evidence in repo | Current committed posture |
| --- | --- | --- |
| 1. wallet connect | `README.md`, `docs/DEMO_SCRIPT.md`, and `docs/PLATFORM_SUBMISSION.md` all describe a real wallet adapter entry and wallet-scoped session identity | Documented as covered in browser-manual demo flow |
| 2. recipient registered / resolvable | `docs/TASKS.md` records the SDK-backed recipient registration gate and review-state blocking behavior for unsupported / unresolved recipients; Playwright covers registration-required create gating | Documented as covered for the bounded SDK-backed create path |
| 3. create claimable payout | Current product docs describe SDK-backed `createPrivatePayout` within a devnet-first, single-asset scope | Documented as browser-manual main-path evidence, not as a committed transaction artifact |
| 4. recipient scan finds it | Current product docs and protocol/task notes describe SDK-backed `scanClaimablePayouts`; Playwright and Vitest evidence cover bounded scan behavior and infra-unavailable handling | Partially evidenced: behavior is documented and automated boundaries are covered, but no committed live scan artifact is attached here |
| 5. recipient claim succeeds | Current product docs and protocol/task notes describe SDK-backed `claimPrivatePayout`; Playwright and Vitest evidence cover claim capability truth and claim-unavailable handling | Partially evidenced: behavior is documented and automated boundaries are covered, but no committed live claim artifact is attached here |
| 6. activity updates coherently | `docs/TASKS.md` records wallet-scoped activity truth-consumption and claim-story consistency work; Playwright covers both the linked demo-session activity surface and explicit unavailable state | Documented as covered for the current bounded narrative surfaces |
| 7. disclosure page does not overclaim | `docs/TASKS.md`, `README.md`, and `docs/PLATFORM_SUBMISSION.md` all explicitly constrain disclosure to bounded wallet-scoped summaries and explicit unavailable states; Playwright covers the explicit unavailable state | Documented as covered |

Interpretation:

- the repository now has an explicit Phase 5 smoke checklist record rather than only scattered mentions across README, submission copy, and task notes
- this is still a documentation-backed closeout artifact, not a committed pack of live devnet transaction receipts, screenshots, or manual-run captures
- reviewers should read it as evidence that the manual demo path and automated truth-boundary checks are aligned, not as proof of exhaustive live-environment capture

## Evidence matrix by P7 area

| P7 area | Current evidence | Status |
| --- | --- | --- |
| P7-1 Responsive / visual regression | `docs/P7_RESPONSIVE_EVIDENCE_CHECKLIST.md` now defines the required surfaces, breakpoints, and acceptance checks, but no committed screenshot pack was found in this review | Checklist available; screenshot artifacts missing |
| P7-2 Accessibility | `docs/TASKS.md` records one round of fixes/revalidation; UI tests and semantic queries exist, but no standalone committed a11y report is present | Partial |
| P7-3 Security / boundary checks | Current repo state shows typed boundaries, schema-driven feature structure, and no new over-claiming in judge-facing materials; no separate committed security report was added in this slice | Partial |
| P7-4 Performance / loading | No committed Lighthouse or key-page performance report found in the repository during this review | Missing committed artifact |
| P7-5 Golden path validation | Browser-manual validation is documented in existing project materials; `pnpm test:e2e` passed for one golden-path spec plus four bounded failure-path specs in this session | Available but still bounded |

## Related in-repo evidence

- `README.md` — current validation evidence summary and scope caveats
- `docs/TASKS.md` — P7 task definitions and current closeout notes
- `docs/PLATFORM_SUBMISSION.md` — judge-facing validation framing
- `docs/WSL_CLAUDE_CODE_VALIDATION.md` — separate WSL validation record with current blocker state
- `playwright.config.ts` — confirms the Playwright suite currently runs Chromium against `pnpm dev`

## Known gaps after this record

The following artifacts are still worth adding if Phase P7 needs stronger auditability:

1. responsive screenshot pack for:
   - 320
   - 375
   - 768
   - 1024
   - 1440
   - 1920
2. standalone accessibility issue ledger or report
3. committed Lighthouse / key-page performance report
4. committed live devnet transaction receipts or screenshot pack for create / scan / claim, if stronger proof is required

## Safe wording for reviewers

Reviewer-safe summary:

> The repository currently has passing typecheck, passing Vitest coverage, and five passing Playwright specs in the native Windows environment used for this record: one golden path plus four bounded failure-path checks. It also has documented browser-manual validation for the linked demo workflow. Responsive, accessibility, performance, and live devnet artifact evidence are only partially committed today, so P7 should still be described as partially complete rather than fully closed.
