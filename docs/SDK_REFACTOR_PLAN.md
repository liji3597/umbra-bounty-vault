# SDK 重构修复计划

## 目标

把当前项目从“以 `SystemProgram.transfer` 伪装成 Umbra live path”的状态，重构为“以官方 Umbra SDK 为中心的协议层实现”，并在此基础上恢复一个诚实、可演示、可提交的最小 live workflow。

本计划只定义实施路线，不写实现代码。

---

## 1. 当前问题归纳

### 1.1 当前实现的核心偏差

当前仓库的主要问题不是 UI，也不是提交文案，而是协议层中心不正确：

- `src/features/protocol/solanaPayoutProgram.ts` 当前 live 路径本质是 `SystemProgram.transfer` + optional memo
- `src/features/protocol/devnetUmbraService.ts` 只对 `createPrivatePayout` 提供 live path
- `Claim Center`、`Disclosure`、`Activity` 仍直接或间接依赖 `demoUmbraService`
- `demoFlowSession` 目前既承担 UI continuity，又在事实上承担协议真相缓存

结果是：

- 文档虽然相对诚实，但代码里的“Umbra”并不等于官方 Umbra SDK 集成
- sponsor fit 主要靠 narrative，而不是靠协议级证据
- 后续继续叠功能会把错误中心越做越深

---

### 1.2 官方 SDK 约束结论

基于已核验的官方资料，当前应以 **官方 Solana Umbra SDK** 为准，而不是旧的 EVM `umbra-protocol` 心智模型。

已确认的方向：

- 官方存在 Solana 向 Umbra SDK
- 更可信的 live 路线是：
  - recipient registration
  - receiver-claimable UTXO creation
  - claimable UTXO scanning
  - claim
- claim path 依赖的能力明显高于当前仓库：
  - registration
  - index/scanner 语义
  - prover / Merkle proof
  - relayer（推荐）
- confidential-only transfer 资料存在，但不适合作为当前 Phase 1 的核心押注

因此，后续重构目标不是“把当前 transfer 包一层 Umbra 名字”，而是：

> 用官方 SDK 支撑最小可信 claim-oriented live flow。

---

## 2. 总体决策

## 2.1 重构策略

采用 **混合分阶段迁移**，不做 big-bang 全量重写。

核心原则：

1. 先 reset
2. 先纠正协议层 truth model
3. 保留现有 app-facing service API 形状
4. 把 live path 中心迁到官方 SDK
5. disclosure / activity 暂时允许 live-aware / demo-backed，但必须显式降级

---

## 2.2 为什么不一次性全改

因为完整 Umbra live flow 的技术面超出当前仓库：

- registration 状态管理
- claimable UTXO 创建
- index-backed scan
- claim prover / relayer
- live claim 失败处理
- disclosure 与 activity 的真实协议映射

对 solo hackathon 项目，更现实的做法是：

- 先把协议层中心改对
- 再做最小可信 live slice
- 最后再补叙事页和提交文案

---

## 3. 设计原则

### 3.1 保留什么

以下结构可以保留：

- `src/features/protocol/umbraService.types.ts`
- `src/features/protocol/umbraService.ts`
- `src/features/protocol/schema.ts` 的 zod 输入输出验证模式
- 现有页面级产品结构与路由结构

保留的原因：

- 当前 app 已围绕 `createPrivatePayout / scanClaimablePayouts / claimPrivatePayout / buildDisclosureView` 组织
- 这些动作层命名本身是合理的
- 真正需要替换的是这些动作背后的协议语义，不是整个前端产品壳

---

### 3.2 必须改变什么

以下必须改：

- `devnetUmbraService` 的真实职责
- `solanaPayoutProgram.ts` 在主路径中的地位
- 页面各自挑 provider 的模式
- `demoFlowSession` 被当成协议真相的事实角色
- README / submission 对 live path 的表达依据

---

### 3.3 新的 truth model

后续协议层应明确区分三类 provider：

