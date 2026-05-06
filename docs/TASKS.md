# TASKS.md

## 目标
把 `SPEC.md` 与 `DESIGN.md` 落成一套可执行、可验收、可演示的实施任务序列。  
本文件只定义任务，不写产品代码。

---

## 1. 交付原则

### 1.1 任务拆分原则
- 每个阶段都必须能独立产出可检查结果
- 先锁定产品与技术边界，再做界面和接线
- 先完成 demo 闭环，再补充增强能力
- 先保证 claim / payout / disclosure 三条主链路，再处理美化和扩展

### 1.2 默认 owner
由于当前是单人主导型 hackathon 项目，owner 用“角色”表示，后续实现时可映射到实际执行者：

- `Product`：负责需求边界、验收标准、提报口径
- `Design`：负责 Stitch 原型、视觉策略、组件层设计
- `Frontend`：负责 Next.js 页面、组件、状态、交互
- `Protocol`：负责 Umbra SDK 接线、wallet/signer/network 约束
- `QA`：负责测试、验收、demo 演练
- `Submission`：负责黑客松材料整理与提交

单人执行时，等价于你自己在不同阶段承担不同角色。

---

## 2. 总体阶段划分

| Phase | 名称 | 目标 | 是否阻塞后续 | 当前状态 |
|---|---|---|---|---|
| P0 | Foundation Lock | 锁定 repo/脚手架/接口边界/参考架构 | 是 | 已完成 |
| P1 | Prototype & Design Refinement | 产出 Stitch 原型与视觉/交互定稿 | 是 | 部分完成 |
| P2 | App Shell & Infrastructure | 建好应用骨架、provider、导航、状态容器 | 是 | 已完成 |
| P3 | Payout Flow | 完成 Create Payout 主链路 | 是 | 已完成 |
| P4 | Claim Flow | 完成 Claim Center 主链路 | 是 | 已完成 |
| P5 | Disclosure Flow | 完成 Disclosure / Verification 主链路 | 是 | 已完成 |
| P6 | Activity & Cohesion | 补足活动流、状态串联、叙事闭环 | 否 | 已完成 |
| P7 | Quality Hardening | 可访问性、响应式、安全、性能、测试 | 是 | 部分完成 |
| P8 | Submission Package | 产出演示与提交材料 | 是 | 部分完成 |

> 当前状态按仓库现状保守标记：`已完成` 表示主目标已闭环，`部分完成` 表示已有实现或文档产物，但仍未完全收口。
> 当前 Phase 1 应统一按 **A2-leaning** 方向理解：以 **devnet-first + single-asset** 范围优先完成最小 claim-oriented payout narrative，并让 Disclosure / Activity 保持 **live-aware**、但不夸大为 fully live protocol closure。

---

## 3. 分阶段任务明细

---

## Phase P0 — Foundation Lock

### P0-1. 锁定技术栈与工程基线
**Owner:** Product + Frontend  
**输入:** `SPEC.md`, `DESIGN.md`  
**输出:**
- 最终工程栈清单
- 目录结构草案
- 必选依赖清单
- 非目标清单

**任务内容:**
- 确认使用：
  - Next.js App Router
  - TypeScript
  - pnpm
  - Tailwind CSS
  - TanStack Query
  - React Hook Form
  - Zod
  - Solana Wallet Adapter
- 明确不在 hackathon 首版内实现：
  - 多角色后台
  - 链上复杂治理逻辑
  - 多链扩展
  - 完整企业审计后台
  - 复杂社交系统

**依赖:** 无  
**验证点:**
- 栈选择与 `SPEC.md` 一致
- 没有“看情况再说”的关键基础设施空白

---

### P0-2. 选定前端架构参考源
**Owner:** Frontend  
**输入:** 用户要求“Stitch 原型 + 参考 GitHub 知名开源前端架构”  
**输出:**
- 一个主参考架构源
- 一个辅助参考源
- 借鉴范围说明

**任务内容:**
- 选择一个偏 Next.js 工程规范的主参考
- 选择一个偏 Solana/wallet/dApp shell 的辅助参考
- 明确只借鉴：
  - app shell
  - providers
  - feature organization
  - wallet integration structure
- 明确不直接照搬：
  - UI 风格
  - 业务模型
  - 通用 marketing copy

**依赖:** P0-1  
**验证点:**
- 参考源职责清晰，不混乱
- 能说明“借鉴什么 / 不借鉴什么”

---

### P0-3. 锁定 Umbra 集成边界
**Owner:** Protocol  
**输入:** Umbra docs / SDK docs / RESEARCH  
**输出:**
- Umbra integration contract 草案
- app 侧 wrapper 边界清单
- signer / network / registration 约束清单

**任务内容:**
明确以下边界：
- 哪些逻辑由 app 层负责
- 哪些逻辑交给 Umbra SDK
- client 初始化需要哪些依赖
- 钱包签名能力需要满足哪些条件
- devnet/mainnet/localnet 策略
- indexer / relayer / prover / MPC 依赖点

**建议 wrapper 边界:**
- `createPrivatePayout(...)`
- `getPayoutStatus(...)`
- `scanClaimablePayouts(...)`
- `claimPrivatePayout(...)`
- `buildDisclosureView(...)`

**依赖:** P0-1  
**验证点:**
- 主业务流不直接散落调用低层 SDK
- claim / disclosure 不留黑箱式未决依赖

---

## Phase P1 — Prototype & Design Refinement

### P1-1. 产出 Stitch 原型
**Owner:** Design  
**输入:** `DESIGN.md`  
**输出:**
- Stitch 首版原型
- 页面截图或导出链接
- 页面结构说明

**页面范围:**
- Landing
- Dashboard
- Create Payout
- Claim Center
- Disclosure / Verification
- Activity

**依赖:** P0-1  
**验证点:**
- 原型覆盖所有核心页面
- 不是 generic SaaS dashboard 模板
- 符合 `Editorial Privacy Fintech`

---

