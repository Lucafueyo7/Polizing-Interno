"use client";

import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import {
  Field,
  FormFooter,
  FormModalShell,
  SectionLabel,
} from "@/components/shared/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUrlModal } from "@/lib/hooks/use-url-modal";
import { TODAY_ISO } from "@/lib/format/date";
import { toastError, toastSuccess } from "@/lib/ui/toast";
import type { SiniestroFormRefs } from "@/lib/data/types";
import { createSiniestro } from "../_actions/create-siniestro";
import type { SiniestroInput } from "../_actions/schemas";

type Estado =
  | "nuevo"
  | "pendiente_documentacion"
  | "en_tramite"
  | "cerrado"
  | "rechazado";

type FormShape = {
  clienteId: string;
  polizaId: string;
  numero: string;
  titulo: string;
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
    fechaOcurrencia: TODAY_ISO,
    estado: "nuevo",
  };
}

function toInput(values: FormShape): SiniestroInput {
  return {
    polizaId: Number(values.polizaId),
    numero: values.numero,
    titulo: values.titulo,
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
  const { open, setOpen, close, onOpenChange } = useUrlModal({
    closeTo: "/siniestros",
  });

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
    <FormModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar siniestro"
      description="Vinculá un cliente y una póliza, y describí el evento."
      maxWidthClass="sm:max-w-[680px]"
    >
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
                    <SelectItem value="pendiente_documentacion">
                      Pendiente de documentación
                    </SelectItem>
                    <SelectItem value="en_tramite">En trámite</SelectItem>
                    <SelectItem value="cerrado">Cerrado</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        <FormFooter
          onCancel={close}
          submitLabel="Crear siniestro"
          pending={isPending}
        />
      </form>
    </FormModalShell>
  );
}
