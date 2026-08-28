---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-08-28T08:57:41.292Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | unrun-verify | .planning/phases/01-initialize-canonical-projects/01-12-PLAN.md |  | Plan 01-12 focused and full regression suites have not run on the final approved native snapshot. | open |  | 2026-08-28T08:57:41.292Z |  |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "01",
    "file": ".planning/phases/01-initialize-canonical-projects/01-12-PLAN.md",
    "line": null,
    "description": "Plan 01-12 focused and full regression suites have not run on the final approved native snapshot.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-28T08:57:41.292Z",
    "resolved_at": null
  }
]
````