### P1-2. 对 Stitch 原型做二次设计约束修正
**Owner:** Design + Product  
**输入:** Stitch 原型, `DESIGN.md`  
**输出:**
- 修正清单
- 最终视觉方向确认稿

**任务内容:**
检查并修正：
- 是否过于模板化
- 是否层级不足
- 是否缺少“隐私感”和“受控披露感”
- 是否把 claim 流做成普通收款页
- 是否把 disclosure 做成生硬表格页

**依赖:** P1-1  
**验证点:**
- 每个关键页面都有明确的视觉主叙事
- Landing / Claim / Disclosure 三页区分度明显

---

### P1-3. 组件分层与页面模块映射
**Owner:** Design + Frontend  
**输入:** 最终原型, `DESIGN.md`  
**输出:**
- 组件 inventory
- 页面到组件映射表
- 可复用组件 / feature 专属组件划分

**任务内容:**
将组件分成：
- `ui/`
- `layout/`
- `marketing/`
- `features/payout/*`
- `features/claim/*`
- `features/disclosure/*`
- `features/activity/*`
- `features/wallet/*`

**依赖:** P1-2  
**验证点:**
- 没有把业务逻辑组件全堆到 `components/`
- 组件分层与 feature 结构一致

---

## Phase P2 — App Shell & Infrastructure

### P2-1. 初始化应用骨架
**Owner:** Frontend  
**输出:**
- Next.js 基础工程
- App Router 路由壳
- 全局样式与 tokens
- providers 骨架

**任务内容:**
建立：
- marketing 与 app 区域分层
- 基础 layout
- route segment 规划
- query provider
- wallet provider
- app provider

**依赖:** P0-2, P0-3, P1-3  
**验证点:**
- 路由结构与 `SPEC.md` 页面地图一致
- provider 边界清晰，不把所有状态混在一个全局 store

---

### P2-2. 建立 design token 与基础 UI primitives
**Owner:** Frontend + Design  
**输出:**
- `tokens.css`
- typography / spacing / surface / motion token
- Button / Input / Panel / Badge / Stepper 等基础 primitives

**依赖:** P2-1  
**验证点:**
- 没有页面级硬编码色值泛滥
- hover/focus/active 有统一语言
- light-first + controlled dark emphasis 可被表达

---

### P2-3. 钱包与网络状态基础层
**Owner:** Frontend + Protocol  
**输出:**
- wallet connect/disconnect UI
- network state UI
- unsupported state
- initialization/loading/error 状态容器

**依赖:** P2-1, P0-3  
**验证点:**
- 未连接钱包时的降级路径清晰
- 网络错误与 signer 不满足条件时有明确提示
- 后续 payout / claim / disclosure 可复用统一状态层

---

### P2-4. 数据访问与 schema 层基线
**Owner:** Frontend + Protocol  
**输出:**
- feature 级 schema
- typed service boundary
- query key 方案
- 表单 schema 方案

**依赖:** P2-1, P0-3  
**验证点:**
- 表单、服务、UI 状态三层职责分开
- 没有把 SDK response 直接扩散到展示层

---

## Phase P3 — Payout Flow

### P3-1. Create Payout 页面结构与表单交互
**Owner:** Frontend  
**输出:**
- create page UI
- 表单字段
- validation
- review step
- submit 状态

**关键内容:**
- recipient input
- token / amount
- metadata / memo
- disclosure options
- review confirmation
- submission feedback

**依赖:** P2-2, P2-4  
**验证点:**
- invalid / review / submitting / success / failure 状态齐全
- 表单结构与 `SPEC.md` 状态矩阵一致

---

### P3-2. Umbra payout wrapper 接线
**Owner:** Protocol + Frontend  
**输出:**
- `createPrivatePayout(...)` 实际接线
- transaction lifecycle 状态
- 错误映射

**依赖:** P3-1, P0-3  
**验证点:**
- 页面不直接拼低层 SDK 调用
- 签名失败 / 网络失败 / 参数失败可区分
- devnet 演示路径可跑通

---

### P3-3. Payout success experience
**Owner:** Design + Frontend  
**输出:**
- success state
- claim guidance
- next-step CTA
- share-safe summary

**依赖:** P3-2  
**验证点:**
- 成功页不是“tx hash 完事”
- 用户能自然转入 claim / disclosure / activity 叙事

---

## Phase P4 — Claim Flow

### P4-1. Claim Center 页面与状态机
**Owner:** Frontend  
**输出:**
- claim center UI
- empty/loading/error/found states
- scanning progress
- claim item cards

**依赖:** P2-3, P2-4  
**验证点:**
- disconnected/setup/scanning/found/none/pending/success/failure 状态齐全
- claim 不被误做成单次按钮页

---

### P4-2. Claimable payout discovery 接线
**Owner:** Protocol  
**输出:**
- `scanClaimablePayouts(...)`
- indexer / scanner 接线
- claimable item normalization

**依赖:** P0-3, P4-1  
**验证点:**
- 发现逻辑与 UI 分离
- claimable item 模型可稳定驱动列表渲染

---

### P4-3. Claim action 接线
**Owner:** Protocol + Frontend  
**输出:**
- `claimPrivatePayout(...)`
- claim transaction progress
- success/failure handling

**依赖:** P4-2  
**验证点:**
- claim 前提条件检查完整
- claim 中间态可见
- claim 后 activity / balance / disclosure 可刷新

---

### P4-4. Claim UX 强化
**Owner:** Design + Frontend  
**输出:**
- scanning feedback
- privacy explanation copy
- failure recovery guidance

**依赖:** P4-3  
**验证点:**
- claim flow 的复杂性被解释清楚
- 用户知道“为什么在扫描”“为什么可能需要等待”

---

## Phase P5 — Disclosure Flow

### P5-1. Disclosure information model 落地
**Owner:** Product + Protocol  
**输出:**
- disclosure fields final list
- disclosure levels
- share-safe data model

**建议分层:**
- no disclosure
- partial disclosure
- verification-ready disclosure

