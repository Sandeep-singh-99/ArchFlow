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
  Maximize2,
  Unlink,
  Layers,
  Shield,
  CreditCard,
  Package,
  Users,
  Bell,
  BarChart3,
  Check,
  FolderTree,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DOMAIN_THEMES,
  DomainColorTheme,
  getDomainTheme,
} from "@/lib/domainThemes";
import { isDomainGroupNode } from "@/lib/autoLayout";
import { toast } from "sonner";

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

  // List of all domain nodes currently on canvas
  const domainNodes = (addedNodes || []).filter(isDomainGroupNode);

  // For a domain node, get its member tables
  const domainMembers = isDomainGroupNode(selectedNode)
    ? (addedNodes || []).filter(
        (n: any) => n.parentId === selectedNode.id || n.data?.domainId === selectedNode.id
      )
    : [];

  // Function to assign or remove current table from a domain container
  const handleAssignDomain = (targetDomainId: string) => {
    if (!selectedNode) return;

    if (!targetDomainId || targetDomainId === "none") {
      // Remove from domain container
      const currentParent = (addedNodes || []).find((n: any) => n.id === selectedNode.parentId);
      const parentX = currentParent?.position?.x || 0;
      const parentY = currentParent?.position?.y || 0;

      const updated = (addedNodes || []).map((n: any) => {
        if (n.id === selectedNode.id) {
          const { parentId, ...rest } = n;
          return {
            ...rest,
            position: {
              x: parentX + (n.position?.x || 0),
              y: parentY + (n.position?.y || 0),
            },
            data: {
              ...(n.data || {}),
              domainId: undefined,
              domainName: undefined,
              domainTheme: undefined,
            },
          };
        }
        return n;
      });

      setAddedNodes(updated);
      setSelectedNode({
        ...selectedNode,
        parentId: undefined,
        data: {
          ...selectedNode.data,
          domainId: undefined,
          domainName: undefined,
          domainTheme: undefined,
        },
      });
      onSave(updated);
      toast.info(`Removed "${formData.name || selectedNode.id}" from domain container`);
      return;
    }

    // Assigning to a target domain container
    const targetDomain = (addedNodes || []).find((n: any) => n.id === targetDomainId);
    if (!targetDomain) return;

    // Calculate relative coordinates
    const currentParent = selectedNode.parentId
      ? (addedNodes || []).find((n: any) => n.id === selectedNode.parentId)
      : null;
    const absX = (currentParent?.position?.x || 0) + (selectedNode.position?.x || 0);
    const absY = (currentParent?.position?.y || 0) + (selectedNode.position?.y || 0);

    const relX = absX - targetDomain.position.x;
    const relY = absY - targetDomain.position.y;

    const domainName = targetDomain.data?.name || targetDomain.data?.label || "Domain";
    const domainTheme = targetDomain.data?.colorTheme || "indigo";

    // Reorder so targetDomain is before the table node
    const otherNodes = (addedNodes || []).filter(
      (n: any) => n.id !== selectedNode.id && n.id !== targetDomain.id
    );

    const updatedNode = {
      ...selectedNode,
      parentId: targetDomain.id,
      position: { x: relX, y: relY },
      data: {
        ...selectedNode.data,
        domainId: targetDomain.id,
        domainName: domainName,
        domainTheme: domainTheme,
      },
    };

    const newNodesList = [
      targetDomain,
      ...otherNodes.filter((n: any) => isDomainGroupNode(n)),
      ...otherNodes.filter((n: any) => !isDomainGroupNode(n)),
      updatedNode,
    ];

    setAddedNodes(newNodesList);
    setSelectedNode(updatedNode);
    onSave(newNodesList);
    toast.success(`Assigned to "${domainName}" domain boundary`);
  };

  // Auto-fit domain container boundary around all its member tables
  const handleFitDomainToChildren = () => {
    if (!selectedNode || !isDomainGroupNode(selectedNode)) return;
    if (domainMembers.length === 0) {
      toast.info("No tables currently inside this domain boundary");
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    domainMembers.forEach((node: any) => {
      const posX = node.position.x;
      const posY = node.position.y;
      const w = node.measured?.width || node.width || 300;
      const h = node.measured?.height || node.height || 200;

      minX = Math.min(minX, posX);
      minY = Math.min(minY, posY);
      maxX = Math.max(maxX, posX + w);
      maxY = Math.max(maxY, posY + h);
    });

    const padding = 45;
    const newWidth = Math.max(360, maxX + padding);
    const newHeight = Math.max(240, maxY + padding);

    const updated = (addedNodes || []).map((n: any) =>
      n.id === selectedNode.id
        ? {
            ...n,
            style: {
              ...(n.style || {}),
              width: newWidth,
              height: newHeight,
            },
          }
        : n
    );

    setAddedNodes(updated);
    setSelectedNode({
      ...selectedNode,
      style: {
        ...(selectedNode.style || {}),
        width: newWidth,
        height: newHeight,
      },
    });
    onSave(updated);
    toast.success(`Domain boundary resized to wrap ${domainMembers.length} tables`);
  };

  // Ungroup: detach all child tables back to absolute canvas coordinates and remove container
  const handleUngroupDomain = () => {
    if (!selectedNode || !isDomainGroupNode(selectedNode)) return;
    const groupX = selectedNode.position?.x || 0;
    const groupY = selectedNode.position?.y || 0;

    const updated = (addedNodes || [])
      .map((n: any) => {
        if (n.parentId === selectedNode.id || n.data?.domainId === selectedNode.id) {
          const { parentId, ...rest } = n;
          return {
            ...rest,
            position: {
              x: groupX + (n.position?.x || 0),
              y: groupY + (n.position?.y || 0),
            },
            data: {
              ...(n.data || {}),
              domainId: undefined,
              domainName: undefined,
              domainTheme: undefined,
            },
          };
        }
        return n;
      })
      .filter((n: any) => n.id !== selectedNode.id);

    setAddedNodes(updated);
    setSelectedNode(null);
    onSave(updated);
    toast.info(`Ungrouped domain "${formData.name || selectedNode.id}"`);
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
        {/* DOMAIN SUBGRAPH CONTAINER INSPECTOR */}
        {isDomainGroupNode(selectedNode) && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Domain Name</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => updateNodeData({ name: e.target.value })}
                placeholder="e.g. Auth & Security, Billing & Invoicing"
                className="h-8 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Description / Notes</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => updateNodeData({ description: e.target.value })}
                placeholder="Domain responsibilities and bounded context..."
                className="text-xs resize-none h-16"
              />
            </div>

            {/* Color Theme Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Color Theme</span>
                <span className="capitalize font-mono text-[10px] text-muted-foreground">
                  {formData.colorTheme || "indigo"}
                </span>
              </Label>
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.keys(DOMAIN_THEMES) as DomainColorTheme[]).map((themeKey) => {
                  const cfg = DOMAIN_THEMES[themeKey];
                  const isCurrent = (formData.colorTheme || "indigo") === themeKey;
                  return (
                    <button
                      key={themeKey}
                      type="button"
                      onClick={() => updateNodeData({ colorTheme: themeKey })}
                      className={`h-7 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isCurrent
                          ? "ring-2 ring-foreground font-semibold shadow-xs"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      style={{
                        backgroundColor: `${cfg.accent}18`,
                        borderColor: cfg.accent,
                        color: cfg.accent,
                      }}
                    >
                      {isCurrent && <Check className="h-3 w-3" />}
                      <span className="capitalize">{themeKey}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Icon Picker */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Domain Icon</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { name: "Shield", label: "Security", icon: Shield },
                  { name: "CreditCard", label: "Billing", icon: CreditCard },
                  { name: "Package", label: "Catalog", icon: Package },
                  { name: "Users", label: "Users", icon: Users },
                  { name: "Bell", label: "Comms", icon: Bell },
                  { name: "BarChart3", label: "Metrics", icon: BarChart3 },
                  { name: "Layers", label: "Layers", icon: Layers },
                  { name: "FolderTree", label: "Cluster", icon: FolderTree },
                ].map(({ name, label, icon: Icon }) => {
                  const isCurrent = (formData.icon || "Layers") === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => updateNodeData({ icon: name })}
                      className={`h-8 rounded-lg border flex flex-col items-center justify-center text-[9px] gap-0.5 cursor-pointer transition-all ${
                        isCurrent
                          ? "bg-primary/15 border-primary text-primary font-semibold ring-1 ring-primary/40"
                          : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Member Tables in Domain */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>Enclosed Tables ({domainMembers.length})</span>
                </Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleFitDomainToChildren}
                  className="h-6 px-2 text-[10px] gap-1 text-primary cursor-pointer hover:bg-primary/10"
                >
                  <Maximize2 className="h-3 w-3" /> Fit Bounds
                </Button>
              </div>

              {domainMembers.length === 0 ? (
                <div className="p-3 rounded-lg border border-dashed border-border/60 text-center text-xs text-muted-foreground">
                  No tables inside this domain yet. Drag tables inside or assign them via Table Inspector.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {domainMembers.map((member: any) => (
                    <div
                      key={member.id}
                      className="px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-between text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedNode(member)}
                        className="font-mono text-foreground hover:text-primary font-medium truncate max-w-[190px] text-left cursor-pointer"
                        title="Click to inspect this table"
                      >
                        {member.data?.name || member.data?.label || member.id}
                      </button>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {member.type?.replace("Node", "") || "Table"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ungroup Container Action */}
            <div className="pt-2 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUngroupDomain}
                className="w-full text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <Unlink className="h-3.5 w-3.5" />
                Ungroup Domain (Keep Tables)
              </Button>
            </div>
          </div>
        )}

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

            {/* Domain Subgraph Boundary Assignment */}
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <Label className="text-xs text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Domain Container
                </span>
                {selectedNode.parentId && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-primary/30 text-primary">
                    Enclosed
                  </Badge>
                )}
              </Label>
              <select
                value={selectedNode.parentId || formData.domainId || "none"}
                onChange={(e) => handleAssignDomain(e.target.value)}
                className="w-full h-8 px-2 rounded-lg bg-background border border-border text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="none">None (Standalone / Ungrouped)</option>
                {domainNodes.map((dom: any) => (
                  <option key={dom.id} value={dom.id}>
                    🏷️ {dom.data?.name || dom.data?.label || dom.id}
                  </option>
                ))}
              </select>
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

            {/* Domain Subgraph Boundary Assignment */}
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <Label className="text-xs text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Domain Container
                </span>
                {selectedNode.parentId && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-primary/30 text-primary">
                    Enclosed
                  </Badge>
                )}
              </Label>
              <select
                value={selectedNode.parentId || formData.domainId || "none"}
                onChange={(e) => handleAssignDomain(e.target.value)}
                className="w-full h-8 px-2 rounded-lg bg-background border border-border text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="none">None (Standalone / Ungrouped)</option>
                {domainNodes.map((dom: any) => (
                  <option key={dom.id} value={dom.id}>
                    🏷️ {dom.data?.name || dom.data?.label || dom.id}
                  </option>
                ))}
              </select>
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

        {/* SHARED TEXT NODE INSPECTOR */}
        {(nodeType === "TextNode" || nodeType === "Text") && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Text Content</Label>
              <Textarea
                value={formData.text || ""}
                onChange={(e) =>
                  updateNodeData({
                    text: e.target.value,
                    name: e.target.value.slice(0, 30),
                    label: e.target.value.slice(0, 30),
                  })
                }
                rows={4}
                placeholder="Enter text..."
                className="text-xs leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Font Size</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: "sm", label: "S", desc: "14px" },
                  { id: "base", label: "M", desc: "20px" },
                  { id: "lg", label: "L", desc: "30px" },
                  { id: "xl", label: "XL", desc: "42px" },
                  { id: "2xl", label: "2XL", desc: "56px" },
                ].map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    title={`${size.label} (${size.desc})`}
                    onClick={() => updateNodeData({ fontSize: size.id })}
                    className={`py-1.5 px-1 rounded-md border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      (formData.fontSize || "base") === size.id
                        ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs scale-105"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/60 hover:text-foreground"
                    }`}
                  >
                    <span className="text-xs font-semibold">{size.label}</span>
                    <span className="text-[9px] font-mono opacity-70">{size.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Text Color</Label>
              <div className="flex items-center gap-1.5">
                {[
                  { id: "default", color: "bg-foreground", title: "Default" },
                  { id: "muted", color: "bg-muted-foreground", title: "Muted" },
                  { id: "blue", color: "bg-sky-500", title: "Sky Blue" },
                  { id: "emerald", color: "bg-emerald-500", title: "Emerald" },
                  { id: "amber", color: "bg-amber-500", title: "Amber" },
                  { id: "purple", color: "bg-purple-500", title: "Purple" },
                  { id: "rose", color: "bg-rose-500", title: "Rose" },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.title}
                    onClick={() => updateNodeData({ color: c.id })}
                    className={`h-5 w-5 rounded-full border-2 transition-transform cursor-pointer ${
                      (formData.color || "default") === c.id
                        ? "scale-125 border-primary ring-1 ring-primary/40"
                        : "border-transparent opacity-80 hover:opacity-100"
                    } ${c.color}`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Format</Label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => updateNodeData({ isBold: !formData.isBold })}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer font-bold ${
                      formData.isBold
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground border-border/60"
                    }`}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => updateNodeData({ isItalic: !formData.isItalic })}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer italic font-serif ${
                      formData.isItalic
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground border-border/60"
                    }`}
                  >
                    I
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Card Background</Label>
                <button
                  type="button"
                  onClick={() => updateNodeData({ hasBackground: !formData.hasBackground })}
                  className={`w-full py-1 text-xs rounded border transition-colors cursor-pointer font-medium ${
                    formData.hasBackground
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground border-border/60"
                  }`}
                >
                  {formData.hasBackground ? "Enabled" : "Transparent"}
                </button>
              </div>
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
          "TextNode",
          "Text",
          "DomainGroupNode",
          "DomainGroup",
          "domainGroup",
          "group",
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
