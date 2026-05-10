"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import {
  Building,
  Check,
  User as UserIcon,
} from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/ui/toast";
import type { ClienteFull, ClienteTipo } from "@/lib/data/types";
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

type ClienteFormModalProps = Mode;

type FormShape = {
  tipo: ClienteTipo;
  // corp
  razonSocial?: string;
  cuit?: string;
  contactoNombre?: string;
  // normal
  nombre?: string;
  apellido?: string;
  dni?: string;
  // shared
  email: string;
  telefono?: string;
  direccion?: string;
  estado: "activo" | "baja";
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
    telefono: c.telefono ?? "",
    direccion: c.direccion ?? "",
    estado: c.estado,
  };
}

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

export function ClienteFormModal(props: ClienteFormModalProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(true);

  const form = useForm<FormShape>({
    defaultValues: isEdit ? defaultsFromCliente(props.cliente) : EMPTY_FORM,
  });

  const tipo = form.watch("tipo");

  const close = () => {
    setOpen(false);
    // Da tiempo a la animación de cierre antes de navegar.
    startTransition(() => {
      const target = isEdit ? `/clientes/${props.cliente.id}` : "/clientes";
      router.push(target);
    });
  };

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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent className="sm:max-w-[640px] max-w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar cliente" : "Registrar cliente"}
          </DialogTitle>
          <DialogDescription>
            Los campos varían según el tipo de cliente.
          </DialogDescription>
        </DialogHeader>

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
                <TipoCard
                  selected={tipo === "normal"}
                  icon={UserIcon}
                  title="Particular"
                  desc="Persona física · DNI"
                  onClick={() =>
                    form.setValue("tipo", "normal", { shouldDirty: true })
                  }
                />
                <TipoCard
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
                        onValueChange={(v) => field.onChange(v)}
                      >
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
                <Field
                  label="Estado"
                  required
                  className="col-span-2"
                  error={form.formState.errors.estado?.message}
                >
                  <Controller
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) => field.onChange(v)}
                      >
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
            <Field
              label="Teléfono"
              error={form.formState.errors.telefono?.message}
            >
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
              {isEdit ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TipoCard({
  selected,
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  selected: boolean;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3.5 py-3 rounded-lg border text-left transition-colors",
        selected
          ? "border-primary bg-brand-primary-soft"
          : "border-border bg-card hover:bg-brand-surface-hover",
      )}
    >
      <span
        className={cn(
          "w-8 h-8 grid place-items-center rounded-md shrink-0",
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground",
        )}
      >
        <Icon className="w-4 h-4" />
      </span>
      <span className="flex flex-col">
        <span
          className={cn(
            "text-[13px] font-semibold",
            selected ? "text-primary" : "text-foreground",
          )}
        >
          {title}
        </span>
        <span className="text-[11.5px] text-muted-foreground">{desc}</span>
      </span>
    </button>
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