- `demo`
- `legacy-transfer`
- `umbra-sdk`

并且所有页面都通过一个统一 resolver 获取当前 provider，而不是自己决定。

同时，每个 provider 应显式暴露 capability，而不是让页面靠猜：

- `canCreatePrivatePayout`
- `canScanClaimablePayouts`
- `canClaimPrivatePayout`
- `canBuildLiveDisclosure`

---

## 4. 分阶段实施计划

---

## Phase 0 — Reset 后先纠正协议层中心

### 目标

让仓库先从“伪 Umbra 主路径”状态中脱离出来，为后续 SDK 重构铺路。

### 要做的事

1. 把 `solanaPayoutProgram.ts` 从 Umbra live path 语义中剥离
   - 改名为 `legacy` / `fallback` / `sandbox` 语义
   - 或从主 provider 选择中完全拿掉

2. 停止页面直连不同 provider
   - `Create Payout` 不再手动拼 live service
   - `Claim / Disclosure / Activity` 不再直接 import `demoUmbraService`

3. 引入统一 provider resolver
   - 所有页面从同一个入口取 service

4. 引入 capability 模型
   - 让 UI 明确知道当前 provider 支持哪些 live 能力

5. `demoFlowSession` 降级为 UI continuity state
   - 不再承担协议真相职责

### 验证点

- repo 不再把 `SystemProgram.transfer` 视为 Umbra 主 live path
- 所有页面统一通过 resolver 获取 provider
- UI 至少能区分：`demo / legacy / sdk-live / unavailable`

---

## Phase 1 — 把官方 SDK 放到协议层中心

### 目标

让“官方 SDK provider”成为协议层的正确中心，即使此时功能还未全部 live。

### 要做的事

1. 引入官方 SDK 依赖
   - `@umbra-privacy/sdk`
   - 如 quickstart 所需，再补 prover / relayer 相关依赖

2. 新建 SDK adapter 层
   建议新增：
   - `umbraSdkClient.ts`
   - `umbraSdkProvider.ts`
   - `umbraProviderResolver.ts`
   - `umbraCapabilities.ts`

3. 保留现有 app-facing API 形状
   - `createPrivatePayout`
   - `scanClaimablePayouts`
   - `claimPrivatePayout`
   - `buildDisclosureView`

4. 重新定义这些方法背后的协议语义
   - create → official SDK claimable payout creation
   - scan → official SDK scanner
   - claim → official SDK claimer
   - disclosure → 先做 app-level live-aware summary

5. 将 `solanaPayoutProgram.ts` 从 Umbra branded live path 中退出

### 验证点

- 协议层出现真实 SDK provider
- `umbraService.ts` 仍为 app-facing facade
- `solanaPayoutProgram.ts` 不再是 Umbra live 核心实现
- typecheck 与 adapter 级单测通过

---

## Phase 2 — 做最小可信 live Umbra flow

### 目标

构建一个真正能支撑 sponsor fit 的最小 SDK-backed happy path。

### 目标路径

只做最小 slice：

1. recipient registration 检测
2. create receiver-claimable payout
3. recipient scan claimable UTXOs
4. recipient claim
5. activity / disclosure 只围绕 live truth 做衍生叙事

---

### Phase 2.1 — Registration Gate

#### 要做的事

- 检测 recipient 是否满足官方路径前置要求
- 不满足时：
  - 阻止 live create
  - 显示明确状态
  - 不静默 fallback 到 transfer

#### 验证点

- recipient 未注册时，Create Payout 给出明确拦截与说明
- 页面不会伪装成 live success

---

### Phase 2.2 — Live Create

#### 要做的事

- `createPrivatePayout` 改走 official SDK create path
- 范围只支持：
  - devnet
  - 单一资产
  - 一条 happy path

#### 验证点

- live create 确实由 SDK provider 执行
- 有真实 devnet 成功记录可验证

---

### Phase 2.3 — Live Scan

#### 要做的事

