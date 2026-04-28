# WSL Claude Code Validation Record

Date: 2026-04-25  
Environment: WSL2 on Linux, repository located at `/mnt/d/Superteam/Umbra Side Track`

## Validation scope

Validate the README support matrix in a WSL session by running:

- `pnpm dev`
- `pnpm test:run`
- `pnpm test:e2e`

## Environment snapshot

- Node.js: `v24.15.0`
- pnpm: `10.30.1`
- `node_modules`: present before validation

## Results summary

| Check | Result | Status |
| --- | --- | --- |
| `pnpm dev` | Dev server started and reported `http://localhost:3000`, but the first CSS compile failed on a missing Linux native module | Partial |
| `pnpm test:run` | Vitest failed at startup before running tests | Failed |
| `pnpm test:e2e` | Playwright started, but its web server failed on the same missing Linux native module | Failed |

## Command details

### 1. `pnpm dev`

Observed behavior:

- Next.js started successfully
- Reported `Local: http://localhost:3000`
- Became ready in about `11.6s`
- Failed on first compile of `src/app/globals.css`

Error excerpt:

```text
Error: Cannot find module '../lightningcss.linux-x64-gnu.node'
Require stack:
- .../node_modules/.pnpm/lightningcss@1.32.0/node_modules/lightningcss/node/index.js
- .../@tailwindcss/node/dist/index.js
- .../@tailwindcss/postcss/dist/index.js
```

Assessment:

- WSL can launch the dev process and bind localhost
- The app cannot compile successfully in the current dependency state

### 2. `pnpm test:run`

Observed behavior:

- Vitest failed during startup
- No tests were executed

Error excerpt:

```text
Error: Cannot find native binding
[cause]: Error: Cannot find module '@rolldown/binding-linux-x64-gnu'
```

Assessment:

- Unit/integration test execution is currently blocked in WSL
- The failure happens before the test suite itself can validate application behavior

### 3. `pnpm test:e2e`

Observed behavior:

- Playwright launched
- Its managed web server failed while compiling the app
- Failure matches the `pnpm dev` native module problem

Error excerpt:

```text
[WebServer] Error: Cannot find module '../lightningcss.linux-x64-gnu.node'
```

Assessment:

- E2E validation is blocked by the dev server dependency issue
- This is not an application-flow assertion failure; it is an environment/runtime failure

## Dependency inspection

The current `node_modules/.pnpm` state contains Windows-native packages, including:

- `@rolldown+binding-win32-x64-msvc@1.0.0-rc.15`
- `lightningcss-win32-x64-msvc@1.32.0`

The Linux-native packages required by the WSL runtime were not present in the inspected output.

## Conclusion

Current WSL validation result: **not yet passing**.

The README matrix is directionally correct about keeping Node.js, pnpm, dependencies, and execution on the same side, and this validation produced a concrete example of why that rule matters.

The immediate blocker is a cross-side dependency state:

- the WSL runtime expects Linux native bindings
- the installed dependency tree currently includes Windows-native optional packages
- WSL execution therefore fails for both build-time CSS processing and Vitest startup

## Recommended remediation

1. Reinstall dependencies from WSL using the Linux toolchain on the same side that will run Node.js and pnpm
2. Avoid reusing a dependency tree installed from native Windows when validating inside WSL
3. After reinstall, rerun:
   - `pnpm dev`
   - `pnpm test:run`
   - `pnpm test:e2e`
4. If the repo remains on `/mnt/d/...`, keep documenting it as supported but slower, and treat `/home/...` as the preferred WSL path

## Acceptance decision

- CLI startup in WSL: **Partially verified**
- Localhost binding in WSL: **Verified**
- App compile in WSL: **Blocked**
- Vitest in WSL: **Blocked**
- Playwright E2E in WSL: **Blocked**

The WSL support slice should be considered **documented but not fully validated** until dependencies are reinstalled in WSL and the test commands pass.
