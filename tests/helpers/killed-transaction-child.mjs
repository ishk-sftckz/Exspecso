import { realpath } from "node:fs/promises";
import { resolve } from "node:path";

const [mode, rootInput, point, ...extra] = process.argv.slice(2);
const requestedRoot = resolve(rootInput ?? "");
const root = rootInput === undefined ? "" : await realpath(requestedRoot);
const promotionPoint = /^(before-promotion|after-promotion|after-journal):[^\\/]+(?:\/[^\\/]+)*$/;

if (rootInput === undefined || requestedRoot !== rootInput || extra.length !== 0 ||
  (mode === "transaction-promotion" && (point === undefined || !promotionPoint.test(point))) ||
  (mode === "ownership-publication" && point !== undefined) ||
  (mode !== "transaction-promotion" && mode !== "ownership-publication") ||
  typeof process.send !== "function") {
  throw new Error("invalid killed transaction child arguments");
}

function announce(payload) {
  return new Promise((resolveSend, rejectSend) => {
    process.send(payload, (error) => error === null || error === undefined ? resolveSend() : rejectSend(error));
  });
}

function waitForTermination() {
  return new Promise(() => {});
}

if (mode === "transaction-promotion") {
  const [{ buildInitPlan }, { commitTransaction }] = await Promise.all([
    import("../../dist/init/plan.js"),
    import("../../dist/filesystem/transaction.js"),
  ]);
  const plan = await buildInitPlan({ repositoryRoot: root, selectedAgents: ["codex"] });
  await commitTransaction(plan, {
    async onPromotion(reached) {
      if (reached !== point) return;
      await announce({ point: reached, pid: process.pid });
      await waitForTermination();
    },
  });
} else {
  const { acquireInitOwnership } = await import("../../dist/filesystem/ownership.js");
  const acquisition = await acquireInitOwnership(root);
  if (acquisition.kind !== "acquired") throw new Error(`ownership was not acquired: ${acquisition.kind}`);
  await announce({ point: "after-ownership-publication", pid: process.pid });
  await waitForTermination();
}
