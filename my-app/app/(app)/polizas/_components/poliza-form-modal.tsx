"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { Check } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TODAY_ISO } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/ui/toast";
import type { PolizaFormRefs, PolizaFull } from "@/lib/data/types";
import { createPoliza } from "../_actions/create-poliza";
import { updatePoliza } from "../_actions/update-poliza";
import type { PolizaInput } from "../_actions/schemas";

type Mode =
  | { mode: "create"; refs: PolizaFormRefs; newForCliente?: number }
  | { mode: "edit"; refs: PolizaFormRefs; poliza: PolizaFull };

type Cobertura =
  | "responsabilidad_civil"
  | "terceros_completo"
  | "todo_riesgo"
  | "basica"
  | "integral";

type Estado = "vigente" | "proxima" | "vencida" | "anulada" | "renovada";

const COBERTURA_LABELS: Record<Cobertura, string> = {
  responsabilidad_civil: "Responsabilidad Civil",
  terceros_completo: "Terceros Completo",
  todo_riesgo: "Todo Riesgo",
  basica: "Básica",
  integral: "Integral",
};

const ESTADOS: ReadonlyArray<{ value: Estado; label: string }> = [
  { value: "vigente", label: "Vigente" },
  { value: "proxima", label: "Próx. a vencer" },
  { value: "renovada", label: "Renovada" },
  { value: "vencida", label: "Vencida" },
  { value: "anulada", label: "Anulada" },
];

type FormShape = {
  numero: string;
  clienteId: string;
  aseguradoraId: string;
  tipoSeguroId: string;
  cobertura: Cobertura;
  estado: Estado;
  fechaEmision: string;
  fechaInicio: string;
  fechaFin: string;
  sumaAsegurada: string;
  primaMensual: string;
};

function emptyForm(opts: { newForCliente?: number; defaultTipoId?: number }): FormShape {
  return {
    numero: "",
    clienteId: opts.newForCliente ? String(opts.newForCliente) : "",
    aseguradoraId: "",
    tipoSeguroId: opts.defaultTipoId ? String(opts.defaultTipoId) : "",
    cobertura: "todo_riesgo",
    estado: "vigente",
    fechaEmision: TODAY_ISO,
    fechaInicio: "",
    fechaFin: "",
    sumaAsegurada: "",
    primaMensual: "",
  };
}

function defaultsFromPoliza(p: PolizaFull): FormShape {
  return {
    numero: p.numero,
    clienteId: String(p.cliente.id),
    aseguradoraId: String(p.aseguradora.id),
    tipoSeguroId: String(p.tipoSeguroId),
    cobertura: p.cobertura,
    estado: p.estado,
    fechaEmision: p.emision,
    fechaInicio: p.inicio,
    fechaFin: p.fin,
    sumaAsegurada: String(p.suma),
    primaMensual: String(p.prima),
  };
}

function toInput(values: FormShape): PolizaInput {
  return {
    numero: values.numero,
    clienteId: Number(values.clienteId),
    aseguradoraId: Number(values.aseguradoraId),
    tipoSeguroId: Number(values.tipoSeguroId),
    cobertura: values.cobertura,
    estado: values.estado,
    fechaEmision: values.fechaEmision,
    fechaInicio: values.fechaInicio,
    fechaFin: values.fechaFin,
    sumaAsegurada: Number(values.sumaAsegurada),
    primaMensual: Number(values.primaMensual),
  };
}

