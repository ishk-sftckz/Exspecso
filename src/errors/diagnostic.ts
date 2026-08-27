export type DiagnosticCode =
  | "EXSPECSO_CONFIG_PARSE"
  | "EXSPECSO_CONFIG_SCHEMA"
  | "EXSPECSO_ARTIFACT_INVALID_ID"
  | "EXSPECSO_ARTIFACT_NOT_FOUND"
  | "EXSPECSO_ARTIFACT_DUPLICATE_ID"
  | "EXSPECSO_ARTIFACT_UNKNOWN_PARENT"
  | "EXSPECSO_ROADMAP_RESERVED_PATH";

export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly path: string;
  readonly section?: string;
  readonly expected: string;
  readonly actual: string;
  readonly hint: string;
}

export function renderDiagnostics(diagnostics: readonly Diagnostic[]): string {
  return diagnostics
    .map((diagnostic) => {
      const location = diagnostic.section === undefined ? diagnostic.path : `${diagnostic.path} (${diagnostic.section})`;
      return `${diagnostic.code}: ${location}\nExpected: ${diagnostic.expected}\nActual: ${diagnostic.actual}\nRepair: ${diagnostic.hint}\n`;
    })
    .join("");
}
