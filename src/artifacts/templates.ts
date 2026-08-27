import type { ProjectConfig } from "./schema.js";

export function renderProjectConfig(config: ProjectConfig): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}

export function renderConstitution(): string {
  return `# Exspecso Constitution

## Artifact truth
Repository files are the inspectable source of project truth.

## Human control
People approve intent, scope, and meaningful tradeoffs.

## Evidence integrity
Completion claims require evidence that matches the behavior claimed.

## Bounded scope
Work stays within approved requirements and explicit recovery limits.

## Runtime portability
Supported coding runtimes share one portable Exspecso artifact model.
`;
}
