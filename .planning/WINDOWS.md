---
schema_version: 1
open_count: 5
waived_count: 0
fixed_count: 0
total_count: 5
last_updated: 2026-09-04T17:26:55.152Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | unrun-verify | .planning/phases/01-initialize-canonical-projects/01-12-PLAN.md |  | Plan 01-12 focused and full regression suites have not run on the final approved native snapshot. | open |  | 2026-08-28T08:57:41.292Z |  |
| 2 | 01 | deviation | src/filesystem/ownership.ts |  | Atomically publish the killed-process ownership signal to prevent partial JSON reads in recovery tests. | open |  | 2026-08-29T09:02:30.179Z |  |
| 3 | 01 | deviation | tests/helpers/killed-transaction-child.mjs |  | IPC child canonicalizes its fixture root so compiled transaction and runInit recovery share one root fingerprint. | open |  | 2026-08-29T13:54:27.627Z |  |
| 4 | 01 | deviation | tests/unit/artifacts.test.ts | 127 | Task 1 FIND/PAC section line expectation corrected to the existing resolver boundary contract. | open |  | 2026-09-04T17:26:55.079Z |  |
| 5 | 01 | deviation | vitest.config.ts | 9 | Historical validation-errors integration file remains excluded; the new aggregate case was verified through an isolated config. | open |  | 2026-09-04T17:26:55.152Z |  |

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
  },
  {
    "id": 2,
    "kind": "deviation",
    "phase": "01",
    "file": "src/filesystem/ownership.ts",
    "line": null,
    "description": "Atomically publish the killed-process ownership signal to prevent partial JSON reads in recovery tests.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-29T09:02:30.179Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "deviation",
    "phase": "01",
    "file": "tests/helpers/killed-transaction-child.mjs",
    "line": null,
    "description": "IPC child canonicalizes its fixture root so compiled transaction and runInit recovery share one root fingerprint.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-29T13:54:27.627Z",
    "resolved_at": null
  },
  {
    "id": 4,
    "kind": "deviation",
    "phase": "01",
    "file": "tests/unit/artifacts.test.ts",
    "line": 127,
    "description": "Task 1 FIND/PAC section line expectation corrected to the existing resolver boundary contract.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T17:26:55.079Z",
    "resolved_at": null
  },
  {
    "id": 5,
    "kind": "deviation",
    "phase": "01",
    "file": "vitest.config.ts",
    "line": 9,
    "description": "Historical validation-errors integration file remains excluded; the new aggregate case was verified through an isolated config.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T17:26:55.152Z",
    "resolved_at": null
  }
]
````