**依赖:** P0-3  
**验证点:**
- 披露模型不越界到“完整审计后台”
- 兼顾隐私与 hackathon demo 可解释性

---

### P5-2. Disclosure / Verification 页面实现
**Owner:** Frontend  
**输出:**
- disclosure page UI
- partial / ready / unavailable / access-limited states
- verification artifacts 展示位

**依赖:** P5-1, P2-2, P2-4  
**验证点:**
- disclosure 页不是普通详情页
- 能体现“controlled visibility”

---

### P5-3. Disclosure data assembly 接线
**Owner:** Protocol + Frontend  
**输出:**
- `buildDisclosureView(...)`
- 显示层 view model
- 分享/导出动作边界

**依赖:** P5-2, P5-1  
**验证点:**
- 页面只消费 disclosure view model
- 敏感底层数据不直接暴露给 UI 层拼接

---

## Phase P6 — Activity & Cohesion

### P6-1. Activity timeline 与跨流程串联
**Owner:** Frontend  
**输出:**
- activity page
- timeline / event cards
- payout / claim / disclosure 状态汇总

**依赖:** P3, P4, P5  
**验证点:**
- activity 能串起完整 demo narrative
- 不是孤立日志表

---

### P6-2. 全局导航与路径闭环优化
**Owner:** Frontend + Design  
**输出:**
- 导航优化
- CTA 串联
- 页面间 next action 指引

**依赖:** P6-1  
**验证点:**
- Landing -> Create -> Claim -> Disclosure -> Activity 路径顺畅
- 不需要用户自己猜下一步

---

## Phase P7 — Quality Hardening

### P7-1. 响应式与视觉回归
**Owner:** QA + Frontend  
**输出:**
- breakpoint screenshots
- overflow 修复清单
- 布局稳定性修复

**检查范围:**
- 320
- 375
- 768
- 1024
- 1440
- 1920

**依赖:** P3-P6 完成  
**验证点:**
- 无明显溢出
- 关键页面在移动端仍可用
- Hero / Claim / Disclosure / Activity 都有截图记录

---

### P7-2. 可访问性修复
**Owner:** QA + Frontend  
**输出:**
- a11y issue list
- keyboard navigation 修复
- focus visible 修复
- reduced motion 适配

**依赖:** P3-P6 完成  
**验证点:**
- 键盘可走通主流程
- 动画不阻碍使用
- 关键对比度达标

---

### P7-3. 安全与边界检查
**Owner:** QA + Frontend + Protocol  
**输出:**
- 安全检查清单
- 风险项处理结果

**检查重点:**
- 不暴露敏感凭据
- 不使用未消毒 HTML 注入
- 第三方脚本边界清晰
- 表单输入校验完整
- 可分享内容无超范围泄露

**依赖:** P3-P6 完成  
**验证点:**
- disclosure 不越权
- 分享内容不泄露不应暴露的信息

---

### P7-4. 性能与加载策略检查
**Owner:** Frontend + QA  
**输出:**
- 关键页面性能记录
- hero/loading/render 优化清单

**依赖:** P3-P6 完成  
**验证点:**
- 不出现明显阻塞资源
- 关键页面满足既定 performance target 的大方向
- 大型视觉内容有尺寸与加载策略

---

### P7-5. E2E / Golden Path 验证
**Owner:** QA  
**输出:**
- 测试用例清单
- golden path 验证结果
- failure path 验证结果

**核心路径:**
1. 进入 landing
2. 连接钱包
3. 创建 payout
4. 进入 claim center
5. 完成 claim
6. 查看 disclosure
7. 在 activity 看到链路闭环

**依赖:** P7-1 ~ P7-4  
**验证点:**
- 主路径可重复演示
- 错误路径不会直接崩溃或失去方向

**当前收口备注:**
- 浏览器人工验收已覆盖 Landing / Dashboard 与 linked demo path 的 create -> claim -> disclosure -> activity 主路径；其中不应被表述为仓库已新增一套完整 live devnet receipts / screenshots 证据。
- Lighthouse / 可访问性方向已完成一轮检查、修复与复验，但当前仓库仍没有 committed performance report / standalone a11y artifact。
- 当前 Playwright 覆盖已从单一 golden-path 扩展到 5 个用例：1 条当前 gated preview / bounded narrative 主路径 + 4 条显式 failure-path（registration-required create gate、scan unavailable、claim unavailable、disclosure/activity unavailable）。
- [x] 已补一个最小 failure-path Playwright 用例：connected supported wallet session 且无 truth-backed context 时，`/app/disclosure` 与 `/app/activity` 会显式显示 unavailable，而不是崩溃或伪装成可继续的 live narrative
- [x] 为该用例补了仅开发态 query-param mock wallet bridge，避免在无浏览器钱包扩展的 Playwright 环境下无法进入 connected wallet session
- [x] 已补 `Create Payout` 的最小 Playwright 验证：connected supported wallet session 且无 live create capability 时，review 态会显式展示 registration-required gate 文案，并禁用 final submit，而不是继续给出可提交错觉
- [x] 上述 `Create Payout` registration-required / capability-gating 用例已通过 Playwright，相关 Create Payout 定向 Vitest（31 passed）也已通过
- [x] 已补 `Claim Center` 的 scan unavailable Playwright 用例：connected supported wallet session 且无 scan capability 时，页面显式返回 unavailable，而非模糊错误或静默 fallback
- [x] 已补 `Claim Center` 的 claim unavailable Playwright 用例：connected supported wallet session 已找到 prepared payout 但无 claim capability 时，页面显式返回 unavailable 并保留当前 claimable context
- [x] 上述 claim failure-path 自动化已通过 Playwright，与 provider / container 层 claim truth 定向 Vitest 一致
- [x] 已同步修正当前 `p7-5-golden-path` 的过期 Activity 文案断言，golden-path Playwright 已重新通过
- [x] 2026-05-05 已重新补跑当前仓库验证：`pnpm typecheck` 通过、`pnpm test:run` 为 33 files / 254 tests 通过、`pnpm test:e2e` 为 5 specs 全部通过；`pnpm lint` 无 error，但仍保留 7 条测试文件 `useLayoutEffect` 依赖 warning，因此 P7 仍应维持“部分完成”口径

