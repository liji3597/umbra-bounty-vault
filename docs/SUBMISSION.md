# SUBMISSION.md

## 目标
把 `Umbra Bounty Vault` 从“一个做了不少功能的项目”包装成“一个评审能快速理解其价值、并明确看到 Umbra sponsor fit 的作品”。

本文件只定义提交与展示方案，不写产品代码。

---

## 1. 项目提交定位

### 1.1 提交名称
**Umbra Bounty Vault**

### 1.2 一句话介绍
A privacy-first payout workflow for bounties, grants, and contributor rewards — using Umbra to make reward distribution claimable, private, and selectively disclosable.

### 1.3 中文版本一句话
一个面向 bounty、grant 和 contributor reward 的隐私发放工作流：可私密发放、可发现并领取、可受控披露。

---

## 2. 评审最关心的三个问题

提交材料必须快速回答以下三个问题：

### Q1. 你做的是什么？
不是“一个隐私转账 demo”，而是：

- 一个 **隐私赏金 / 补助 / 贡献奖励发放产品原型**
- 聚焦于：
  - 发放方如何私密发奖励
  - 接收方如何发现并领取
  - 项目方如何在需要时做受控披露

### Q2. 为什么必须用 Umbra？
因为这个场景的核心不是普通支付，而是：

- 不想公开暴露每笔 reward 的接收关系
- 不想把 contributor reward 公开链上裸露成可聚类的转账历史
- 同时又不能失去“可领取”“可解释”“可在特定场景下证明”的能力

Umbra 在这里不是装饰，而是产品能力核心：

- private payout
- claimable flow
- privacy-preserving reward distribution
- selective disclosure narrative

### Q3. 你的产品比“普通 dApp + 转账”强在哪？
普通转账 dApp 只能做：

- 发出一笔钱
- 收到一笔钱
- 全部公开或几乎无隐私表达

`Umbra Bounty Vault` 做的是：

- 私密发放奖励
- 接收人主动发现并领取
- 项目方可做受控披露
- 形成完整的 reward lifecycle

---

## 3. Sponsor Fit 表达方式

## 3.1 核心 sponsor fit 结论
该项目与 Umbra sponsor track 的契合点不是“用了 SDK”，而是：

- 将 Umbra 的隐私能力转成一个清晰的用户产品场景
- 展示协议能力如何从底层能力变成上层 workflow
- 让评审看到 Umbra 不仅适合“隐私转账”，也适合“隐私 reward infrastructure”

---

## 3.2 提交文案中必须强调的 Umbra 能力
提交页、README、demo narration 中，应反复强调以下能力：

- private payout creation
- recipient claim flow
- privacy-preserving reward distribution
- controlled / selective disclosure
- user-facing dApp integration, not just protocol experiment

---

## 3.3 不要这样讲
避免把项目讲成：

- “一个很酷的隐私钱包”
- “一个 mixer-like app”
- “一个通用支付界面”
- “一个还没做完的探索性概念稿”
- “只是做了前端包壳接了 SDK”

这些说法都会削弱 sponsor fit。

---

## 4. 推荐提交结构

---

## 4.1 项目标题
**Umbra Bounty Vault**

---

## 4.2 Tagline
**Private rewards, claimable payouts, controlled disclosure.**

---

## 4.3 Problem
Today, contributor rewards, grants, and bounties are usually distributed through fully visible transfer flows.  
That makes recipient relationships, reward timing, and payout patterns easy to trace, even when teams may want discretion.

### 中文理解
现在的大多数 bounty / grant / contributor reward 发放流程都是完全公开的。  
这会暴露：
- 谁收到了奖励
- 什么时候收到
- 是否被连续资助
- 团队如何分配奖励

而很多项目实际需要的是：
- 保留发放能力
- 不公开暴露接收关系
- 仍然允许接收人领取
- 在需要时做有限证明

---

## 4.4 Solution
Umbra Bounty Vault is a privacy-first payout workflow that lets teams privately issue rewards, lets recipients discover and claim them, and supports controlled disclosure when verification is needed.

---

## 4.5 Why Umbra
We use Umbra because the core requirement is not just sending funds — it is making reward distribution private, claimable, and selectively revealable in a user-facing application.

---

## 4.6 Key Features
- Private payout creation for bounties, grants, and contributor rewards
- Claim center for discovering and claiming the active payout in the same demo session
- Controlled disclosure views for verification contexts
- Activity timeline across payout, claim, and disclosure events
- Wallet-based, user-facing dApp flow with typed demo-service boundaries

