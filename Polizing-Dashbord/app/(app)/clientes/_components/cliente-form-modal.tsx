"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { Building, User as UserIcon } from "@/components/icons";
import {
  Field,
  FormFooter,
  FormModalShell,
  SectionLabel,
} from "@/components/shared/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUrlModal } from "@/lib/hooks/use-url-modal";
import { toastError, toastSuccess } from "@/lib/ui/toast";
import { formatTelefono } from "@/lib/format/telefono";
import type { ClienteFull, ClienteTipo } from "@/lib/data/types";
import { ClienteTipoCard } from "./cliente-tipo-card";
import { createCliente } from "../_actions/create-cliente";
import { updateCliente } from "../_actions/update-cliente";
import type {
  ClienteCorpInput,
  ClienteInput,
  ClienteNormalInput,
} from "../_actions/schemas";

type Mode =
  | { mode: "create" }
  | { mode: "edit"; cliente: ClienteFull };

type FormShape = {
  tipo: ClienteTipo;
  razonSocial?: string;
  cuit?: string;
  contactoNombre?: string;
  nombre?: string;
  apellido?: string;
  dni?: string;
  email: string;
  telefono?: string;
  direccion?: string;
  estado: "activo" | "baja";
};

const EMPTY_FORM: FormShape = {
  tipo: "normal",
  razonSocial: "",
  cuit: "",
  contactoNombre: "",
  nombre: "",
  apellido: "",
  dni: "",
  email: "",
  telefono: "",
  direccion: "",
  estado: "activo",
};

function defaultsFromCliente(c: ClienteFull): FormShape {
  return {
    tipo: c.tipo,
    razonSocial: c.razonSocial ?? "",
    cuit: c.cuit ?? "",
    contactoNombre: c.contactoNombre ?? "",
    nombre: c.nombre ?? "",
    apellido: c.apellido ?? "",
    dni: c.dni ?? "",
    email: c.email ?? "",
    telefono: c.telefono ? formatTelefono(c.telefono) : "",
    direccion: c.direccion ?? "",
    estado: c.estado,
  };
}

function toInput(values: FormShape): ClienteInput {
  if (values.tipo === "corp") {
    return {
      tipo: "corp",
      razonSocial: values.razonSocial ?? "",
      cuit: values.cuit ?? "",
      contactoNombre: values.contactoNombre,
      email: values.email,
      telefono: values.telefono,
      direccion: values.direccion,
      estado: values.estado,
    } satisfies ClienteCorpInput;
  }
  return {
    tipo: "normal",
    nombre: values.nombre ?? "",
    apellido: values.apellido ?? "",
    dni: values.dni ?? "",
    email: values.email,
    telefono: values.telefono,
    direccion: values.direccion,
    estado: values.estado,
  } satisfies ClienteNormalInput;
}

export function ClienteFormModal(props: Mode) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const [isPending, startTransition] = useTransition();
  const closeTo = isEdit ? `/clientes/${props.cliente.id}` : "/clientes";
  const { open, setOpen, close, onOpenChange } = useUrlModal({ closeTo });

  const form = useForm<FormShape>({
    defaultValues: isEdit ? defaultsFromCliente(props.cliente) : EMPTY_FORM,
  });

  const tipo = form.watch("tipo");

  const onSubmit: SubmitHandler<FormShape> = (values) => {
    const input = toInput(values);
    startTransition(async () => {
      const result = isEdit
        ? await updateCliente(props.cliente.id, input)
        : await createCliente(input);

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
        isEdit ? "Cliente actualizado" : "Cliente creado correctamente",
      );
      setOpen(false);
      router.push(`/clientes/${result.id}`);
      router.refresh();
    });
  };

  return (
    <FormModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar cliente" : "Registrar cliente"}
      description="Los campos varían según el tipo de cliente."
      maxWidthClass="sm:max-w-[640px]"
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-4 mt-2"
        noValidate
      >
        {!isEdit && (
          <div>
            <Label className="text-[12.5px] mb-2 block">
              Tipo de cliente <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2.5">
              <ClienteTipoCard
                selected={tipo === "normal"}
                icon={UserIcon}
                title="Particular"
                desc="Persona física · DNI"
                onClick={() =>
                  form.setValue("tipo", "normal", { shouldDirty: true })
                }
              />
              <ClienteTipoCard
                selected={tipo === "corp"}
                icon={Building}
                title="Corporativo"
                desc="Persona jurídica · CUIT"
                onClick={() =>
                  form.setValue("tipo", "corp", { shouldDirty: true })
                }
              />
            </div>
          </div>
        )}

        <SectionLabel>
          Datos {tipo === "corp" ? "de la empresa" : "personales"}
        </SectionLabel>

        <div className="grid grid-cols-2 gap-3">
          {tipo === "normal" ? (
            <>
              <Field
                label="Nombre"
                required
                error={form.formState.errors.nombre?.message}
              >
                <Input
                  {...form.register("nombre")}
                  placeholder="Juan"
                  autoFocus={!isEdit}
                />
              </Field>
              <Field
                label="Apellido"
                required
                error={form.formState.errors.apellido?.message}
              >
                <Input {...form.register("apellido")} placeholder="Pérez" />
              </Field>
              <Field
                label="DNI"
                required
                error={form.formState.errors.dni?.message}
              >
                <Input
                  {...form.register("dni")}
                  placeholder="33123456"
                  className="font-mono"
                />
              </Field>
              <EstadoSelect form={form} />
            </>
          ) : (
            <>
              <Field
                label="Razón social"
                required
                className="col-span-2"
                error={form.formState.errors.razonSocial?.message}
              >
                <Input
                  {...form.register("razonSocial")}
                  placeholder="Constructora Andina S.A."
                  autoFocus={!isEdit}
                />
              </Field>
              <Field
                label="CUIT"
                required
                error={form.formState.errors.cuit?.message}
              >
                <Input
                  {...form.register("cuit")}
                  placeholder="30710458927"
                  className="font-mono"
                />
              </Field>
              <Field
                label="Persona de contacto"
                error={form.formState.errors.contactoNombre?.message}
              >
                <Input
                  {...form.register("contactoNombre")}
                  placeholder="Mariano Pereyra"
                />
              </Field>
              <EstadoSelect form={form} className="col-span-2" />
            </>
          )}
        </div>

        <SectionLabel>Contacto</SectionLabel>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Email"
            required
            error={form.formState.errors.email?.message}
          >
            <Input
              type="email"
              {...form.register("email")}
              placeholder="cliente@dominio.com"
            />
          </Field>
          <Field label="Teléfono" error={form.formState.errors.telefono?.message}>
            <Input
              {...form.register("telefono")}
              placeholder="+54 11 ..."
              className="font-mono"
            />
          </Field>
          <Field
            label="Dirección"
            className="col-span-2"
            error={form.formState.errors.direccion?.message}
          >
            <Input
              {...form.register("direccion")}
              placeholder="Calle 123, Ciudad"
            />
          </Field>
        </div>

        <FormFooter
          onCancel={close}
          submitLabel={isEdit ? "Guardar cambios" : "Crear cliente"}
          pending={isPending}
        />
      </form>
    </FormModalShell>
  );
}

function EstadoSelect({
  form,
  className,
}: {
  form: ReturnType<typeof useForm<FormShape>>;
  className?: string;
}) {
  return (
    <Field
      label="Estado"
      required
      className={className}
      error={form.formState.errors.estado?.message}
    >
      <Controller
        control={form.control}
        name="estado"
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  );
}