---

## Phase P8 — Submission Package

### P8-1. Demo script
**Owner:** Submission + Product  
**输出:**
- 3~5 分钟 demo script
- demo 操作顺序
- fallback script

**依赖:** P7-5  
**验证点:**
- 脚本能清楚说明“为什么需要 Umbra”
- 能清楚展示与普通转账 dApp 的差异

---

### P8-2. 黑客松提交文案
**Owner:** Submission  
**输出:**
- 项目简介
- 问题定义
- 解决方案
- 技术栈
- Umbra 使用说明
- future roadmap

**依赖:** P8-1  
**验证点:**
- 文案不是泛泛“privacy app”
- 明确讲出 payout / claim / selective disclosure 的产品价值

---

### P8-3. 素材包整理
**Owner:** Submission  
**输出:**
- 截图
- demo 视频
- 架构图
- 关键页面说明图
- repo readme 提纲

**依赖:** P8-1, P8-2  
**验证点:**
- 评审不看代码也能理解产品价值
- 视觉素材与实际 demo 一致

**当前收口备注:**
- 提交材料应明确采用浏览器已验证的 demo 顺序与页面口径
- 所有素材需避免把当前实现表述成 production-complete protocol integration
- 若引用自动化测试状态，应表述为：当前 linked demo session 的 Playwright golden-path 与 4 条 bounded failure-path 已通过，但这仍不是完整 live devnet 证据包

---

## 4. 依赖顺序图（简版）

```text
P0 Foundation Lock
  -> P1 Prototype & Design Refinement
  -> P2 App Shell & Infrastructure
  -> P3 Payout Flow
  -> P4 Claim Flow
  -> P5 Disclosure Flow
  -> P6 Activity & Cohesion
  -> P7 Quality Hardening
  -> P8 Submission Package
```

更细粒度关键阻塞关系：

```text
P0-3 Umbra 集成边界
  -> P2-3 钱包与网络状态层
  -> P3-2 payout 接线
  -> P4-2 claim discovery 接线
  -> P5-1 disclosure model

P1-2 原型修正定稿
  -> P1-3 组件映射
  -> P2-2 token/primitives
  -> 后续页面实现风格一致性
```

---

## 5. Milestones

### M1 — Spec Ready
完成：
- `SPEC.md`
- `DESIGN.md`
- `TASKS.md`

**验收标准:**
- 已能明确说出做什么、不做什么、先做什么

---

### M2 — Prototype Ready
完成：
- Stitch 原型
- 视觉修正版
- 组件映射

**验收标准:**
- UI 方向定稿，不再边做边改世界观

---

### M3 — Demo Core Ready
完成：
- payout
- claim
- disclosure 三条主链路可走通

**验收标准:**
- 能做一次完整产品演示

---

### M4 — Submission Ready
完成：
- 质量收尾
- demo script
- 提交素材

**验收标准:**
- 可稳定录屏、可投递、可答辩

---

## 6. 风险与前置缓解

### 风险 A：Umbra claim / disclosure 实际接线比预期复杂
**缓解：**
- 在 P0-3 明确 wrapper boundary
- 先做 app 层状态机与 view model，再接底层

### 风险 B：Stitch 原型过于模板化
**缓解：**
- P1-2 强制做二次设计修正
- 不直接把 Stitch 输出当最终 UI

### 风险 C：页面做得漂亮但 demo 不闭环
**缓解：**
- P3/P4/P5 先于 P6 之后的 polish
- 所有页面都要服务 demo narrative

### 风险 D：披露能力过度承诺
**缓解：**
- 披露只做 controlled visibility
- 不宣称完整链上审计平台能力

### 风险 E：hackathon 材料表达不清
**缓解：**
- P8 单独成阶段
- 提前写 demo script 与提交文案

---

## 7. Definition of Done

项目进入 `spec-impl` 前，以下条件应全部满足：

- [ ] `SPEC.md` 已锁定范围
- [ ] `DESIGN.md` 已锁定视觉与组件策略
- [ ] `TASKS.md` 已锁定阶段和依赖
- [ ] Stitch 原型策略已明确
- [ ] Umbra integration boundary 已明确
- [ ] Demo 关键链路已定义为：
  - [ ] create payout
  - [ ] scan/claim payout
  - [ ] controlled disclosure
  - [ ] activity narrative
- [ ] 提交材料结构已预先规划

---

## 9. P1 / P2 收口适配附录

> 本附录用于把 `Phase P1` / `Phase P2` 与当前仓库现状对齐，供后续设计收口、实现说明与 submission 口径复用。
> 它不是对原任务定义的替换，而是基于现有实现的适配结论。

---

### 9.1 当前仓库证据速览

**真实 IA / 页面合同：**
- `src/lib/routes.ts`
- 当前页面范围与 `SPEC.md` 一致：`Landing`、`Dashboard`、`Create Payout`、`Claim Center`、`Disclosure / Verification`、`Activity`

**当前页面收口状态：**
- `src/app/(marketing)/page.tsx` 当前直接渲染 `MarketingLandingPage`
- Landing 已具备真实营销叙事与生命周期表达，不应再写成 placeholder
- `src/app/(app)/app/dashboard/page.tsx` 当前仍渲染 `DashboardPlaceholder`
- `src/components/layout/PlaceholderPage.tsx` 中的 `AppPlaceholder` 仍代表 Dashboard 等 app shell 收口前的占位状态

**已有真实实现骨架的页面 / 模块：**
- `src/features/payout/components/CreatePayoutPageContainer.tsx`
  - 已通过 `demoUmbraService.createPrivatePayout(...)` 接入 payout 提交边界
- `src/features/claim/components/ClaimCenterPage.tsx`
  - 已有 `idle / scanning / found / empty / error` 状态机
  - 已有 claim 执行、反馈、恢复文案与结果更新逻辑