---

## 4.7 Demo Scope
Demo focuses on the end-to-end flow:

1. Connect wallet
2. Create a private payout
3. Discover and claim that payout in claim center
4. View the matching controlled disclosure context
5. Review the reward lifecycle in activity

This flow has been manually validated in the browser as one linked demo session. It should still be described as a demo-ready workflow built on typed boundaries, not as a production-complete live treasury environment.

Current QA note: browser validation and targeted tests cover the closeout path, but the existing Playwright golden-path assertions still need refresh for current UI copy before claiming fully green automated E2E.

---

## 4.8 Future Scope
- team-level payout policies
- batched campaign payouts
- richer disclosure templates
- organization-facing treasury workflow
- enhanced recipient-side reward inbox

---

## 5. Demo 叙事框架

评审不会先关心你页面多漂亮，而是会先判断：

- 你是否理解 Umbra 的价值
- 你是否找到了真实场景
- 你是否把功能讲成产品

因此 demo 必须围绕“一个真实 reward flow”展开。

---

## 5.1 推荐 demo 叙事
**故事线：**
一个团队想给 contributor 发 bounty / grant / reward，但不希望把受益关系和金额模式直接暴露在公开链上；接收方需要能发现并领取；如果要对外证明某次发放的合理性，则提供受控披露视图。

---

## 5.2 Demo narrative sentence
“Instead of treating privacy as a hidden transfer trick, we turned Umbra into a contributor reward workflow: private issuance, recipient claim, and controlled disclosure.”

这句非常适合在 demo 开头或结尾出现。

---

## 6. Demo Script（3–5 分钟版）

---

### Scene 1 — Opening Problem (20–30s)
**画面：** Landing page  
**要讲：**
- This project is built for private bounty, grant, and contributor reward distribution.
- In many ecosystems, reward payouts are fully transparent by default.
- But teams often want the payout to be claimable without exposing the full recipient relationship publicly.

**核心目的：**
先把“这不是普通钱包项目”打进去。

---

### Scene 2 — Why This Product Exists (20–30s)
**画面：** Landing hero / value proposition  
**要讲：**
- Umbra gives us privacy primitives.
- We wanted to turn those primitives into a user-facing payout workflow.
- The product focus is not anonymous spending in general, but private reward distribution.

**核心目的：**
把 sponsor fit 说清楚。

---

### Scene 3 — Create Payout (40–60s)
**画面：** Create Payout  
**操作：**
- 填写 reward payout 信息
- 进入 review
- 提交 payout

**要讲：**
- Here a team issues a private payout to a contributor.
- The app guides the sender through a structured payout flow instead of a raw transaction form.
- This is where Umbra becomes part of an actual reward workflow, not just a hidden transfer primitive.

**核心目的：**
展示产品化，不只是 SDK button。

---

### Scene 4 — Claim Center (45–60s)
**画面：** Claim Center  
**操作：**
- 展示 scanning 状态
- 展示刚创建 flow 对应的 claimable payout
- 执行 claim

**要讲：**
- On the recipient side, the experience is claim-based.
- The recipient doesn’t just receive a visible transfer in a normal wallet history.
- They discover the active payout in the app and claim it through the same demo session.

**核心目的：**
这是最能体现产品价值的地方之一，必须讲清。

---

### Scene 5 — Controlled Disclosure (40–50s)
**画面：** Disclosure / Verification  
**操作：**
- 展示 no disclosure / partial disclosure / disclosure available 状态
- 展示一个受控披露示意视图

**要讲：**
- Privacy doesn’t mean zero explainability.
- In some contexts, teams may still need to show a limited proof or controlled summary.
- This page represents the idea of controlled disclosure rather than full public exposure.

**核心目的：**
把“隐私 ≠ 无法验证”讲出来。

---

### Scene 6 — Activity / Lifecycle (20–30s)
**画面：** Activity page  
**要讲：**
- We also model the reward lifecycle as a coherent activity story:
  payout created, claimable state detected, claim completed, disclosure context available.
- This turns isolated crypto actions into a usable product flow.

**核心目的：**
收束闭环。

---

### Scene 7 — Closing (15–20s)
**画面：** 回到品牌页或某个总览页  
**要讲：**
- Umbra Bounty Vault shows how Umbra can power real privacy-first reward infrastructure.
- Not just private transfers, but claimable contributor rewards with selective visibility.

