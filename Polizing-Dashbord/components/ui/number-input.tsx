"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";

type NumberInputProps = Omit<ComponentProps<"input">, "type">;

/**
 * Input de texto para valores numéricos positivos.
 * - Sin spinner (flechas del teclado no aplican en type="text").
 * - Bloquea el signo negativo, "+" y "e"/"E" por onKeyDown.
 * - Filtra pega (paste) no numérica.
 * - Acepta dígitos y un único punto decimal.
 */
export function NumberInput({
  onKeyDown,
  onPaste,
  ...props
}: NumberInputProps) {
  return (
    <Input
      type="text"
      inputMode="decimal"
      onKeyDown={(e) => {
        if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
        onKeyDown?.(e);
      }}
      onPaste={(e) => {
        const pasted = e.clipboardData.getData("text");
        if (!/^\d*\.?\d*$/.test(pasted)) e.preventDefault();
        onPaste?.(e);
      }}
      {...props}
    />
  );
}