- `scanClaimablePayouts` 改走 official SDK scanner
- UI 明确处理：
  - loading
  - none found
  - claimable found
  - infra unavailable

#### 验证点

- recipient 能扫描出真实 claimable payout
- scanner 失败时不会回退成 demo 并伪装 live

---

### Phase 2.4 — Live Claim

#### 要做的事

- `claimPrivatePayout` 改走 official SDK claim path
- 预先检测：
  - prover 是否可用
  - relayer 是否可用
  - index/scan 条件是否满足

#### 验证点

- claim 成功时有真实链路结果
- claim 不可执行时，错误状态明确，不冒充 demo success

---

## Phase 3 — 重构页面 truth consumption

### 目标

让 Create / Claim / Disclosure / Activity 四个页面都建立在统一 provider truth 之上。

### 要做的事

1. `CreatePayoutPageContainer` 改为使用 shared resolver
2. `ClaimCenterPageContainer` 改为使用 shared resolver
3. `DisclosurePageContainer` 改为读取 live-derived or explicit demo-derived 数据
4. `ActivityPageContainer` 改为读取 live-derived or explicit demo-derived 数据
5. `WalletProvider` 中的 `demoFlowSession` 只保留为 UI continuity cache

### disclosure 原则

当前 disclosure 的 `none / partial / verification-ready` 是产品语义，不一定能直接映射成官方 SDK 审计视图。

因此 Phase 1/2 应采用保守策略：

- 有真实 payout / claim 数据时，输出 live-aware derived summary
- 无真实支撑时，明确标记为 demo/reviewer narrative
- 不宣称其为 fully live protocol disclosure artifact

### activity 原则

- activity 的源头应是 provider truth
- demoFlowSession 最多补 continuity，不主导事实
- 页面要能明确区分：
  - live-backed
  - live-derived
  - prepared preview

### 验证点

- 四个主页面都走统一 resolver
- `demoFlowSession` 不再承担协议真相角色
- disclosure / activity 都能正确标记 live/demo 边界

---

## Phase 4 — 文档与提交口径重写

### 目标

让 sponsor fit 的表达建立在官方 SDK 事实之上，而不是建立在 transfer + demo continuity 上。

### 必须更新的文件

- `README.md`
- `docs/PLATFORM_SUBMISSION.md`
- `docs/SUBMISSION.md`
- `docs/DEMO_SCRIPT.md`

### 建议同步更新的文件

- `docs/SPEC.md`
- `docs/TASKS.md`
- `docs/ARCHITECTURE_DIAGRAM.md`

### 改写原则

如果 Phase 2 已完成：

应描述为：

- SDK-backed create
- SDK-backed scan
- SDK-backed claim
- disclosure / activity 为 bounded, live-aware narrative

如果 Phase 2 未完全完成：

应明确写成：

- SDK-backed create only
- SDK-backed create + scan
- claim unavailable / pending

绝不允许再出现：

- 文案把路径写成 official Umbra integration
- 代码实际却仍是 `SystemProgram.transfer`

### 验证点

- README / submission / demo script 说法一致
- 文档边界与真实 provider capability 一致

---

## Phase 5 — 验证与交付闭环

### 目标

让仓库的验证证据和真实能力保持一致，不再“文案领先代码”。

### 自动化验证

至少补齐：

1. provider resolver
2. capability gating
3. registration-required state
4. live create
5. live scan
6. claim success / claim infra unavailable

### 手动验证

形成最小 devnet smoke checklist：

1. wallet connect
2. recipient registered / resolvable
3. create claimable payout
4. recipient scan finds it
5. recipient claim succeeds
6. activity updates coherently
7. disclosure page does not overclaim

### E2E

保留一条最窄 golden path 即可，但必须验证：

- 真实 SDK-backed happy path

而不是：

- gated preview + prepared continuity