**收尾句推荐：**
“Private rewards, claimable payouts, controlled disclosure.”

---

## 7. Demo Script（90 秒压缩版）

如果时间很紧，采用以下压缩版：

### 7.1 开头
Umbra Bounty Vault is a privacy-first reward distribution workflow for bounties, grants, and contributor rewards.

### 7.2 中段
We use Umbra to let teams issue payouts privately, let recipients discover and claim them, and let the app present controlled disclosure when verification is needed.

### 7.3 结尾
This makes Umbra feel like product infrastructure, not just a protocol primitive.

---

## 8. 录屏与演示顺序

推荐固定顺序：

1. Landing
2. Connect Wallet
3. Dashboard
4. Create Payout
5. Claim Center
6. Disclosure / Verification
7. Activity
8. Closing brand/value frame

### 每一步要做什么
1. **Landing**：先讲问题、目标用户、为什么这不是普通钱包或转账页。
2. **Connect Wallet**：展示这是可执行的 dApp 流程，而不是静态原型。
3. **Dashboard**：快速建立“reward workflow 产品”视角，而不是直接跳到单个技术表单。
4. **Create Payout**：走完输入、review、submit，说明发放端是结构化流程。
5. **Claim Center**：展示 scan、发现 claimable payout、执行 claim，突出接收侧体验。
6. **Disclosure / Verification**：说明隐私与可验证不是二选一，而是受控披露。
7. **Activity**：收束 payout -> claim -> disclosure 的生命周期闭环。
8. **Closing brand/value frame**：用一句话重申 sponsor fit 与产品价值。

### 原因
- 从价值 -> 动作 -> 结果 -> 解释 闭环最自然
- 避免一上来进技术页面导致评审失焦
- 先讲场景，再展示协议价值

---

## 9. Fallback Script（当现场演示不稳定时）

如果钱包连接、网络状态、录屏环境或页面跳转不稳定，就切到 fallback script。原则是：
- 不假装链上动作成功
- 不临场 debug
- 继续把产品闭环讲清楚
- 始终把 Umbra sponsor fit 放在主线里

### Fallback A — 钱包连接失败
**讲法：**
- The live wallet environment is unstable, so I’m switching to prepared product states from the same intended flow.
- What matters is the workflow Umbra enables: private payout creation, recipient claim, and controlled disclosure.
- I’ll explicitly use prepared screens to explain the lifecycle, not to imply a live on-chain result.

**转场顺序：**
Landing -> Create Payout 截图/已准备状态（明确标注 prepared state） -> Claim Center 状态（明确标注 prepared state） -> Disclosure -> Activity

### Fallback B — Claim 或网络请求不稳定
**讲法：**
- Normally the recipient scans and claims here.
- If the live request is unstable, I stop the live attempt here and switch to prepared post-claim screens.
- Those prepared states are only for explaining the rest of the lifecycle, not for claiming that this live request succeeded.

**转场顺序：**
Claim Center 当前状态 -> 预先准备的 claimed/pending 状态（明确标注 prepared state, not live confirmed result） -> Disclosure -> Activity

### Fallback C — 时间被压缩到 90 秒
直接切到第 7 节压缩版，并只保留：
1. Landing value frame
2. Create Payout
3. Claim Center
4. Disclosure
5. Closing sentence

### Fallback Closing Line
- Even when the live environment is unstable, the product story stays the same: Umbra is powering a privacy-first reward workflow, not just a hidden transfer.

---

## 10. 素材清单

---

## 10.1 必备素材
- landing 截图
- create payout 截图
- claim center 截图
- disclosure 页面截图
- activity 页面截图
- 3–5 分钟 demo 视频
- 项目 logo / 标题图
- 一张总览架构图

---

## 10.2 推荐补充素材
- 状态机图（payout / claim / disclosure）
- 用户流程图
- feature matrix
- “Why Umbra” 一页图

---

## 11. README / 提交页结构

---

### 11.1 README 推荐结构
1. Project name
2. One-line tagline
3. Problem
4. Solution
5. Why Umbra
6. Core flows
7. Tech stack
8. Demo
9. Architecture
10. Future work

---

### 11.2 提交页推荐结构
1. What we built
2. Problem we solve
3. Why it matters
4. How Umbra is used
5. Demo flow
6. What’s next

---

## 12. 技术栈表述建议

### 推荐写法
- Next.js App Router
- TypeScript
- Tailwind CSS
- TanStack Query
- Zod
- Custom wallet provider layer
- Typed Umbra service boundary

