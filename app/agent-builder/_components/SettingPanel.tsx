"use client";

import React, { useContext, useState, useEffect } from "react";
import { WorkflowContext } from "@/context/WorkflowContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Trash2,
  X,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SettingPanel({
  onSave,
}: {
  onSave: (nodes: any) => void;
}) {
  const {
    selectedNode,
    addedNodes,
    setAddedNodes,
    setSelectedNode,
    nodeEdges,
    setNodeEdges,
  } = useContext(WorkflowContext);

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (selectedNode) {
      const nodeData = selectedNode.data || {};
      const normalizedColumns = (nodeData.columns || []).map((col: any, idx: number) => ({
        ...col,
        id: col.id || `col-${idx}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      }));

      setFormData({
        ...nodeData,
        columns: normalizedColumns,
        name: nodeData.name || nodeData.label || "",
      });
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const nodeType = selectedNode.type || "default";

  const updateNodeData = (updatedFields: any) => {
    const newFormData = { ...formData, ...updatedFields };
    setFormData(newFormData);

    const currentNodes = addedNodes || [];
    const updated = currentNodes.map((n: any) =>
      n.id === selectedNode.id
        ? {
            ...n,
            data: {
              ...n.data,
              ...newFormData,
              label: newFormData.name || n.data?.label,
            },
          }
        : n
    );

    setAddedNodes(updated);
    setSelectedNode({
      ...selectedNode,
      data: {
        ...selectedNode.data,
        ...newFormData,
        label: newFormData.name || selectedNode.data?.label,
      },
    });
    onSave(updated);
  };

  const connectedEdges = (nodeEdges || []).filter(
    (edge: any) => edge.source === selectedNode?.id || edge.target === selectedNode?.id
  );

  const updateEdgeLabel = (edgeId: string, newLabel: string) => {
    setNodeEdges((eds: any) =>
      (eds || []).map((e: any) =>
        e.id === edgeId
          ? {
              ...e,
              label: newLabel.trim() === "" ? undefined : newLabel,
              labelStyle: { fill: "#ffffff", fontWeight: 500, fontSize: 11 },
              labelBgStyle: { fill: "rgba(0, 0, 0, 0.75)", stroke: "#ffffff", strokeWidth: 1 },
              labelBgPadding: [12, 6],
              labelBgBorderRadius: 8,
            }
          : e
      )
    );
  };

  const removeEdge = (edgeId: string) => {
    setNodeEdges((eds: any) => (eds || []).filter((e: any) => e.id !== edgeId));
  };

  const onDeleteNode = () => {
    const currentNodes = addedNodes || [];
    const filtered = currentNodes.filter((node: any) => node.id !== selectedNode.id);
    setAddedNodes(filtered);
    setSelectedNode(null);
    onSave(filtered);
  };

  // Helper for Table Columns
  const addTableColumn = () => {
    const cols = formData.columns ? [...formData.columns] : [];
    const uniqueId = `col-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    cols.push({
      id: uniqueId,
      name: `column_${cols.length + 1}`,
      type: "VARCHAR(255)",
      isPk: false,
      isFk: false,
      isNullable: true,
      isUnique: false,
    });
    updateNodeData({ columns: cols });
  };

  const removeTableColumn = (colId: string, index: number) => {
    const cols = (formData.columns || []).filter((c: any, idx: number) =>
      c.id ? c.id !== colId : idx !== index
    );
    updateNodeData({ columns: cols });
  };

  const updateTableColumn = (colId: string, index: number, patch: any) => {
    const cols = (formData.columns || []).map((c: any, idx: number) => {
      const match = c.id ? c.id === colId : idx === index;
      return match ? { ...c, ...patch } : c;
    });
    updateNodeData({ columns: cols });
  };

  // Helper for NoSQL Collection Fields
  const addCollectionField = () => {
    const fields = formData.fields ? [...formData.fields] : [];
    fields.push({
      name: `field_${fields.length + 1}`,
      type: "String",
      required: false,
    });
    updateNodeData({ fields });
  };

  const removeCollectionField = (index: number) => {
    const fields = (formData.fields || []).filter((_: any, idx: number) => idx !== index);
    updateNodeData({ fields });
  };

  const updateCollectionField = (index: number, patch: any) => {
    const fields = (formData.fields || []).map((f: any, idx: number) =>
      idx === index ? { ...f, ...patch } : f
    );
    updateNodeData({ fields });
  };

  // Helper for Enum Values
  const addEnumValue = () => {
    const values = formData.values ? [...formData.values] : [];
    values.push(`value_${values.length + 1}`);
    updateNodeData({ values });
  };

  const removeEnumValue = (index: number) => {
    const values = (formData.values || []).filter((_: any, idx: number) => idx !== index);
    updateNodeData({ values });
  };

  const updateEnumValue = (index: number, newVal: string) => {
    const values = (formData.values || []).map((v: any, idx: number) =>
      idx === index ? newVal : v
    );
    updateNodeData({ values });
  };

  return (
    <div className="p-4 sm:p-5 bg-card/95 backdrop-blur-md border border-border rounded-xl w-[350px] shadow-2xl max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0.5">
            {nodeType.replace("Node", "")}
          </Badge>
          <h3 className="font-semibold text-sm text-foreground truncate max-w-[170px]">
            {formData.name || selectedNode.id}
          </h3>
        </div>
        <button
          onClick={() => {
            setSelectedNode(null);
            setAddedNodes((nds: any[]) =>
              (nds || []).map((n: any) => (n.selected ? { ...n, selected: false } : n))
            );
          }}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
          title="Close Inspector"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="py-4 space-y-4">
        {/* SQL TABLE INSPECTOR */}
        {nodeType === "SqlTableNode" && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Table Name</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => updateNodeData({ name: e.target.value })}
                  placeholder="e.g. users"
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Schema</Label>
                <Input
                  value={formData.schema || "public"}
                  onChange={(e) => updateNodeData({ schema: e.target.value })}
                  placeholder="public"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">Columns</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={addTableColumn}
                  className="h-6 px-2 text-[11px] gap-1 text-primary cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Add Column
                </Button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {(formData.columns || []).map((col: any, idx: number) => {
                  const itemKey = col.id ? `${col.id}` : `table-col-item-${idx}`;
                  return (
                    <div
                      key={itemKey}
                      className="p-2 rounded-lg bg-muted/40 border border-border/50 space-y-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={col.name || ""}
                          onChange={(e) => updateTableColumn(col.id, idx, { name: e.target.value })}
                          placeholder="Column name"
                          className="h-7 text-xs font-mono flex-1"
                        />
                        <Input
                          value={col.type || ""}
                          onChange={(e) => updateTableColumn(col.id, idx, { type: e.target.value })}
                          placeholder="Type (e.g. UUID)"
                          className="h-7 text-xs font-mono w-28"
                        />
                        <button
                          onClick={() => removeTableColumn(col.id, idx)}
                          className="text-muted-foreground hover:text-rose-500 p-1 rounded cursor-pointer"
                          title="Delete column"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/40">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!col.isPk}
                            onChange={(e) => updateTableColumn(col.id, idx, { isPk: e.target.checked })}
                            className="rounded"
                          />
                          <span className={col.isPk ? "text-amber-500 font-bold" : ""}>PK</span>
                        </label>

                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!col.isFk}
                            onChange={(e) => updateTableColumn(col.id, idx, { isFk: e.target.checked })}
                            className="rounded"
                          />
                          <span className={col.isFk ? "text-sky-500 font-bold" : ""}>FK</span>
                        </label>

                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!col.isNullable}
                            onChange={(e) => updateTableColumn(col.id, idx, { isNullable: e.target.checked })}
                            className="rounded"
                          />
                          <span>NULL</span>
                        </label>

                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!col.isUnique}
                            onChange={(e) => updateTableColumn(col.id, idx, { isUnique: e.target.checked })}
                            className="rounded"
                          />
                          <span>UNIQUE</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Comment / Note</Label>
              <Input
                value={formData.comment || ""}
                onChange={(e) => updateNodeData({ comment: e.target.value })}
                placeholder="Optional table comment..."
                className="h-8 text-xs"
              />
            </div>
          </div>
        )}

        {/* SQL VIEW INSPECTOR */}
        {nodeType === "SqlViewNode" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">View Name</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => updateNodeData({ name: e.target.value })}
                placeholder="e.g. v_active_users"
                className="h-8 text-xs font-mono"
              />
            </div>

            <label className="flex items-center gap-2 text-xs cursor-pointer font-mono text-foreground">
              <input
                type="checkbox"
                checked={!!formData.isMaterialized}
                onChange={(e) => updateNodeData({ isMaterialized: e.target.checked })}
                className="rounded"
              />
              <span>Materialized View</span>
            </label>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">SQL Query Definition</Label>
              <Textarea
                value={formData.query || ""}
                onChange={(e) => updateNodeData({ query: e.target.value })}
                placeholder="SELECT ... FROM ...;"
                rows={5}
                className="text-xs font-mono"
              />
            </div>
          </div>
        )}

        {/* SQL INDEX INSPECTOR */}
        {nodeType === "SqlIndexNode" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Index Name</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => updateNodeData({ name: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Target Table</Label>
              <Input
                value={formData.tableName || ""}
                onChange={(e) => updateNodeData({ tableName: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Index Method / Type</Label>
              <Input
                value={formData.indexType || "B-TREE"}
                onChange={(e) => updateNodeData({ indexType: e.target.value })}
                placeholder="B-TREE, HASH, GIN, GIST, UNIQUE"
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Indexed Columns (comma-separated)</Label>
              <Input
                value={(formData.columns || []).join(", ")}
                onChange={(e) =>
                  updateNodeData({
                    columns: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="e.g. email ASC, status DESC"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        )}

        {/* SQL FUNCTION INSPECTOR */}
        {nodeType === "SqlFunctionNode" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Function Name</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => updateNodeData({ name: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Language</Label>
                <Input
                  value={formData.language || "plpgsql"}
                  onChange={(e) => updateNodeData({ language: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Return Type</Label>
                <Input
                  value={formData.returnType || "NUMERIC"}
                  onChange={(e) => updateNodeData({ returnType: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* SQL TRIGGER INSPECTOR */}
        {nodeType === "SqlTriggerNode" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Trigger Name</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => updateNodeData({ name: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Target Table</Label>
              <Input
                value={formData.tableName || ""}
                onChange={(e) => updateNodeData({ tableName: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Timing</Label>
              <Input
                value={formData.timing || "BEFORE"}
                onChange={(e) => updateNodeData({ timing: e.target.value })}
                placeholder="BEFORE, AFTER, INSTEAD OF"
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Executes Function</Label>
              <Input
                value={formData.functionName || ""}
                onChange={(e) => updateNodeData({ functionName: e.target.value })}
                placeholder="function_name()"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        )}

        {/* SQL ENUM INSPECTOR */}
        {nodeType === "SqlEnumNode" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Enum Type Name</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => updateNodeData({ name: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">Allowed Values</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={addEnumValue}
                  className="h-6 px-2 text-[11px] gap-1 text-primary cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Add Value
                </Button>
              </div>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                {(formData.values || []).map((val: string, idx: number) => (
                  <div key={`val-${idx}`} className="flex items-center gap-1.5">
                    <Input
                      value={val}
                      onChange={(e) => updateEnumValue(idx, e.target.value)}
                      className="h-7 text-xs font-mono flex-1"
                    />
                    <button
                      onClick={() => removeEnumValue(idx)}
                      className="text-muted-foreground hover:text-rose-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NOSQL COLLECTION INSPECTOR */}
        {nodeType === "NosqlCollectionNode" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Collection Name</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => updateNodeData({ name: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Database</Label>
              <Input
                value={formData.database || ""}
                onChange={(e) => updateNodeData({ database: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Shard Key (Optional)</Label>
              <Input
                value={formData.shardKey || ""}
                onChange={(e) => updateNodeData({ shardKey: e.target.value })}
                placeholder="e.g. _id: hashed"
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">Document Fields</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={addCollectionField}
                  className="h-6 px-2 text-[11px] gap-1 text-primary cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Add Field
                </Button>
              </div>

              <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                {(formData.fields || []).map((f: any, idx: number) => (
                  <div key={`nosql-field-${idx}`} className="flex items-center gap-1.5">
                    <Input
                      value={f.name}
                      onChange={(e) => updateCollectionField(idx, { name: e.target.value })}
                      placeholder="Field name"
                      className="h-7 text-xs font-mono flex-1"
                    />
                    <Input
                      value={f.type}
                      onChange={(e) => updateCollectionField(idx, { type: e.target.value })}
                      placeholder="Type"
                      className="h-7 text-xs font-mono w-24"
                    />
                    <button
                      onClick={() => removeCollectionField(idx)}
                      className="text-muted-foreground hover:text-rose-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NOSQL DOCUMENT INSPECTOR */}
        {nodeType === "NosqlDocumentNode" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Document Identifier / Name</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => updateNodeData({ name: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Collection</Label>
              <Input
                value={formData.collectionName || ""}
                onChange={(e) => updateNodeData({ collectionName: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">JSON / BSON Sample</Label>
              <Textarea
                value={formData.sampleJson || ""}
                onChange={(e) => updateNodeData({ sampleJson: e.target.value })}
                rows={6}
                className="text-xs font-mono"
              />
            </div>
          </div>
        )}

        {/* NOSQL REFERENCE INSPECTOR */}
        {nodeType === "NosqlReferenceNode" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Reference Name</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => updateNodeData({ name: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">From Collection</Label>
                <Input
                  value={formData.fromCollection || ""}
                  onChange={(e) => updateNodeData({ fromCollection: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">From Field</Label>
                <Input
                  value={formData.fromField || ""}
                  onChange={(e) => updateNodeData({ fromField: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To Collection</Label>
                <Input
                  value={formData.toCollection || ""}
                  onChange={(e) => updateNodeData({ toCollection: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To Field</Label>
                <Input
                  value={formData.toField || ""}
                  onChange={(e) => updateNodeData({ toField: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Cardinality</Label>
              <Input
                value={formData.cardinality || "1:N"}
                onChange={(e) => updateNodeData({ cardinality: e.target.value })}
                placeholder="1:1, 1:N, N:M"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        )}

        {/* SHARED NOTE INSPECTOR */}
        {nodeType === "DbNoteNode" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Note Color</Label>
              <div className="flex gap-2">
                {(["yellow", "blue", "green", "purple", "slate"] as const).map((c) => (
                  <button
                    key={`color-${c}`}
                    onClick={() => updateNodeData({ color: c })}
                    className={`h-6 w-6 rounded-full border-2 transition-transform ${
                      formData.color === c ? "scale-110 border-primary" : "border-transparent"
                    } ${
                      c === "yellow"
                        ? "bg-amber-300"
                        : c === "blue"
                        ? "bg-sky-400"
                        : c === "green"
                        ? "bg-emerald-400"
                        : c === "purple"
                        ? "bg-purple-400"
                        : "bg-zinc-400"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Note Content</Label>
              <Textarea
                value={formData.text || ""}
                onChange={(e) => updateNodeData({ text: e.target.value })}
                rows={6}
                className="text-xs leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* SHARED DATABASE / SCHEMA INSPECTOR */}
        {nodeType === "DbSchemaNode" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Database / Schema Name</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => updateNodeData({ name: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Engine / Dialect</Label>
              <Input
                value={formData.engine || ""}
                onChange={(e) => updateNodeData({ engine: e.target.value })}
                placeholder="PostgreSQL, MySQL, SQLite, MongoDB..."
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Charset</Label>
                <Input
                  value={formData.charset || "UTF-8"}
                  onChange={(e) => updateNodeData({ charset: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Collation</Label>
                <Input
                  value={formData.collation || "en_US.UTF-8"}
                  onChange={(e) => updateNodeData({ collation: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Generic Fallback for other nodes */}
        {![
          "SqlTableNode",
          "SqlViewNode",
          "SqlIndexNode",
          "SqlFunctionNode",
          "SqlTriggerNode",
          "SqlEnumNode",
          "NosqlCollectionNode",
          "NosqlDocumentNode",
          "NosqlReferenceNode",
          "DbNoteNode",
          "DbSchemaNode",
        ].includes(nodeType) && (
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Object Name</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => updateNodeData({ name: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        )}

        {/* Connected Line Labels Section */}
        {connectedEdges.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Connection Line Labels ({connectedEdges.length})
              </Label>
              <span className="text-[10px] text-muted-foreground">Type to show on line</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {connectedEdges.map((edge: any) => {
                const isSource = edge.source === selectedNode.id;
                const otherNodeId = isSource ? edge.target : edge.source;
                const otherNode = (addedNodes || []).find((n: any) => n.id === otherNodeId);
                const otherNodeName =
                  otherNode?.data?.name || otherNode?.data?.label || otherNodeId;

                return (
                  <div
                    key={edge.id}
                    className="p-2.5 rounded-lg bg-zinc-950/60 border border-white/10 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-medium text-zinc-300 truncate max-w-[170px]">
                        {isSource ? `→ To: ${otherNodeName}` : `← From: ${otherNodeName}`}
                      </span>
                      <button
                        onClick={() => removeEdge(edge.id)}
                        className="text-zinc-500 hover:text-red-400 p-0.5 rounded cursor-pointer transition-colors"
                        title="Disconnect line"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    <Input
                      placeholder="Type text (e.g. 1:N, Sends Token, API...)"
                      value={edge.label || ""}
                      onChange={(e) => updateEdgeLabel(edge.id, e.target.value)}
                      className="h-7 text-xs bg-black/60 border-white/15 focus:border-emerald-500 font-mono text-white placeholder:text-zinc-600"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Node ID & Technical metadata */}
        <div className="pt-2 text-[11px] text-muted-foreground space-y-1 border-t border-border/50">
          <div className="flex justify-between">
            <span>Node ID:</span>
            <span className="font-mono text-foreground truncate max-w-[170px]">{selectedNode.id}</span>
          </div>
          <div className="flex justify-between">
            <span>ReactFlow Type:</span>
            <span className="font-mono text-foreground">{nodeType}</span>
          </div>
        </div>
      </div>

      {/* Delete Node Action */}
      <Button
        variant="destructive"
        size="sm"
        onClick={onDeleteNode}
        className="w-full gap-2 cursor-pointer mt-2"
      >
        <Trash2 className="h-4 w-4" />
        Delete Database Object
      </Button>
    </div>
  );
}
