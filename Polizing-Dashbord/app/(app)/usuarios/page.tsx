import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUser } from "@/lib/auth/session";
import { getUsuarios } from "@/lib/data/usuarios";
import { UsuariosPageActions } from "./_components/usuarios-page-actions";
import { UsuariosTable } from "./_components/usuarios-table";
import { UsuarioFormModal } from "./_components/usuario-form-modal";

type SearchParams = Promise<{ modal?: string }>;

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Administrativo") redirect("/dashboard");

  const [usuarios, params] = await Promise.all([getUsuarios(), searchParams]);

  return (
    <>
      <PageHeader title="Usuarios" actions={<UsuariosPageActions />} />
      <Card>
        <UsuariosTable rows={usuarios} />
      </Card>
      {params.modal === "create" && <UsuarioFormModal />}
    </>
  );
}
