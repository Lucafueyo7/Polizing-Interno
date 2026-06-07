"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Field, FormFooter, FormModalShell } from "@/components/shared/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUrlModal } from "@/lib/hooks/use-url-modal";
import { toastError, toastSuccess } from "@/lib/ui/toast";
import { createUsuario } from "../_actions/create-usuario";
import type { CreateUsuarioInput } from "../_actions/schemas";

type FormShape = CreateUsuarioInput;

const EMPTY: FormShape = {
  nombre: "",
  apellido: "",
  email: "",
  dni: "",
  rol: "productor",
  password: "",
};

export function UsuarioFormModal() {
  const { open, onOpenChange, close } = useUrlModal({ closeTo: "/usuarios" });
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormShape>({ defaultValues: EMPTY });

  function handleCancel() {
    reset(EMPTY);
    close();
  }

  const onSubmit = (data: FormShape) => {
    startTransition(async () => {
      const result = await createUsuario(data);
      if (result.ok) {
        toastSuccess("Usuario creado correctamente.");
        reset(EMPTY);
        router.refresh();
        close();
      } else {
        toastError(result.error);
      }
    });
  };

  return (
    <FormModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Nuevo usuario"
      description="Se creará una cuenta en Clerk con los datos ingresados."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre" required error={errors.nombre?.message}>
            <Input {...register("nombre")} placeholder="Juan" />
          </Field>
          <Field label="Apellido" required error={errors.apellido?.message}>
            <Input {...register("apellido")} placeholder="García" />
          </Field>
        </div>

        <Field label="Email" required error={errors.email?.message}>
          <Input type="email" {...register("email")} placeholder="juan@ejemplo.com" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="DNI" required error={errors.dni?.message}>
            <Input {...register("dni")} placeholder="12345678" />
          </Field>

          <Field label="Rol" required error={errors.rol?.message}>
            <Select
              value={watch("rol")}
              onValueChange={(v) => setValue("rol", v as "productor" | "administrativo")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="productor">Productor</SelectItem>
                <SelectItem value="administrativo">Administrativo</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Contraseña inicial" required error={errors.password?.message}>
          <Input
            type="password"
            {...register("password")}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
          />
        </Field>

        <FormFooter onCancel={handleCancel} pending={isPending} submitLabel="Crear usuario" />
      </form>
    </FormModalShell>
  );
}