- `src/features/protocol/umbraService.ts`
  - 已有 `createPrivatePayout(...)`
  - 已有 `getPayoutStatus(...)`
  - 已有 `scanClaimablePayouts(...)`
  - 已有 `claimPrivatePayout(...)`
  - 已有 `buildDisclosureView(...)`
  - 且通过 Zod schema 做 typed boundary
- `src/providers/Providers.tsx`
  - 已有 query provider + wallet provider 分层
- `src/providers/WalletProvider.tsx`
  - 已有 `initializing / disconnected / connected / error`
  - 已有 `devnet / mainnet / unsupported`
- `src/app/layout.tsx` 与 `src/app/(app)/app/layout.tsx`
  - 已有 marketing/app layout 分层与 app shell 容器

---

### 9.2 P1 Stitch 原型设计提示词方案

#### 9.2.1 使用原则

P1 不再按“从零发散原型”的方式执行，而按“**基于现有实现做设计收口**”执行。

也就是说：
- 允许重做视觉、层级、叙事与页面构图
- 不建议推翻既有 IA
- 对已经存在真实交互骨架的页面，应优先做精修与统一
- 对仍是 placeholder 的页面，应作为高优先级补强对象

#### 9.2.2 总提示词模板（给 Stitch）

```text
Design a polished product prototype for “Umbra Bounty Vault”.

Product category:
A privacy-first payout workflow for bounties, grants, and contributor rewards.
This is not a generic wallet, not a transfer app, not a protocol debugger, and not an enterprise audit dashboard.

Core product story:
Turn Umbra into user-facing reward infrastructure through one coherent lifecycle:
1. private payout creation
2. recipient discovery and claim
3. controlled disclosure when verification is needed
4. activity visibility across the lifecycle

Information architecture is fixed and must not be changed:
- Landing
- Dashboard
- Create Payout
- Claim Center
- Disclosure / Verification
- Activity

Do not add or remove primary workflow pages.
Do not rename the main navigation.

Visual direction:
Editorial Privacy Fintech.
Light-first.
Serious privacy-fintech product with editorial character.
Use strong hierarchy, layered surfaces, intentional spacing rhythm, and bounded darker emphasis for privacy-sensitive moments.
Avoid generic SaaS dashboard aesthetics, default component-library shells, cyberpunk clichés, and template landing-page composition.

Important implementation reality:
- Landing and Dashboard still need stronger design closure and should be treated as the highest-priority redesign targets.
- Create Payout, Claim Center, Disclosure, and Activity already have implementation-oriented structure in the codebase, so they should be visually refined and elevated rather than re-invented from scratch.
- Preserve the product framing around reward lifecycle, not transaction execution.
- Disclosure must communicate controlled visibility, not full public audit tooling.
- Claim Center must feel like purposeful recipient discovery, not a wallet inbox.

Design goal:
Make the product feel productized, sponsor-fit, and demo-ready for Umbra.
Each page should have a distinct purpose, but all pages must belong to one coherent reward workflow.
```

#### 9.2.3 页面级补充提示词

**A. Landing**
```text
Design the Landing page as a strong editorial product entry point for a privacy-first reward workflow.
The page must immediately communicate that this product is for private bounty, grant, and contributor reward distribution.
Show the lifecycle early: payout creation -> claim -> controlled disclosure -> activity.
Emphasize sponsor fit: Umbra as infrastructure for private reward distribution.
Avoid generic “secure payments” language, generic hero blobs, and startup-template marketing layout.
```

**B. Dashboard**
```text
Design the Dashboard as a workflow overview, not an analytics-heavy admin panel.
The page should orient a connected wallet user and make the next actions obvious: create payout, claim center, disclosure, activity.
Empty state should still feel intentional and productized.
Avoid dense KPI cards, generic charts, and enterprise operations-console patterns.
```

**C. Create Payout**
```text
Refine Create Payout as a structured, privacy-aware reward issuance flow.
Preserve the idea of guided form input, review, and submit.
Use stronger emphasis surfaces for sensitive review moments and trust-building confirmation states.
Do not redesign it into a raw token transfer form or generic send-money page.
```

**D. Claim Center**
```text
Refine Claim Center as a recipient-side discovery and claim workflow.
Preserve distinct states such as scanning, found, empty, error, pending, and success.
Make scanning feel active but controlled.
The page should clearly explain what the system is doing and why.
Do not turn it into a wallet inbox, transaction history, or simple payout list.
```

**E. Disclosure / Verification**
```text
Design Disclosure / Verification around controlled visibility.
Visually communicate what is shown, what remains private, and why the view is bounded.
Use layered surfaces and formal presentation for verification-ready states.
Do not make this page feel like a compliance spreadsheet, generic detail table, or enterprise audit console.
```

**F. Activity**
```text
Design Activity as the closure of the reward lifecycle narrative.
Prefer a timeline or event-sequenced composition over a plain transaction log.
Emphasize causality across payout creation, claim progress, claim completion, and disclosure readiness.
The page should help judges understand the end-to-end product story quickly.
```

#### 9.2.4 负面约束（直接附给 Stitch）

```text
Do not make the product look like:
- a generic crypto wallet
- a mixer-like interface
- a protocol debugger
- a default dashboard template
- a shadcn/Tailwind starter screenshot
- a dark-only hacker aesthetic
- a compliance-heavy audit backend
- a flat table-driven disclosure page
- a claim inbox that feels like ordinary payment history
```

#### 9.2.5 P1-3 组件映射落地提示

基于当前实现与 `DESIGN.md`，后续组件映射应优先落到以下分层：
- `components/ui/*`
- `components/layout/*`
- `components/marketing/*`
- `features/payout/*`
- `features/claim/*`
- `features/disclosure/*`
- `features/activity/*`
- `features/wallet/*`

并以现有页面合同为准，不在 P1 收口阶段新增主导航页面。

---

### 9.3 P1 收口与适配报告

#### 9.3.1 P1 原始目标回顾

