import { ADAPTER_REGISTRY } from "../adapters/registry.js";
import type { AgentId } from "./runtime-selection.js";

export function formatCompletion(selectedAgents: readonly AgentId[]): string {
  const nativeInvocations = selectedAgents.map((agent) => {
    const adapter = ADAPTER_REGISTRY[agent];
    return `For ${adapter.displayName}, invoke ${adapter.nativeInvocation}`;
  });

  return ["/exspecso-start", ...nativeInvocations].join("\n") + "\n";
}
