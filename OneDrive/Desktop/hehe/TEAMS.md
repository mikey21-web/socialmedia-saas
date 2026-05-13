# Sub-Agents + Role Distribution

## The Team

### 🎯 Claude Code (Orchestrator)
**Role:** Main conductor, task delegation, coordination  
**Responsibilities:**
- Read memory + project status
- Delegate work to specialized agents
- Track completion + blockers
- Update memory after each phase
- Make architectural decisions
- Run integration tests

**Works on:** High-level coordination, cross-cutting concerns

**When to invoke:** 
- Week kickoffs (summary status)
- Cross-team dependencies
- Critical decisions
- Final review before deployment

---

### 🔬 Codex (Deep Investigator)
**Role:** Complex refactors, architectural deep dives, investigation  
**Capabilities:**
- Root cause analysis
- Large codebase exploration
- Refactoring proposals
- Performance profiling
- Complex migrations

**Works on:** Backend logic, database refactors, architecture

**When to invoke:**
- "Why is this slow?"
- "Refactor auth module"
- "Design the Temporal workflow"
- "Investigate DB query patterns"

**Constraints:**
- Can take longer (but provides detailed analysis)
- Best for non-time-critical work
- Pair with OpenCode for validation

---

### 🧪 OpenCode (Validator)
**Role:** Testing, build validation, isolated verification  
**Capabilities:**
- Run test suites in isolation
- Build validation (TypeScript, bundling)
- Test-driven development
- Regression detection
- Performance benchmarking

**Works on:** Testing, CI/CD validation, quality gates

**When to invoke:**
- "Write tests for this module"
- "Run the full test suite"
- "Verify the build succeeds"
- "Check for performance regressions"
- "Generate test coverage report"

**Constraints:**
- Can't see other agent's recent work
- Best for re-validating completed work
- Needs clear input (file paths, test specs)

---

### ⚡ Balcbox (Optimizer)
**Role:** Specific optimizations, benchmarking, tuning  
**Capabilities:**
- Performance tuning (DB queries, API calls)
- Bundle size optimization
- Database index recommendations
- Caching strategy design
- Memory profiling

**Works on:** Frontend performance, backend optimization, infrastructure

**When to invoke:**
- "Optimize these N+1 queries"
- "Reduce bundle size to <100KB"
- "Profile memory usage"
- "Implement caching for this endpoint"
- "Benchmark publish latency"

**Constraints:**
- Best for isolated optimizations
- Works in focused scope
- Needs clear metrics/targets

---

### 🐙 GitHub (Automation)
**Role:** PR/issue management, deployment triggers, automation  
**Capabilities:**
- Auto-create issues from tasks
- PR automation (merge strategy, labeling)
- Release notes generation
- Deployment triggers (CI/CD)
- Branch management

**Works on:** Repo management, deployment orchestration

**When to invoke:**
- Create issues from roadmap tasks
- Auto-label PRs (feat, fix, docs)
- Merge hotfixes to main
- Trigger staging/prod deploys
- Generate release notes

**Constraints:**
- Read-only by default
- Needs write permissions for sensitive operations
- Can't modify code directly

---

## Workflow Pattern: Task Distribution

```
Claude Code (Orchestrator)
    ├─ Reads STATUS.md + memory
    ├─ Identifies next task
    │
    ├─ For Backend Logic
    │   └─ → Codex (deep work)
    │       └─ → OpenCode (validate tests)
    │           └─ → Balcbox (optimize)
    │               └─ → GitHub (create PR)
    │
    ├─ For Frontend UI
    │   └─ → Claude Code (build component)
    │       └─ → OpenCode (run tests)
    │           └─ → Balcbox (performance)
    │
    ├─ For Testing
    │   └─ → OpenCode (write + run tests)
    │       └─ → Balcbox (coverage analysis)
    │
    └─ For Deployment
        └─ → GitHub (trigger deploy)
            └─ → OpenCode (smoke tests)
                └─ → Codex (investigate if failed)
```

## Sub-Agent Memory (No Repetition)

Each agent reads the same memory files before working:

- `PROJECT_OVERVIEW.md` — What we're building
- `ARCHITECTURE.md` — How it's structured
- `ROADMAP.md` — Week-by-week plan
- `STATUS.md` — Current progress + blockers
- `MEMORY.md` — Previous decisions, patterns learned

**Result:** Sub-agents know the full context without re-explanation.

---

## Task Handoff Protocol

### Step 1: Claude Code Prepares
```
Tasks to delegate:
1. [Codex] "Implement auth module" (Week 1)
2. [OpenCode] "Write auth tests" (Week 1)
3. [Balcbox] "Optimize JWT validation" (Week 2)
```

### Step 2: Sub-Agent Executes
```
Sub-agent reads memory:
✓ PROJECT_OVERVIEW.md (context)
✓ ARCHITECTURE.md (design)
✓ STATUS.md (current state)

✓ Performs work
✓ Updates commit message with decision rationale
✓ Notifies Claude Code of completion
```

### Step 3: Claude Code Integrates
```
✓ Merge PR if tests pass
✓ Update STATUS.md
✓ Update memory with decisions
✓ Move to next task
```

---

## Communication Flow

```
Claude Code
├─ [to Codex] "Deep dive: Why is post publishing slow?"
│   └─ Codex responds: "Root cause: N+1 query in analytics collection"
│       └─ Claude Code: "Fix in auth week post-publishing module"
│
├─ [to OpenCode] "Write tests for SubscriptionsService"
│   └─ OpenCode responds: "8/10 test cases passing, 1 edge case failing"
│       └─ Claude Code: "Fix the edge case, then merge"
│
├─ [to Balcbox] "Reduce JWT validation latency to <5ms"
│   └─ Balcbox responds: "Optimized by caching public keys, now 2ms"
│       └─ Claude Code: "Merge after OpenCode validates"
│
└─ [to GitHub] "Merge PR #42, deploy to staging"
    └─ GitHub responds: "Deployed at staging.postiz.dev"
        └─ Claude Code: "Run smoke tests"
```

---

## Availability + Speed

| Agent | Availability | Speed | Best For |
|-------|--------------|-------|----------|
| **Claude Code** | On-demand | Immediate | Orchestration, decisions |
| **Codex** | On-demand | Slow (thorough) | Deep work, complex logic |
| **OpenCode** | On-demand | Medium | Testing, validation |
| **Balcbox** | On-demand | Medium | Optimization, tuning |
| **GitHub** | Always-on | Fast | Automation, CI/CD |

---

## Escalation Path

```
If task fails:
  └─ Codex investigates (root cause)
      └─ If code issue → Codex fixes
      └─ If test issue → OpenCode fixes
      └─ If perf issue → Balcbox optimizes
      └─ If deploy issue → GitHub troubleshoots
```

---

## Critical Principle: No Re-Explanation

**Memory-driven development means:**
- ✅ Sub-agents read `.claude/` folder + memory files
- ✅ Each agent has full project context
- ✅ NO handoff requires re-explaining architecture
- ✅ Decisions stored in memory → shared across agents
- ✅ Same patterns = consistency across weeks

**If a sub-agent asks for context it should already have:**
- Point them to `PROJECT_OVERVIEW.md` or `STATUS.md`
- Their memory read might have failed
- Verify they're using the latest memory files