`Phase P1 — Prototype & Design Refinement` 原始要求包含：
- `P1-1`：产出 Stitch 原型
- `P1-2`：对 Stitch 原型做二次设计约束修正
- `P1-3`：组件分层与页面模块映射

#### 9.3.2 当前判断

P1 **不宜标记为 fully done**。

更准确的口径是：
- **P1 的页面 IA、产品范围与部分实现约束，已经被后续代码部分固化**
- 但 **Stitch 原型、设计修正版、组件映射表** 这类正式设计资产仍需补齐

换句话说，P1 不是“未开始”，也不是“全部完成”，而是：
- **设计资产待补齐**
- **实现前提已被后续代码反向满足一部分**

#### 9.3.3 支撑证据

**已被固化的内容：**
- `src/lib/routes.ts` 已锁定 6 个主页面的 IA
- `SPEC.md` 已锁定产品定位、页面地图与主叙事
- `DESIGN.md` 已锁定视觉方向、组件角色与页面级约束

**说明 P1 仍未完全完成的内容：**
- `src/app/(app)/app/dashboard/page.tsx` 仍使用 `DashboardPlaceholder`
- `src/components/layout/PlaceholderPage.tsx` 中 `AppPlaceholder` 仍把一部分 app 页面显式标记为 placeholder surface
- 当前仓库中尚无“Stitch 最终稿 / 页面导出链接 / 修正清单 / 组件映射表”这类正式设计资产

**说明 P1 不应被写成“完全没做”的内容：**
- `Create Payout` 与 `Claim Center` 已经有真实页面骨架和交互模型
- 这些实现实际上已经为后续设计收口提供了真实边界条件

#### 9.3.4 适配建议

后续执行 P1 时，建议把任务重心从：
- “从零再画一轮原型”

改成：
- “**基于现有实现补齐设计收口包**”

优先级建议如下：
1. **Dashboard**：高优先级从 placeholder 升级为 workflow overview
2. **Landing**：在既有真实营销页基础上继续补强层级、叙事与 judge-facing 表达
3. **Create Payout / Claim Center / Disclosure / Activity**：保留现有结构，主要做视觉、叙事与层级精修
4. 产出正式 `P1-2` 修正清单
5. 产出正式 `P1-3` 组件 inventory 与页面映射表

#### 9.3.5 P1 完成标准（适配后版本）

P1 可视为收口完成，当且仅当至少补齐以下产物：
- 一套可直接使用的 Stitch 提示词包
- 六页原型稿或等价设计稿
- 一份设计修正清单
- 一份组件 inventory
- 一份页面到组件映射表
- 且这些产物与当前实现边界不冲突

---

### 9.4 P2 收口与适配报告

#### 9.4.1 P2 原始目标回顾

`Phase P2 — App Shell & Infrastructure` 原始要求包含：
- `P2-1`：应用骨架、App Router、全局样式、providers
- `P2-2`：design token 与基础 UI primitives
- `P2-3`：钱包与网络状态基础层
- `P2-4`：数据访问与 schema 层基线

#### 9.4.2 当前判断

P2 可以表述为：
- **substantially complete**
- **foundation in place**

但不建议表述为：
- fully polished
- fully productized
- complete design system finished

#### 9.4.3 支撑证据

**P2-1 应用骨架已基本落地：**
- `src/app/layout.tsx` 提供 root layout 与全局样式入口
- `src/app/(app)/app/layout.tsx` 提供 app shell 挂载点
- `src/lib/routes.ts` 提供与 `SPEC.md` 一致的页面结构
- `src/providers/Providers.tsx` 已建立 query provider + wallet provider 分层

**P2-2 tokens / primitives 已具备基础：**
- 当前仓库已有 tokens 与基础 UI primitive 体系
- `Panel`、`Badge` 已被 landing / claim 等页面复用
- 但这更适合描述为“最小可用 primitives”，而不是完整 design system

**P2-3 钱包与网络状态层已具备：**
- `src/providers/WalletProvider.tsx` 已定义：
  - `initializing / disconnected / connected / error`
  - `devnet / mainnet / unsupported`
  - `connect / disconnect / isSupportedNetwork / networkLabel`

**P2-4 typed boundary 已具备：**
- `src/features/protocol/umbraService.ts` 已形成统一 app-layer service boundary
- payout / claim / disclosure 已通过 schema parse 与 gateway contract 隔离
- `CreatePayoutPageContainer` 已通过 service boundary 接入

#### 9.4.4 仍需保守表述的部分

以下部分不应被过度承诺：
- `Landing` / `Dashboard` 仍不是 fully productized final page
- 当前 primitives 不应写成完整企业级 design system
- preview / demo wiring 不应写成 production-complete protocol integration
- disclosure 相关能力不应写成完整审计或合规模块

#### 9.4.5 适配建议

后续文档、汇报与 submission 里，建议把 P2 定位为：
- 已完成 app shell 与基础设施搭建
- 已形成可支撑后续 feature 的 provider / wallet / route / typed service boundary
- 剩余工作主要属于页面收口、体验 polish、demo hardening 与设计统一，而不是继续定义 P2 基础设施

#### 9.4.6 P2 推荐对外表述

可使用：
- “App shell and typed workflow foundation are in place.”
- “The project already has route structure, provider layering, wallet/network state, and typed service boundaries.”
- “Remaining work is mostly page-level productization and design closure, not infrastructure invention.”

避免使用：
- “The full design system is finished.”
- “All app surfaces are fully polished.”
- “Protocol integration is production-complete.”

---

### 9.5 SDK Refactor 执行进度（按 `docs/SDK_REFACTOR_PLAN.md`）

