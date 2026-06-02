"use client";

import { useEffect, useState } from "react";
import { fmtDate, parseDmyToIso } from "@/lib/format/date";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DateInputProps = {
  value?: string;       // ISO yyyy-mm-dd (RHF controlled)
  onChange?: (iso: string) => void;
  onBlur?: () => void;
  name?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function DateInput({
  value = "",
  onChange,
  onBlur,
  name,
  placeholder = "DD/MM/YYYY",
  className,
  disabled,
}: DateInputProps) {
  const [display, setDisplay] = useState(() => (value ? fmtDate(value) : ""));

  // Sync when external value changes (form reset / edit prefill)
  useEffect(() => {
    setDisplay(value ? fmtDate(value) : "");
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    let masked = digits;
    if (digits.length > 4) {
      masked = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      masked = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setDisplay(masked);

    if (digits.length === 8) {
      const iso = parseDmyToIso(masked);
      if (iso) onChange?.(iso);
    } else if (digits.length === 0) {
      onChange?.("");
    }
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      name={name}
      value={display}
      onChange={handleChange}
      onBlur={onBlur}
      placeholder={placeholder}
      className={cn("font-mono", className)}
      disabled={disabled}
    />
  );
}
