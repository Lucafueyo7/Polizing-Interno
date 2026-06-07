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
import type { UsuarioListItem } from "@/lib/data/usuarios";
import { createUsuario } from "../_actions/create-usuario";
import { updateUsuario } from "../_actions/update-usuario";
import type { CreateUsuarioInput, UpdateUsuarioInput } from "../_actions/schemas";

type Mode =
  | { mode: "create" }
  | { mode: "edit"; usuario: UsuarioListItem };

// ── Create form ──────────────────────────────────────────────────────────────

type CreateShape = CreateUsuarioInput;

const CREATE_EMPTY: CreateShape = {
  nombre: "",
  apellido: "",
  email: "",
  dni: "",
  rol: "productor",
  password: "",
};

function CreateForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateShape>({ defaultValues: CREATE_EMPTY });

  const onSubmit = (data: CreateShape) => {
    startTransition(async () => {
      const result = await createUsuario(data);
      if (result.ok) {
        toastSuccess("Usuario creado correctamente.");
        reset(CREATE_EMPTY);
        router.refresh();
        onDone();
      } else {
        toastError(result.error);
      }
    });
  };

  return (
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

      <FormFooter onCancel={onDone} pending={isPending} submitLabel="Crear usuario" />
    </form>
  );
}

// ── Edit form ─────────────────────────────────────────────────────────────────

type EditShape = { nombreCompleto: string; rol: "productor" | "administrativo" };

function EditForm({
  usuario,
  onDone,
}: {
  usuario: UsuarioListItem;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditShape>({
    defaultValues: {
      nombreCompleto: usuario.nombreCompleto,
      rol: usuario.rol,
    },
  });

  const onSubmit = (data: EditShape) => {
    const input: UpdateUsuarioInput = { id: usuario.id, ...data };
    startTransition(async () => {
      const result = await updateUsuario(input);
      if (result.ok) {
        toastSuccess("Usuario actualizado.");
        router.refresh();
        onDone();
      } else {
        toastError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Nombre completo" required error={errors.nombreCompleto?.message}>
        <Input {...register("nombreCompleto")} placeholder="Juan García" />
      </Field>

      <Field label="Email">
        <Input value={usuario.email} disabled className="opacity-60" />
      </Field>

      <Field label="Rol" required>
        <Select
          value={watch("rol")}
          onValueChange={(v) => setValue("rol", v as "productor" | "administrativo")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="productor">Productor</SelectItem>
            <SelectItem value="administrativo">Administrativo</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <FormFooter onCancel={onDone} pending={isPending} submitLabel="Guardar cambios" />
    </form>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export function UsuarioFormModal(props: Mode) {
  const { open, onOpenChange, close } = useUrlModal({
    closeTo: "/usuarios",
  });

  const isEdit = props.mode === "edit";

  return (
    <FormModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar usuario" : "Nuevo usuario"}
      description={
        isEdit
          ? "Modificá el nombre o el rol del usuario."
          : "Se creará una cuenta en Clerk con los datos ingresados."
      }
    >
      {isEdit ? (
        <EditForm usuario={props.usuario} onDone={close} />
      ) : (
        <CreateForm onDone={close} />
      )}
    </FormModalShell>
  );
}