- [x] `DisclosurePage` / `ActivityPage` 已显式标记 narrative truth source，区分 `prepared preview`、`demo-derived`、`live-derived` 边界，避免页面继续把 bounded narrative 渲染成无来源标签的“默认真相”。
- [x] 上述 disclosure/activity truth-source labeling 小切片的定向测试与 typecheck 已通过。
- [x] `ClaimCenterPageContainer` 已收口到 shared resolver truth，并移除 connected supported session 下的静默 demo scan/claim success。
- [x] `DisclosurePageContainer` 已区分 preview、truth-backed request、以及 no truth-backed context，并在 connected supported session 且无真实上下文时显式 unavailable。
- [x] `ActivityPageContainer` 已区分 disconnected/unsupported preview、active demo continuity、以及 connected supported session 下的 explicit unavailable。
- [x] `DisclosurePageContainer` / `ActivityPageContainer` 的 demo continuity 激活条件已补齐 wallet-address 级 truth：wallet address 变更但 `connectionVersion` 未变时，不再继续消费旧 session。
- [x] `DisclosurePageContainer` 在 active demo continuity 下已按 capability 优先消费 provider disclosure truth；仅在 live disclosure capability 缺失时回退到 continuity。
- [x] 上述 disclosure truth-consumption 小切片的定向测试与 typecheck 已通过。
- [x] `ActivityPageContainer` 在 active demo continuity 下已优先消费 provider scan truth 的 `claimablePayouts`；仅在 scan capability 缺失或 scan 结果不含 active payout 时回退到 continuity。
- [x] `sdk-live` 的 bounded disclosure capability 已收口到 wallet-scoped scan truth：仅在 provider 具备 scan truth 时暴露 `canBuildLiveDisclosure`，并在请求 payout 不属于当前 wallet-scoped scan 结果时显式拒绝 disclosure build，避免把“有能力”误渲染成“该 payout 已被 truth 验证”。
- [x] `ActivityPageContainer` 已将 live narrative 采纳条件收紧到与当前 session claim story 一致：pending session 仅接受 provider `claimable` 状态，已有 claimResult 时仅接受 provider `claimed` 状态，避免 `truthSource` / claim timeline / claim window summary 自相矛盾。
- [x] 上述 sdk disclosure capability + activity narrative consistency 小切片的定向测试（79 passed）与 typecheck 已通过。
- [x] `ClaimCenterPage` 已将 claim success 后的 downstream `Disclosure` / `Activity` 入口收口到 continuity-backed context：无 linked demo continuity 时不再把用户引去当前 explicit unavailable 页面。
- [x] `DashboardPageOverview` 已将 connected supported session 且无 linked payout session 的 `Disclosure` 入口改为非链接提示，避免 dashboard 在无 truth-backed context 时继续 overpromise disclosure availability。
- [x] 上述 claim/dashboard truth-boundary honesty 小切片的定向测试（40 passed）与 typecheck 已通过。
- [x] `DashboardPageOverview` 已将 workflow path 中的 `Disclosure` / `Activity` 入口收口到 wallet truth：无 linked payout session 时不再开放 Disclosure，未完成 linked claim 时不再开放 Activity，避免 dashboard 主流程继续把用户引去当前 explicit unavailable 页面。
- [x] 上述 dashboard workflow-path truth-boundary 小切片的定向测试（30 passed）与 typecheck 已通过。
- [x] `CreatePayoutPageContainer` 已完成 capability boundary 收口：connected supported session 若无真实 create capability，不再静默 fallback 到 demo submit。
- [x] `CreatePayoutPage` 已支持 `submitCreatePayout = null`，并在 capability 缺失时显式禁用 final submit。
- [x] `CreatePayoutPageContainer` 已把 connected supported session 的 create truth 切到 SDK resolver；legacy transfer 不再作为默认 live create provider。
- [x] `CreatePayoutPage` review 态已显式展示 registration / SDK gate 文案，避免 transfer / demo success 冒充 live create。
- [x] 上述 page-level truth boundary 相关定向测试与 typecheck 已通过。
- [x] `Phase 2.2 — Live Create`
  - [x] 防止 `sdk-live` create success 继续写入 demo continuity，避免后续 Claim / Disclosure / Activity 误把 live result 当作 demo session 消费
  - [x] 接入真实 recipient registration 检测抽象，并让 `sdk-live` provider 具备 query-backed registration resolver 接口
  - [x] 在 `CreatePayoutPage` review 态接入异步 registration gate 结果，并区分默认 unavailable vs recipient unregistered 文案
  - [x] 将 resolver 真正接到官方 `@umbra-privacy/sdk` 的 `getUserAccountQuerierFunction` 与 signer/client 构建链路
  - [x] 在 `sdk-live` provider 下基于官方 `EncryptedUserAccount` 字段细化 recipient ready 判定，并把 `x25519 / commitment / anonymous usage` 未就绪原因透传到 create review gate
  - [x] 将“recipient 已注册且 create 仍未接通”与“recipient 未注册”两类状态继续贯穿到后续 live create adapter
  - [x] 为 `sdk-live` provider 补齐 injected create gateway 的最小 capability boundary，并在 create available 时清除 review 态的错误 `not wired` 提示
  - [x] 接通 official SDK create execution：通过 Wallet Standard signer bridge 将 wallet-adapter 签名能力接到官方 create path，并补齐针对性测试覆盖
  - [x] 在 wallet bridge / wallet session 层补齐 auto reconnect 与切账号后的 session invalidation，避免旧 demo continuity 穿透到新钱包会话
- [x] `Phase 2.3 — Live Scan`
  - [x] 将 `scanClaimablePayouts` 接到 official SDK scanner，并在 `sdk-live` provider 中暴露真实 scan capability
  - [x] `ClaimCenterPageContainer` 在 connected supported session 下优先消费 shared resolver truth；有 demo continuity 时继续保留 session 优先级
  - [x] 当 live scan 基础设施未配置或当前 provider 无 scan capability 时，Claim Center 显式返回 unavailable，而不再退回泛化 `not implemented` / 模糊默认错误
  - [x] `ClaimCenterPage` 已将 scanner unavailable 映射为明确用户态文案，并补齐 Claim Center / provider 层定向测试与 typecheck
  - [x] live scan capability truth 已与 signer 前置条件对齐：缺少 `signTransaction` / `signMessage` 时不再提前暴露 `canScanClaimablePayouts`

