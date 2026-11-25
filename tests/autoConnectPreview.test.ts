import assert from "node:assert/strict";
import test from "node:test";
import type { Node } from "@xyflow/react";
import { restoreSqlColumnStrings, stripAiPreviewFlags } from "@/lib/ai/autoConnectPreview";

const baseNode = { id: "node", position: { x: 0, y: 0 } };

test("applying an AI preview preserves SQL column strings and strips flags from records", () => {
  const index: Node = {
    ...baseNode,
    type: "SqlIndexNode",
    data: { columns: ["email ASC"], isAiProposed: true },
  };
  const table: Node = {
    ...baseNode,
    type: "SqlTableNode",
    data: { columns: [{ name: "email", type: "TEXT", isAiProposed: true }] },
  };
  const { nodes } = stripAiPreviewFlags([index, table], []);

  assert.deepEqual(nodes[0].data, { columns: ["email ASC"] });
  assert.deepEqual(nodes[1].data, { columns: [{ name: "email", type: "TEXT" }] });
});

test("reopening a workspace restores column strings corrupted by older previews", () => {
  const savedColumns = [Object.assign({}, "email ASC"), "id", Object.assign({}, "🧪")];

  for (const type of ["SqlIndexNode", "SqlViewNode", "Index", "View"]) {
    const saved: Node = { ...baseNode, type, data: { columns: savedColumns } };
    const restored = restoreSqlColumnStrings(saved);

    assert.deepEqual(restored.data.columns, ["email ASC", "id", "🧪"]);
    assert.strictEqual(restoreSqlColumnStrings(restored), restored);
  }
});
