"use client";

import React, { useState, useEffect, useRef } from "react";
import { ListFilter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const SQL_COLUMN_TYPE_PRESETS = [
  "VARCHAR(255)",
  "JSONB",
  "TIMESTAMPTZ",
  "UUID",
  "INT",
  "BIGINT",
  "BOOLEAN",
  "TEXT",
  "DECIMAL(10,2)",
  "DATE",
  "TIMESTAMP",
] as const;

export const NOSQL_FIELD_TYPE_PRESETS = [
  "ObjectId",
  "String",
  "Date",
  "Number",
  "Boolean",
  "Array",
  "Object",
  "Binary",
] as const;

export interface DataTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  presets: readonly string[] | string[];
  placeholder?: string;
  className?: string;
}

export function DataTypeSelector({
  value,
  onChange,
  presets,
  placeholder = "Type",
  className = "",
}: DataTypeSelectorProps) {
  const isPresetValue = presets.includes(value);
  // Track explicit user toggle between preset dropdown and custom input
  const [isCustomOverride, setIsCustomOverride] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derived state: if user explicitly toggled, honor that; otherwise custom if value is not in presets
  const isCustom = isCustomOverride !== null ? isCustomOverride : (!isPresetValue && Boolean(value));

  // Focus input when entering custom mode
  useEffect(() => {
    if (isCustom && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCustom]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "__other__") {
      setIsCustomOverride(true);
    } else {
      setIsCustomOverride(false);
      onChange(selected);
    }
  };

  const handleSwitchToPresets = () => {
    setIsCustomOverride(false);
    if (!presets.includes(value)) {
      onChange(presets[0]);
    }
  };

  if (isCustom) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-7 text-xs font-mono flex-1 px-2"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleSwitchToPresets}
          title="Switch to preset types"
          className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer p-0"
        >
          <ListFilter className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        value={isPresetValue ? value : "__other__"}
        onChange={handleSelectChange}
        className="h-7 w-full pl-2 pr-6 text-xs font-mono bg-background border border-border rounded-md text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer truncate"
        title="Select data type or choose Other to type custom"
      >
        {!isPresetValue && <option value="__other__">{value || "Select type..."}</option>}
        {presets.map((preset) => (
          <option key={preset} value={preset} className="bg-popover text-popover-foreground">
            {preset}
          </option>
        ))}
        <option disabled className="bg-popover text-muted-foreground">
          ──────────
        </option>
        <option value="__other__" className="bg-popover text-popover-foreground">
          Other (Custom)...
        </option>
      </select>
      <ChevronDown className="h-3 w-3 text-muted-foreground absolute right-2 pointer-events-none" />
    </div>
  );
}