export function PolizaFormModal(props: Mode) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(true);

  const form = useForm<FormShape>({
    defaultValues: isEdit
      ? defaultsFromPoliza(props.poliza)
      : emptyForm({
          newForCliente: props.newForCliente,
          defaultTipoId: props.refs.tiposSeguro[0]?.id,
        }),
  });

  const close = () => {
    setOpen(false);
    startTransition(() => {
      router.push(isEdit ? `/polizas/${props.poliza.id}` : "/polizas");
    });
  };

  const onSubmit: SubmitHandler<FormShape> = (values) => {
    const input = toInput(values);
    startTransition(async () => {
      const result = isEdit
        ? await updatePoliza(props.poliza.id, input)
        : await createPoliza(input);

      if (!result.ok) {
        toastError(result.error);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof FormShape, {
              type: "server",
              message: messages?.[0] ?? "Inválido",
            });
          }
        }
        return;
      }

      toastSuccess(
        isEdit ? "Póliza actualizada" : "Póliza creada correctamente",
      );
      setOpen(false);
      router.push(`/polizas/${result.id}`);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent className="sm:max-w-[760px] max-w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar póliza" : "Registrar póliza"}
          </DialogTitle>
          <DialogDescription>
            Vinculá un cliente y una aseguradora, y completá los datos de
            cobertura.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 mt-2"
          noValidate
        >
          <SectionLabel>Vinculación</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Cliente"
              required
              error={form.formState.errors.clienteId?.message}
            >
              <Controller
                control={form.control}
                name="clienteId"
                rules={{ required: "Requerido" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente…" />
                    </SelectTrigger>
                    <SelectContent>
                      {props.refs.clientes.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.label} · {c.ident}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field
              label="Aseguradora"
              required
              error={form.formState.errors.aseguradoraId?.message}
            >
              <Controller
                control={form.control}
                name="aseguradoraId"
                rules={{ required: "Requerido" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar aseguradora…" />
                    </SelectTrigger>
                    <SelectContent>
                      {props.refs.aseguradoras.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.razonSocial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <SectionLabel>Datos de la póliza</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="N° de póliza"
              required
              error={form.formState.errors.numero?.message}
            >
              <Input
                {...form.register("numero", { required: "Requerido" })}
                placeholder="AUT-918274"
                className="font-mono"
              />
            </Field>
            <Field
              label="Tipo de seguro"
              required
              error={form.formState.errors.tipoSeguroId?.message}
            >
              <Controller
                control={form.control}
                name="tipoSeguroId"
                rules={{ required: "Requerido" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {props.refs.tiposSeguro.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field
              label="Cobertura"
              required
              className="col-span-2"
              error={form.formState.errors.cobertura?.message}
            >
              <Controller
                control={form.control}
                name="cobertura"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as Cobertura)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(COBERTURA_LABELS) as Cobertura[]).map(
                        (k) => (
                          <SelectItem key={k} value={k}>
                            {COBERTURA_LABELS[k]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <SectionLabel>Vigencia</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Fecha de emisión"
              required
              error={form.formState.errors.fechaEmision?.message}
            >
              <Input
                type="date"
                {...form.register("fechaEmision", { required: "Requerido" })}
                className="font-mono"
              />
            </Field>
            <Field
              label="Estado"
              required
              error={form.formState.errors.estado?.message}
            >
              <Controller
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as Estado)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field
              label="Inicio de vigencia"
              required
              error={form.formState.errors.fechaInicio?.message}
            >
              <Input
                type="date"
                {...form.register("fechaInicio", { required: "Requerido" })}
                className="font-mono"
              />
            </Field>
            <Field
              label="Fin de vigencia"
              required
              error={form.formState.errors.fechaFin?.message}
            >
              <Input
                type="date"
                {...form.register("fechaFin", { required: "Requerido" })}
                className="font-mono"
              />
            </Field>
          </div>

          <SectionLabel>Montos</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Suma asegurada (AR$)"
              required
              error={form.formState.errors.sumaAsegurada?.message}
            >
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                {...form.register("sumaAsegurada", { required: "Requerido" })}
                placeholder="18500000"
                className="font-mono"
              />
            </Field>
            <Field
              label="Prima mensual (AR$)"
              required
              error={form.formState.errors.primaMensual?.message}
            >
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                {...form.register("primaMensual", { required: "Requerido" })}
                placeholder="38400"
                className="font-mono"
              />
            </Field>
          </div>

          <div className="-mx-4 -mb-4 mt-2 flex justify-end gap-2 border-t bg-muted/50 p-4 rounded-b-xl">
            <Button
              type="button"
              variant="ghost"
              onClick={close}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              <Check className="w-3.5 h-3.5" />
              {isEdit ? "Guardar cambios" : "Emitir póliza"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-muted-foreground border-b border-border pb-1.5">
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-[12.5px] font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <span className="text-[11.5px] text-destructive">{error}</span>}
    </div>
  );
}