### 表述重点
不要只列工具名，要说明用途：

- Next.js for product-grade app structure
- TanStack Query for async workflow state
- Zod for schema validation and typed form boundaries
- Wallet provider layer for connected wallet preview and network state
- Typed Umbra service boundary for payout, claim, and disclosure flow integration

---

## 13. 评审问答准备

---

### Q: Why is this better than a normal payout dashboard?
**答法：**
Because the core value is not dashboard management — it’s preserving privacy in the reward distribution lifecycle while keeping the flow claimable and understandable.

---

### Q: Why not just send tokens directly?
**答法：**
Direct transfers expose relationships and payout patterns. This project explores a private workflow where reward issuance and recipient discovery are handled with a privacy-first model.

---

### Q: Is this just a wallet wrapper?
**答法：**
No. The product adds workflow structure around payout creation, recipient claim discovery, and controlled disclosure. The point is turning protocol capability into usable application logic.

---

### Q: What makes this a real product idea instead of a feature demo?
**答法：**
It maps to a concrete recurring need: private contributor rewards, grants, and bounties. The app is organized around user roles and lifecycle steps, not around isolated protocol actions.

---

### Q: What is the disclosure model for?
**答法：**
To represent that privacy and verifiability can coexist. Teams may need limited visibility in some contexts, without making the entire reward graph publicly visible.

---

## 13. 禁止出现的 submission 弱表达

以下表达应避免写进 submission：

- “We built a privacy transfer app”
- “This is a wallet with private sending”
- “We integrated Umbra SDK into a frontend”
- “We experimented with private payments”
- “This is a concept for future use”

这些表达都太弱，且容易让评审觉得 sponsor fit 不够深。

---

## 14. 推荐出现的 submission 强表达

应优先使用以下句式：

- “privacy-first payout workflow”
- “claimable contributor rewards”
- “private bounty and grant distribution”
- “controlled disclosure for verification contexts”
- “turning Umbra primitives into a user-facing application flow”
- “reward lifecycle, not just transaction execution”

---

## 15. 核心评分抓手

虽然具体评分细则未完全锁死，但从 sponsor track 常见偏好看，本项目最应该打的分项是：

### 15.1 协议契合度
- Umbra 不是装饰性依赖
- 产品核心价值直接依赖 Umbra

### 15.2 产品化能力
- 有清晰用户故事
- 有完整发放-领取-披露闭环
- 有明显页面级体验设计

### 15.3 演示清晰度
- demo 能一遍讲明白
- 不是抽象概念稿
- 不是纯技术堆砌

### 15.4 可延展性
- 能扩展到 grants / DAO contributor rewards / internal contributor compensation
- 有明确 roadmap

---

## 16. 最终提交口径

### 最短版
Umbra Bounty Vault is a privacy-first reward workflow that lets teams issue private payouts, lets recipients discover and claim them, and supports controlled disclosure when verification is needed.

### 中文最短版
Umbra Bounty Vault 是一个面向 bounty / grant / contributor reward 的隐私发放工作流：可私密发放、可发现并领取、可受控披露。

### 标准版
We built Umbra Bounty Vault to show how Umbra can power a real reward-distribution product. Instead of using privacy only for hidden transfers, we built a workflow for private payout creation, recipient claim discovery, and controlled disclosure. This makes Umbra useful for bounties, grants, and contributor rewards where teams want privacy without losing usability.

---

## 17. 提交前最终检查清单

- [ ] 标题没有把项目讲成 generic wallet
- [ ] 一句话介绍里明确是 reward / bounty / grant workflow
- [ ] Why Umbra 段落写清楚了 sponsor fit
- [ ] demo 视频展示了 create -> claim -> disclosure -> activity 闭环
- [ ] README 和提交页用词一致
- [ ] 没有过度承诺“完整审计系统”或“企业级基础设施”
- [ ] 视觉素材与真实产品页面一致
- [ ] 所有截图都是最终风格而非草稿 UI
- [ ] 收尾句能一句话说明项目价值

---

## 18. spec-impl 结束后的推荐动作

在提交材料层面，建议最终同步检查以下四份文档：

- `SPEC.md`
- `DESIGN.md`
- `TASKS.md`
- `SUBMISSION.md`

如果继续推进实现与 demo hardening，推荐优先检查：
1. Create Payout
2. Claim Center
3. Disclosure / Verification
4. Activity
5. QA / Demo hardening

这样可以保证提交叙事与实际演示状态保持一致。
