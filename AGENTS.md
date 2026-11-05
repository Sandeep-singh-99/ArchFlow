# ArchFlow — Agent Instructions & Operational Guidelines

This repository follows the workspace rules defined in [GEMINI.md](file:///d:/Coding/Web_Dev/major_projects/ai-agent-builder-platform/GEMINI.md).

## Quick Agent Reference

### Core Architecture & Tech Stack
- **Framework:** Next.js 16 (App Router, React 19, Tailwind CSS 4)
- **Backend:** Convex v1.28 (Reactive queries, mutations, actions)
- **Visual Engine:** `@xyflow/react` v12 (React Flow)
- **Auth & Subscriptions:** Clerk Auth, Razorpay Payments SDK
- **Package Manager:** `npm` only (maintain `package-lock.json`)

### Subscription & Quota Guardrails
- **3 Tiers:**
  - `free`: 1 project max, 2 features (Visual Canvas, SQL/NoSQL DDL export).
  - `pro`: 15 projects max, unlocks Multi-Domain containers, CASCADE Drop Simulator, Mermaid.
  - `ai`: Unlimited projects, unlocks AI Copilot and live studio agent tools.
- Feature gating logic must always use `canAccessFeature(featureKey, planCode)` in [`lib/planAccess.tsx`](file:///d:/Coding/Web_Dev/major_projects/ai-agent-builder-platform/lib/planAccess.tsx).
- When a locked feature is triggered, use `notifyFeatureLocked(featureKey, planCode)` with `components/plans/LockedFeatureToast.tsx`.
- Convex mutations in `convex/agent.ts` must enforce server-side quota checks.

### Verification Standards Before Completing Tasks
1. **TypeScript Check:**
   ```bash
   npx tsc --noEmit
   ```
   Must pass with **0 errors**.
2. **ESLint Validation:**
   ```bash
   npx eslint <modified-file>
   ```
   Must pass with **0 errors**.
3. **Build Validation:**
   ```bash
   npm run build
   ```
   Must bundle cleanly without Next.js SSR or build failures.

For complete architectural rules, directory layout, and security guardrails, refer to [GEMINI.md](file:///d:/Coding/Web_Dev/major_projects/ai-agent-builder-platform/GEMINI.md).
