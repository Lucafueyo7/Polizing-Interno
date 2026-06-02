"use client";

import { useMemo, useState } from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import {
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxPopup,
  ComboboxRoot,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { Field } from "./field";

export type FormComboboxOption = {
  value: string;
  label: string;
};

type FormComboboxProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: ReadonlyArray<FormComboboxOption>;
  required?: boolean;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

function scoreOption(label: string, query: string): number {
  const l = label.toLowerCase();
  const q = query.toLowerCase();
  if (l === q) return 3;
  if (l.startsWith(q)) return 2;
  if (l.includes(q)) return 1;
  return 0;
}

export function FormCombobox<T extends FieldValues>({
  control,
  name,
  label,
  options,
  required,
  error,
  placeholder = "Buscar...",
  disabled,
  className,
}: FormComboboxProps<T>) {
  const [query, setQuery] = useState("");

  const filtered = useMemo<FormComboboxOption[]>(() => {
    const q = query.trim();
    if (!q) return (options as FormComboboxOption[]).slice(0, 10);
    const scored = (options as FormComboboxOption[])
      .map((o) => ({ ...o, score: scoreOption(o.label, q) }))
      .filter((o) => o.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, 10);
  }, [query, options]);

  return (
    <Field label={label} required={required} error={error} className={className}>
      <Controller
        control={control}
        name={name}
        rules={required ? { required: "Requerido" } : undefined}
        render={({ field }) => {
          // Lookup the full option object so Base UI can display the label.
          // Base UI auto-uses obj.label when value is a {value, label} object.
          const selectedOption =
            (options as FormComboboxOption[]).find(
              (o) => o.value === field.value,
            ) ?? null;

          return (
            <div className="w-full">
            <ComboboxRoot
              value={selectedOption}
              onValueChange={(val: FormComboboxOption | null) =>
                field.onChange(val?.value ?? "")
              }
              onInputValueChange={(val: string) => setQuery(val)}
              isItemEqualToValue={(
                a: FormComboboxOption,
                b: FormComboboxOption,
              ) => a?.value === b?.value}
              filter={() => true}
              disabled={disabled}
            >
              <ComboboxInputGroup>
                <ComboboxInput placeholder={placeholder} />
                <ComboboxTrigger />
              </ComboboxInputGroup>
              <ComboboxPopup>
                {filtered.length === 0 ? (
                  <ComboboxEmpty>Sin resultados</ComboboxEmpty>
                ) : (
                  filtered.map((opt) => (
                    <ComboboxItem key={opt.value} value={opt}>
                      {opt.label}
                    </ComboboxItem>
                  ))
                )}
              </ComboboxPopup>
            </ComboboxRoot>
            </div>
          );
        }}
      />
    </Field>
  );
}
