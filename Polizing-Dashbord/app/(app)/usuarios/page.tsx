import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUser } from "@/lib/auth/session";
import { getUsuarioById, getUsuarios } from "@/lib/data/usuarios";
import { UsuariosPageActions } from "./_components/usuarios-page-actions";
import { UsuariosTable } from "./_components/usuarios-table";
import { UsuarioFormModal } from "./_components/usuario-form-modal";

type SearchParams = Promise<{ modal?: string; id?: string }>;

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard");
  if (user.role === "Administrativo") redirect("/dashboard");

  const [usuarios, params] = await Promise.all([getUsuarios(), searchParams]);

  const editId =
    params.modal === "edit" && params.id ? Number(params.id) : null;
  const editUsuario = editId ? await getUsuarioById(editId) : null;

  return (
    <>
      <PageHeader title="Usuarios" actions={<UsuariosPageActions />} />
      <Card>
        <UsuariosTable rows={usuarios} canManage={user.role === "Productor"} />
      </Card>
      {params.modal === "create" && <UsuarioFormModal mode="create" />}
      {params.modal === "edit" && editUsuario && (
        <UsuarioFormModal mode="edit" usuario={editUsuario} />
      )}
    </>
  );
}
