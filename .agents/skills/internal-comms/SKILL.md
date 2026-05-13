---
name: internal-comms
description: Write internal company communications — status updates, newsletters, incident reports, FAQs, 3P updates, leadership updates. Use when drafting any internal business communication, team updates, company-wide announcements, or structured internal documents.
---

# Internal Communications Writer

Create clear, professional internal company documents following standard formats.

## Communication Types

### 1. 3P Update (Progress / Plans / Problems)

```markdown
## [Team Name] Update — [Date]

### Progress (what we shipped/completed)
- ✅ [Achievement 1] — [brief impact]
- ✅ [Achievement 2] — [brief impact]

### Plans (what's next, 1-2 weeks)
- 🔜 [Upcoming item 1] — [owner, ETA]
- 🔜 [Upcoming item 2] — [owner, ETA]

### Problems (blockers, risks, needs help)
- ⚠️ [Problem 1] — [impact, what's needed]
- ⚠️ [Problem 2] — [impact, what's needed]
```

**Tone**: Factual, brief, no fluff. Bullet points over paragraphs.

### 2. Project Status Report

```markdown
# [Project Name] — Status Report
**Date**: [Date] | **Status**: 🟢 On Track / 🟡 At Risk / 🔴 Blocked

## Summary
[2-3 sentences: current state, key milestone, biggest risk]

## Key Metrics
| Metric | Target | Actual | Trend |
|--------|--------|--------|-------|
| [Metric] | [Target] | [Actual] | ↑/↓/→ |

## This Week
- [Completed items]

## Next Week
- [Planned items]

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| [Risk] | H/M/L | H/M/L | [Action] |

## Decisions Needed
- [Item needing decision — from whom, by when]
```

### 3. Incident Report

```markdown
# Incident Report: [Brief Title]
**Severity**: P1/P2/P3 | **Duration**: [HH:MM] | **Impact**: [# users affected]

## Timeline
| Time | Event |
|------|-------|
| HH:MM | Incident detected |
| HH:MM | [Action taken] |
| HH:MM | Root cause identified |
| HH:MM | Fix deployed |
| HH:MM | Fully resolved |

## Root Cause
[1-2 sentences: what broke and why]

## Impact
[What was affected, how many users, data implications]

## Resolution
[What fix was applied]

## Action Items
| Action | Owner | Due Date |
|--------|-------|----------|
| [Prevention measure 1] | [Person] | [Date] |
| [Monitoring/alerting improvement] | [Person] | [Date] |
```

### 4. Company Newsletter

```markdown
# [Company] [Month] Update

## Highlights
[3-4 bullet points of biggest wins this month]

## Spotlight: [Feature/Team/Person]
[2-3 paragraph story about something meaningful]

## By the Numbers
[3-4 key metrics with context]

## Upcoming
[What's coming next month]

## Team Corner
[New hires, celebrations, kudos]
```

### 5. FAQ Document

```markdown
# Frequently Asked Questions: [Topic]
*Last updated: [Date]*

---

## [Category Name]

**Q: [Question]**
A: [Clear, direct answer. Link to docs if needed.]

**Q: [Question]**
A: [Answer]
```

### 6. Leadership Update

```markdown
# [Company] Leadership Update — [Quarter/Month]

**From**: [Name, Title]

## State of the Business
[1 paragraph: honest assessment of where we are]

## What's Working
[2-3 bullet points with specifics]

## What Needs Improvement
[1-2 specific areas, with plan]

## Priorities This Quarter
1. [Priority 1] — [brief why]
2. [Priority 2] — [brief why]
3. [Priority 3] — [brief why]

## Ask of the Team
[Clear, specific request]
```

## Style Guide

- **Lead with the most important information** (inverted pyramid)
- **Use headers** for anything over 3 paragraphs
- **Bullets over walls of text** — one idea per bullet
- **Be specific**: "up 23% to $1.2M" not "strong growth"
- **Avoid jargon** unless your audience definitely uses it
- **Action items need owners and dates**: "John will fix by Friday" not "we'll look into it"
- **Bad news first** — don't bury problems in section 4
