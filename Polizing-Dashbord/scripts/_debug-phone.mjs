import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
const __dir = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(resolve(__dir,"../.env"),"utf8");
for(const l of raw.split("\n")){const e=l.indexOf("=");if(e>-1&&!l.trim().startsWith("#")){const k=l.slice(0,e).trim(),v=l.slice(e+1).trim().replace(/^["']|["']$/g,"");if(!(k in process.env))process.env[k]=v;}}
const url=process.env.DIRECT_URL??process.env.DATABASE_URL;
const pi=url.indexOf("://")+3,rest=url.slice(pi),la=rest.lastIndexOf("@"),ui=rest.slice(0,la),hp=rest.slice(la+1),ci=ui.indexOf(":"),user=ui.slice(0,ci),pass=decodeURIComponent(ui.slice(ci+1));
const pool=new pg.Pool({connectionString:url.slice(0,pi)+user+":"+encodeURIComponent(pass)+"@"+hp});

// Simular exactamente lo que hace findActiveByTelefono
const phone = "5492915105559";
const {rows} = await pool.query(`
  SELECT c.id, c.telefono, c.estado,
         COALESCE(nc.nombre||' '||nc.apellido, corp.razon_social, '?') as nombre
  FROM clientes c
  LEFT JOIN clientes_no_corporativos nc ON nc.cliente_id = c.id
  LEFT JOIN clientes_corporativos corp ON corp.cliente_id = c.id
  WHERE c.telefono = $1 AND c.estado = 'activo'
  ORDER BY c.id ASC
`, [phone]);

console.log("Clientes con teléfono", phone, "y estado=activo:");
for (const r of rows) console.log(`  id=${r.id}  ${r.nombre}  estado=${r.estado}`);
console.log("\n→ findActiveByTelefono devuelve el PRIMERO:", rows[0] ?? "ninguno");

// Pólizas vigentes del primero (el que usa el backend)
if (rows[0]) {
  const cid = rows[0].id;
  const {rows: pols} = await pool.query(`
    SELECT p.id, p.numero_poliza, p.estado, p.aseguradora_id, ea.codigo_integracion
    FROM polizas p
    LEFT JOIN empresas_aseguradoras ea ON ea.id = p.aseguradora_id
    WHERE p.cliente_id = $1 AND p.estado IN ('vigente','proxima')
    ORDER BY p.id ASC
  `, [cid]);
  console.log(`\nPólizas del cliente ${cid}:`, pols);
}

await pool.end();
