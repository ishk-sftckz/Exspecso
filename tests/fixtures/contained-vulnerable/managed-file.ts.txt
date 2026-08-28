import { createHash } from "node:crypto";

export type ManagedFileState = "absent" | "owned-unchanged" | "owned-modified" | "unowned" | "malformed-header";

export interface ManagedFileInspection {
  readonly state: ManagedFileState;
  readonly existingContent?: string;
  readonly expectedHash?: string;
  readonly actualHash?: string;
  readonly diff?: string;
}

const templateVersion = 1;
const managedHeader = /^<!-- exspecso:managed template-version=(\d+) original-body-sha256=([a-f0-9]{64}) -->\n/;

export function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function renderManagedFile(body: string): string {
  return `<!-- exspecso:managed template-version=${templateVersion} original-body-sha256=${sha256(body)} -->\n${body}`;
}

function renderUnifiedDiff(existing: string, generated: string): string {
  const existingLines = existing.split("\n");
  const generatedLines = generated.split("\n");
  let prefix = 0;
  while (prefix < existingLines.length && prefix < generatedLines.length && existingLines[prefix] === generatedLines[prefix]) {
    prefix += 1;
  }

  let existingEnd = existingLines.length;
  let generatedEnd = generatedLines.length;
  while (
    existingEnd > prefix
    && generatedEnd > prefix
    && existingLines[existingEnd - 1] === generatedLines[generatedEnd - 1]
  ) {
    existingEnd -= 1;
    generatedEnd -= 1;
  }

  const removed = existingLines.slice(prefix, existingEnd).map((line) => `-${line}`);
  const added = generatedLines.slice(prefix, generatedEnd).map((line) => `+${line}`);
  return ["--- existing", "+++ generated", `@@ -${prefix + 1},${removed.length} +${prefix + 1},${added.length} @@`, ...removed, ...added].join("\n");
}

export function inspectManagedFile(existingContent: string | undefined, generatedContent: string): ManagedFileInspection {
  if (existingContent === undefined) {
    return Object.freeze({ state: "absent" });
  }

  const header = existingContent.match(managedHeader);
  if (header === null) {
    return Object.freeze({
      state: existingContent.startsWith("<!-- exspecso:managed") ? "malformed-header" : "unowned",
      existingContent,
      diff: renderUnifiedDiff(existingContent, generatedContent),
    });
  }

  const [, version, expectedHash] = header;
  const body = existingContent.slice(header[0].length);
  const actualHash = sha256(body);
  if (version !== String(templateVersion)) {
    return Object.freeze({
      state: "malformed-header",
      existingContent,
      expectedHash,
      actualHash,
      diff: renderUnifiedDiff(existingContent, generatedContent),
    });
  }

  return Object.freeze({
    state: actualHash === expectedHash ? "owned-unchanged" : "owned-modified",
    existingContent,
    expectedHash,
    actualHash,
    ...(actualHash === expectedHash ? {} : { diff: renderUnifiedDiff(existingContent, generatedContent) }),
  });
}
