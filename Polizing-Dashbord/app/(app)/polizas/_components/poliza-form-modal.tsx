"use client";

import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import {
  Field,
  FormFooter,
  FormModalShell,
  FormSelect,
  SectionLabel,
  type FormSelectOption,
} from "@/components/shared/form";
import { Input } from "@/components/ui/input";
import { useUrlModal } from "@/lib/hooks/use-url-modal";
import { toastError, toastSuccess } from "@/lib/ui/toast";
import type { PolizaFormRefs, PolizaFull } from "@/lib/data/types";
import { createPoliza } from "../_actions/create-poliza";
import { updatePoliza } from "../_actions/update-poliza";
import type { PolizaInput } from "../_actions/schemas";

type Mode =
  | { mode: "create"; refs: PolizaFormRefs; newForCliente?: number }
  | { mode: "edit"; refs: PolizaFormRefs; poliza: PolizaFull };

type Estado = "vigente" | "proxima" | "vencida" | "anulada" | "renovada";

const ESTADO_OPTIONS: ReadonlyArray<FormSelectOption> = [
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
  coberturaId: string;
  estado: Estado;
  fechaInicio: string;
  fechaFin: string;
  sumaAsegurada: string;
  primaMensual: string;
};

function emptyForm(opts: {
  newForCliente?: number;
  defaultTipoId?: number;
  defaultCoberturaId?: number;
}): FormShape {
  return {
    numero: "",
    clienteId: opts.newForCliente ? String(opts.newForCliente) : "",
    aseguradoraId: "",
    tipoSeguroId: opts.defaultTipoId ? String(opts.defaultTipoId) : "",
    coberturaId: opts.defaultCoberturaId ? String(opts.defaultCoberturaId) : "",
    estado: "vigente",
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
    coberturaId: String(p.cobertura.id),
    estado: p.estado,
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
    coberturaId: Number(values.coberturaId),
    estado: values.estado,
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
  const closeTo = isEdit ? `/polizas/${props.poliza.id}` : "/polizas";
  const { open, setOpen, close, onOpenChange } = useUrlModal({ closeTo });

  const defaultTipoId = props.refs.tiposSeguro[0]?.id;
  const defaultCoberturaId = props.refs.coberturasPorTipo.find(
    (c) => c.tipoSeguroId === defaultTipoId,
  )?.coberturas[0]?.id;

  const form = useForm<FormShape>({
    defaultValues: isEdit
      ? defaultsFromPoliza(props.poliza)
      : emptyForm({
          newForCliente: props.newForCliente,
          defaultTipoId,
          defaultCoberturaId,
        }),
  });

  const tipoSeguroIdSelected = useWatch({
    control: form.control,
    name: "tipoSeguroId",
  });

  const coberturaOptions: FormSelectOption[] = useMemo(() => {
    const tipoId = Number(tipoSeguroIdSelected);
    if (!tipoId) return [];
    const entry = props.refs.coberturasPorTipo.find(
      (c) => c.tipoSeguroId === tipoId,
    );
    return (entry?.coberturas ?? []).map((c) => ({
      value: String(c.id),
      label: c.nombre.replaceAll("_", " "),
    }));
  }, [tipoSeguroIdSelected, props.refs.coberturasPorTipo]);

  const clienteOptions: FormSelectOption[] = props.refs.clientes.map((c) => ({
    value: String(c.id),
    label: `${c.label} · ${c.ident}`,
  }));
  const aseguradoraOptions: FormSelectOption[] = props.refs.aseguradoras.map(
    (a) => ({ value: String(a.id), label: a.razonSocial }),
  );
  const tipoOptions: FormSelectOption[] = props.refs.tiposSeguro.map((t) => ({
    value: String(t.id),
    label: t.nombre,
  }));

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
    <FormModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar póliza" : "Registrar póliza"}
      description="Vinculá un cliente y una aseguradora, y completá los datos de cobertura."
      maxWidthClass="sm:max-w-[760px]"
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-4 mt-2"
        noValidate
      >
        <SectionLabel>Vinculación</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <FormSelect
            control={form.control}
            name="clienteId"
            label="Cliente"
            required
            placeholder="Seleccionar cliente…"
            options={clienteOptions}
            error={form.formState.errors.clienteId?.message}
          />
          <FormSelect
            control={form.control}
            name="aseguradoraId"
            label="Aseguradora"
            required
            placeholder="Seleccionar aseguradora…"
            options={aseguradoraOptions}
            error={form.formState.errors.aseguradoraId?.message}
          />
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
          <FormSelect
            control={form.control}
            name="tipoSeguroId"
            label="Tipo de seguro"
            required
            options={tipoOptions}
            error={form.formState.errors.tipoSeguroId?.message}
          />
          <FormSelect
            control={form.control}
            name="coberturaId"
            label="Cobertura"
            required
            className="col-span-2"
            placeholder={
              coberturaOptions.length === 0
                ? "Seleccioná primero un tipo de seguro"
                : "Seleccionar cobertura…"
            }
            options={coberturaOptions}
            error={form.formState.errors.coberturaId?.message}
          />
        </div>

        <SectionLabel>Vigencia</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <FormSelect
            control={form.control}
            name="estado"
            label="Estado"
            required
            options={ESTADO_OPTIONS}
            error={form.formState.errors.estado?.message}
          />
          <div />
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

        <FormFooter
          onCancel={close}
          submitLabel={isEdit ? "Guardar cambios" : "Emitir póliza"}
          pending={isPending}
        />
      </form>
    </FormModalShell>
  );
}
