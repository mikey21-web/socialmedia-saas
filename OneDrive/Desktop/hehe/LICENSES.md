# Third-Party Licenses & Attribution

This project incorporates code, prompts, and design patterns from the following open-source projects.

## Open Design (Apache 2.0)

**Repository:** https://github.com/nexu-io/open-design
**License:** Apache License 2.0

We've adapted the following from Open Design:

### Code patterns

- **Five-Dimensional Self-Critique** (`backend/src/ai/critique/critique.service.ts`)
  Adapted from `apps/daemon/src/prompts/discovery.ts`. The 5-dimension scoring rubric
  (Philosophy, Hierarchy, Detail, Function, Restraint) is the OD adaptation of the
  huashu-design philosophy.

- **Anti-AI-Slop Policy** (`backend/src/ai/prompt-policy/anti-slop-policy.ts`)
  Forbidden vocabulary list, em-dash rule, rule-of-three pattern detection,
  generic opener detection. Adapted from OD's prompt stack.

- **Brand-Spec Extraction Protocol** (5-step: locate → download → grep hex → codify → vocalise)
  Adapted from OD's `huashu-design`-derived brand-asset protocol.

- **Visual Directions Library** (`backend/src/brand-voice/visual-directions.ts`)
  5 curated schools (Editorial, Modern Minimal, Tech Utility, Brutalist, Soft Warm).
  Palette + font specs adapted from OD's `apps/daemon/src/prompts/directions.ts`.

- **HyperFrames Template Catalog** (`backend/src/media/hyperframe-templates.ts` and
  `backend/src/media/hyperframes-extended.service.ts`)
  11 archetype templates (product reveal, SaaS promo, TikTok karaoke, brand sizzle,
  bar chart race, flight map, logo outro, money counter, app showcase, social overlay,
  website-to-video) adapted from OD's `prompt-templates/video/hyperframes-*.json`.

- **Discovery Question Form** (`backend/src/ai/discovery/discovery.types.ts`)
  Surface, audience, tone, scale, goal radio form pattern adapted from OD's
  `<question-form id="discovery">` rule.

### What we deliberately did NOT take

- The Open Design daemon, agent CLI runtime, or Electron desktop shell.
  Our product is a multi-tenant cloud SaaS with a different architecture.
- Open Design's specific HTML skill bundles (we have our own carousel/post templates).

## huashu-design (MIT)

**Repository:** https://github.com/alchaincyf/huashu-design
**License:** MIT

The "Junior-Designer mode" workflow, anti-AI-slop checklist, 5-dimensional self-critique
philosophy, and "5 schools × 20 design philosophies" library are originally from
huashu-design. We adapted these via Open Design's distillation.

## HyperFrames OSS (Apache 2.0)

**Repository:** https://github.com/heygen-com/hyperframes
**License:** Apache License 2.0

The HTML→MP4 motion graphics framework concept (HTML + CSS animations rendered
via headless Chrome + FFmpeg) is from HyperFrames. Our `HyperframesService`
implements a similar render pipeline. The 11 template prompts in our extended
service are adapted from prompts published by Open Design.

---

If you redistribute this code or derived work, please retain this attribution file.
