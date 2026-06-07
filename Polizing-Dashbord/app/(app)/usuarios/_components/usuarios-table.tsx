import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UsuarioListItem } from "@/lib/data/usuarios";
import { UsuarioActions } from "./usuario-actions";

function formatDni(dni: string): string {
  if (dni.startsWith("clerk:")) return "—";
  return dni;
}

export function UsuariosTable({
  rows,
  canManage,
}: {
  rows: UsuarioListItem[];
  canManage: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No hay usuarios registrados.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>DNI</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((u) => (
          <TableRow key={u.id}>
            <TableCell className="font-medium">{u.nombreCompleto}</TableCell>
            <TableCell className="text-muted-foreground">{u.email}</TableCell>
            <TableCell className="font-mono text-muted-foreground">
              {formatDni(u.dni)}
            </TableCell>
            <TableCell>
              <Badge variant={u.rol === "administrativo" ? "info" : "outline"}>
                {u.rol === "administrativo" ? "Administrativo" : "Productor"}
              </Badge>
            </TableCell>
            <TableCell className="w-10 text-right">
              {canManage && <UsuarioActions id={u.id} />}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
