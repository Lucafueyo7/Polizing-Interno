"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
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
import { cn } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/ui/toast";
import type { AseguradoraListItem } from "@/lib/data/types";
import { createAseguradora } from "../_actions/create-aseguradora";
import { updateAseguradora } from "../_actions/update-aseguradora";
import type { AseguradoraInput } from "../_actions/schemas";

type Mode =
  | { mode: "create" }
  | { mode: "edit"; aseguradora: AseguradoraListItem };

type FormShape = {
  razonSocial: string;
  cuit: string;
  contactoNombre: string;
  email: string;
  telefono: string;
  direccion: string;
};

const EMPTY: FormShape = {
  razonSocial: "",
  cuit: "",
  contactoNombre: "",
  email: "",
  telefono: "",
  direccion: "",
};

function defaultsFromAseguradora(a: AseguradoraListItem): FormShape {
  return {
    razonSocial: a.razonSocial,
    cuit: a.cuit,
    contactoNombre: a.contactoNombre ?? "",
    email: a.email ?? "",
    telefono: a.telefono ?? "",
    direccion: a.direccion ?? "",
  };
}

function toInput(values: FormShape): AseguradoraInput {
  return {
    razonSocial: values.razonSocial,
    cuit: values.cuit,
    contactoNombre: values.contactoNombre,
    email: values.email,
    telefono: values.telefono,
    direccion: values.direccion,
  };
}

export function AseguradoraFormModal(props: Mode) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(true);

  const form = useForm<FormShape>({
    defaultValues: isEdit ? defaultsFromAseguradora(props.aseguradora) : EMPTY,
  });

  const close = () => {
    setOpen(false);
    startTransition(() => {
      router.push("/aseguradoras");
    });
  };

  const onSubmit: SubmitHandler<FormShape> = (values) => {
    const input = toInput(values);
    startTransition(async () => {
      const result = isEdit
        ? await updateAseguradora(props.aseguradora.id, input)
        : await createAseguradora(input);

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
        isEdit ? "Aseguradora actualizada" : "Aseguradora creada correctamente",
      );
      setOpen(false);
      router.push("/aseguradoras");
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
      <DialogContent className="sm:max-w-[600px] max-w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar aseguradora" : "Registrar aseguradora"}
          </DialogTitle>
          <DialogDescription>
            Datos de la entidad aseguradora con la que operás.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 mt-2"
          noValidate
        >
          <SectionLabel>Identificación</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Razón social"
              required
              className="col-span-2"
              error={form.formState.errors.razonSocial?.message}
            >
              <Input
                {...form.register("razonSocial", {
                  required: "Requerido",
                })}
                placeholder="Aseguradora del Plata S.A."
                autoFocus={!isEdit}
              />
            </Field>
            <Field
              label="CUIT"
              required
              error={form.formState.errors.cuit?.message}
            >
              <Input
                {...form.register("cuit", { required: "Requerido" })}
                placeholder="30504567891"
                className="font-mono"
              />
            </Field>
            <Field
              label="Persona de contacto"
              error={form.formState.errors.contactoNombre?.message}
            >
              <Input
                {...form.register("contactoNombre")}
                placeholder="Nombre Apellido"
              />
            </Field>
          </div>

          <SectionLabel>Contacto</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Email"
              error={form.formState.errors.email?.message}
            >
              <Input
                type="email"
                {...form.register("email")}
                placeholder="contacto@aseguradora.com.ar"
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
              {isEdit ? "Guardar cambios" : "Crear aseguradora"}
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
