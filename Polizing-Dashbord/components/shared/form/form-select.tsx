"use client";

import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "./field";

export type FormSelectOption = {
  value: string;
  label: string;
};

type FormSelectProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: ReadonlyArray<FormSelectOption>;
  required?: boolean;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  options,
  required,
  error,
  placeholder,
  disabled,
  className,
}: FormSelectProps<T>) {
  return (
    <Field label={label} required={required} error={error} className={className}>
      <Controller
        control={control}
        name={name}
        rules={required ? { required: "Requerido" } : undefined}
        render={({ field }) => (
          <Select
            value={field.value || ""}
            onValueChange={field.onChange}
            disabled={disabled}
            items={options}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  );
}
