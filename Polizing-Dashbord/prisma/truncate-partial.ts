import "dotenv/config";
import { Client } from "pg";

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DIRECT_URL/DATABASE_URL");

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    await client.query(
      "TRUNCATE polizas, clientes, berkley_novedades RESTART IDENTITY CASCADE",
    );
    console.log("✅ Tablas vaciadas: polizas, clientes, berkley_novedades (+ dependientes en cascada)");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