- [x] `Phase 2.4 — Live Claim`
  - [x] `ClaimCenterPageContainer` 在 connected supported session 且无 demo continuity 时，对 claim capability 缺失显式返回 unavailable，而不再透传泛化 `claimPrivatePayout is not implemented`
  - [x] `umbraSdkClient` / `umbraSdkProvider` 已补齐 claim unavailable 常量与 `canClaimPrivatePayout` capability truth，保持 provider truth model 与 scan/create 对齐
  - [x] `ClaimCenterPage` 已将 claim unavailable 映射为明确用户态文案，并补齐 Claim Center / provider / wallet session 定向测试与 typecheck
  - [x] demo continuity 已补齐 wallet-address 级 session identity，并保留 pending / claimed 的 claim status 语义，避免地址切换复用旧 session 或把 pending 误报为 claimed
  - [x] `umbraSdkClient` 已补齐基于 official SDK 的最小 live claim gateway：claim 时即时重扫当前 wallet session 的 claimable UTXO，按 synthetic `payoutId` 匹配目标，并在 signer / indexer / relayer / merkle-proof 依赖齐备时返回真实 `transactionHash` + `pending` 结果
  - [x] receiver-claim 路径的 scan / claim 集合已对齐 official SDK quickstart：Claim Center 仅暴露并匹配 scanner 的 `received` UTXO，避免把 `publicReceived` 误展示为可 claim
  - [x] Wallet Standard signer 的 `account.chains` 已与 `config.network` 对齐，避免在 mainnet live signer session 中继续写死 `solana:devnet`
- [x] `resolveReadOnlyUmbraProvider` 已补最小协议层自动化证据：注入 `scanClaimablePayouts` 时会暴露 `canScanClaimablePayouts: true`，并按当前 provider truth 同步带出 `canBuildLiveDisclosure: true`；注入 `claimPrivatePayout` 时会暴露 `canClaimPrivatePayout: true`，避免 read-only resolver 的 capability matrix 再次漂移。
- [x] 上述 read-only resolver capability truth 的定向 Vitest（`umbraProviderResolver.test.ts` + `umbraSdkProvider.test.ts`，27 passed）已通过，进一步补齐 `Phase 5` 中 provider resolver / live scan / live claim 的自动化验证证据。
- [x] 已把 `Phase 5` 的最小手动 devnet smoke checklist 结果整理进 `docs/P7_VALIDATION_EVIDENCE.md`：把 wallet connect / registration gate / create / scan / claim / activity / disclosure 七步与仓库内现有证据逐项对齐，避免“只有散落文案，没有成型收口记录”。
- [x] 上述 smoke checklist 采用 reviewer-safe 口径：明确它是基于现有浏览器人工主路径与自动化 truth-boundary 证据的 closeout artifact，而不是伪装成已提交 live devnet transaction receipts / screenshot pack 的过度声明。
- [x] 轻量审查已补跑；review agent 仍受 worktree 与本地未提交改动不同步影响，因此本轮以本地文件状态与通过的定向测试结果作为收口依据。
- [x] `Phase 4 — 文档与提交口径重写`
  - [x] README / `docs/PLATFORM_SUBMISSION.md` / `docs/SUBMISSION.md` / `docs/DEMO_SCRIPT.md` 已与当前 SDK-backed create -> scan -> claim 边界对齐，不再把仓库表述成“只有 Create live anchor”。
  - [x] Disclosure / Activity 口径已统一收口为 bounded wallet-scoped summary，不再误写成完整 live disclosure backend / audit artifact。
  - [x] `docs/ARCHITECTURE_DIAGRAM.md` / `docs/SPEC.md` 已继续收口到当前 truth model：claim flow 不再以 demo continuity 作为主表述，架构图也不再把集成边界描述成 preview/demo-only。
- [x] `Phase 5 — 验证与交付闭环`
  - [x] 2026-05-05 已重新跑通当前自动化验证：`pnpm typecheck`、`pnpm test:run`（33 files / 254 tests）、`pnpm test:e2e`（5 specs）全部通过
  - [x] `pnpm lint` 已收敛到 `0 errors / 7 warnings`，剩余均为 3 个 container test 文件中的 `useLayoutEffect` 依赖 warning，不构成当前 Phase 5 阻塞，但仓库仍不应表述为 lint-clean
  - [x] 为通过当前验证补做了最小兼容修复：`WalletProvider.tsx` 将 demo continuity 清理从 effect 内同步 setState 改为派生可见值，避免 React `set-state-in-effect` lint error
  - [x] 为通过当前验证补做了测试环境兼容修复：`SolanaWalletBridgeProvider.tsx` 对 `useSearchParams()` 的空值场景做安全降级，避免 `app layout` Vitest 因 mock wallet bridge 查询参数读取而崩溃
  - [x] `docs/P7_VALIDATION_EVIDENCE.md` 已更新为当前仓库状态：5 条 Playwright 证据、254 条 Vitest 通过、以及 reviewer-safe 的 bounded evidence 口径

- **P1：部分被后续实现反向满足，但正式设计资产仍需补齐，因此不算 fully done。**
- **P2：基础设施与 typed boundary 已大体完成，可作为后续功能与 demo 的稳定底座。**
- **P6：活动流、状态串联与叙事闭环已经完成，可作为对外 demo 主线。**
- **P7：当前已跑通 typecheck、Vitest 与 5 条 Playwright；lint 仅剩测试文件 warnings，且响应式 / a11y / performance / live-devnet artifact 证据仍不完整，因此仍应维持“部分完成”。**
- **P8：提交文案与演示口径应以“SDK-backed create -> scan -> claim + bounded disclosure/activity summary + 保守范围声明”作为统一表述。**
- 后续若继续补文档、原型与 submission，应统一采用以下口径：
  - 这是一个 **privacy-first reward workflow**
  - 不是 generic wallet
  - 不是 protocol-only demo
  - 不是完整审计后台
  - Umbra 的价值体现在 **private payout -> claim -> controlled disclosure -> activity** 的完整产品链路里
