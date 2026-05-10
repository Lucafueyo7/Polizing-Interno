"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { TODAY_ISO } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/ui/toast";
import type { SiniestroFormRefs } from "@/lib/data/types";
import { createSiniestro } from "../_actions/create-siniestro";
import type { SiniestroInput } from "../_actions/schemas";

type Estado = "nuevo" | "tramite" | "cerrado";

type FormShape = {
  clienteId: string;
  polizaId: string;
  numero: string;
  titulo: string;
  descripcion: string;
  fechaOcurrencia: string;
  estado: Estado;
};

type Props = {
  refs: SiniestroFormRefs;
  defaultNumero: string;
  defaultClienteId?: number;
  defaultPolizaId?: number;
};

function emptyForm(opts: {
  defaultNumero: string;
  defaultClienteId?: number;
  defaultPolizaId?: number;
}): FormShape {
  return {
    clienteId: opts.defaultClienteId ? String(opts.defaultClienteId) : "",
    polizaId: opts.defaultPolizaId ? String(opts.defaultPolizaId) : "",
    numero: opts.defaultNumero,
    titulo: "",
    descripcion: "",
    fechaOcurrencia: TODAY_ISO,
    estado: "nuevo",
  };
}

function toInput(values: FormShape): SiniestroInput {
  return {
    polizaId: Number(values.polizaId),
    numero: values.numero,
    titulo: values.titulo,
    descripcion: values.descripcion,
    fechaOcurrencia: values.fechaOcurrencia,
    estado: values.estado,
  };
}

export function SiniestroFormModal({
  refs,
  defaultNumero,
  defaultClienteId,
  defaultPolizaId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(true);

  const form = useForm<FormShape>({
    defaultValues: emptyForm({
      defaultNumero,
      defaultClienteId,
      defaultPolizaId,
    }),
  });

  const clienteId = form.watch("clienteId");
  const polizasCliente = useMemo(() => {
    if (!clienteId) return [];
    return refs.polizas.filter((p) => p.clienteId === Number(clienteId));
  }, [clienteId, refs.polizas]);

  const close = () => {
    setOpen(false);
    startTransition(() => {
      router.push("/siniestros");
    });
  };

  const onSubmit: SubmitHandler<FormShape> = (values) => {
    if (!values.polizaId) {
      form.setError("polizaId", {
        type: "manual",
        message: "Seleccioná una póliza",
      });
      return;
    }
    const input = toInput(values);
    startTransition(async () => {
      const result = await createSiniestro(input);
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
      toastSuccess("Siniestro creado correctamente");
      setOpen(false);
      router.push(`/siniestros/${result.id}`);
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
      <DialogContent className="sm:max-w-[680px] max-w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle>Registrar siniestro</DialogTitle>
          <DialogDescription>
            Vinculá un cliente y una póliza, y describí el evento. La IA
            asistirá en la clasificación cuando se procese el caso.
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
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue("polizaId", "", { shouldDirty: true });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente…" />
                    </SelectTrigger>
                    <SelectContent>
                      {refs.clientes.map((c) => (
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
              label="Póliza"
              required
              error={form.formState.errors.polizaId?.message}
            >
              <Controller
                control={form.control}
                name="polizaId"
                rules={{ required: "Requerido" }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!clienteId || polizasCliente.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !clienteId
                            ? "Elegí un cliente primero"
                            : polizasCliente.length === 0
                              ? "Sin pólizas vigentes"
                              : "Seleccionar póliza…"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {polizasCliente.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.numero} · {p.tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <SectionLabel>Datos del evento</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="N° de siniestro"
              required
              error={form.formState.errors.numero?.message}
            >
              <Input
                {...form.register("numero", { required: "Requerido" })}
                placeholder={defaultNumero}
                className="font-mono"
              />
            </Field>
            <Field
              label="Fecha de ocurrencia"
              required
              error={form.formState.errors.fechaOcurrencia?.message}
            >
              <Input
                type="date"
                {...form.register("fechaOcurrencia", { required: "Requerido" })}
                max={TODAY_ISO}
                className="font-mono"
              />
            </Field>
            <Field
              label="Título"
              required
              className="col-span-2"
              error={form.formState.errors.titulo?.message}
            >
              <Input
                {...form.register("titulo", { required: "Requerido" })}
                placeholder="Choque trasero en Av. Cabildo y Juramento"
              />
            </Field>
            <Field
              label="Descripción de los hechos"
              className="col-span-2"
              error={form.formState.errors.descripcion?.message}
            >
              <Textarea
                {...form.register("descripcion")}
                rows={4}
                placeholder="Relato del cliente o del productor: qué pasó, daños observables, terceros involucrados…"
              />
            </Field>
            <Field
              label="Estado inicial"
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
                      <SelectItem value="nuevo">Nuevo</SelectItem>
                      <SelectItem value="tramite">En trámite</SelectItem>
                      <SelectItem value="cerrado">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
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
              Crear siniestro
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