### 验证点

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:run`
- 维护一条真实 live path 的 `pnpm test:e2e`
- 有一份手动 devnet smoke 结果文档

---

## 5. 文件级实施重点

### 协议层关键文件

优先处理：

- `src/features/protocol/devnetUmbraService.ts`
- `src/features/protocol/solanaPayoutProgram.ts`
- `src/features/protocol/umbraService.ts`
- `src/features/protocol/umbraService.types.ts`
- `src/features/protocol/schema.ts`

建议新增：

- `src/features/protocol/umbraSdkClient.ts`
- `src/features/protocol/umbraSdkProvider.ts`
- `src/features/protocol/umbraProviderResolver.ts`
- `src/features/protocol/umbraCapabilities.ts`

### 页面接线关键文件

- `src/features/payout/components/CreatePayoutPageContainer.tsx`
- `src/features/claim/components/ClaimCenterPageContainer.tsx`
- `src/features/disclosure/DisclosurePageContainer.tsx`
- `src/features/activity/ActivityPageContainer.tsx`
- `src/providers/WalletProvider.tsx`

### 文档关键文件

- `README.md`
- `docs/PLATFORM_SUBMISSION.md`
- `docs/SUBMISSION.md`
- `docs/DEMO_SCRIPT.md`
- `docs/SPEC.md`
- `docs/TASKS.md`
- `docs/ARCHITECTURE_DIAGRAM.md`

---

## 6. 风险与取舍

### 风险 1：官方 SDK 真接入复杂度高

说明：

- registration / prover / relayer / scanner 都可能成为真实阻塞点

策略：

- 只追求最小可信 live slice
- 不在 Phase 1 尝试 owning 全套 infra

---

### 风险 2：claim flow 是最大实现难点

说明：

- create 比较容易
- scan / claim 才真正决定 sponsor fit 是否站得住

策略：

- 计划与验证都优先押 claim path
- 不先花时间美化 disclosure narrative

---

### 风险 3：当前 disclosure 模型未必能映射到官方语义

说明：

- `partial / verification-ready` 目前更像产品层表达

策略：

- 先将 disclosure 收缩为 live-aware / demo-aware summary
- 不在第一轮承诺 fully live audit artifact

---

### 风险 4：big-bang 重写容易把 demo 全打断

策略：

- 保留 demo mode
- 但 demo 只能是显式 fallback，不许继续伪装成 live continuation

---

## 7. reset 后建议执行顺序

推荐严格按以下顺序：

1. **先做架构清洁**
   - 去掉伪 Umbra 主路径语义
   - 引入统一 provider resolver

2. **再上官方 SDK**
   - 先把 SDK provider 放进协议层中心
   - 不急着一次接完所有页面

3. **优先实现 create + scan + claim**
   - 这是 sponsor fit 最核心的三件事

4. **最后修 disclosure / activity**
   - 它们应该围绕 live truth 做叙事，而不是倒过来反推协议能力

5. **最后统一改文档**
   - 文档必须跟随真实 provider capability

---

## 8. 最终验收标准

项目最终至少应满足以下其中一种诚实表述：

### 理想验收

- SDK-backed create
- SDK-backed scan
- SDK-backed claim
- disclosure / activity 为 bounded, live-aware narrative

### 次优但可接受验收

- SDK-backed create
- SDK-backed scan
- claim 明确 unavailable / pending
- 所有页面明确区分 live 与 demo 边界

### 不可接受状态

- 仍以 `SystemProgram.transfer` 作为 Umbra 主 live path
- 仍让页面静默 fallback 到 demo 并伪装成 live
- 文档继续把 transfer path 说成 official Umbra integration

---

## 9. 结论

这次修复的关键不是“再补一点 UI 或文案”，而是：

> 把协议层中心从 direct SOL transfer 改成官方 Umbra SDK。

在这个基础上，最现实的做法不是追求全量功能，而是构建一条：

- devnet-first
- single-asset
- receiver-claimable
- create → scan → claim

的最小可信 live workflow。

只要这条线成立，你的 sponsor fit 就会从“靠叙事支撑”升级为“有真实协议证据支撑”；之后 disclosure、activity、submission narrative 才真正值得继续往上叠。
