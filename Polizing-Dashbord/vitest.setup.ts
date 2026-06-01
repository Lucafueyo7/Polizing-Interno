process.env.CHATBOT_API_KEY = "test-key";

// Env dummy para que los adapters de aseguradoras se instancien en los tests
// (no hay red real: el fetch se mockea). DATABASE_URL solo crea el pool, no
// conecta hasta que se ejecuta una query.
process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/test";
process.env.FEDPAT_BASE_URL ??= "https://api-sandbox.fedpat.com.ar";
process.env.FEDPAT_CLIENT_ID ??= "test-client";
process.env.FEDPAT_CLIENT_SECRET ??= "test-secret";
process.env.FEDPAT_USERNAME ??= "test-user";
process.env.FEDPAT_PASSWORD ??= "test-pass";
process.env.BERKLEY_NOVEDADES_URL ??=
  "https://tst-ws.berkley.com.ar/BIWebWSTst/com.binet17.webservices.apwsnovedades";
process.env.BERKLEY_WSMOBIMP_URL ??=
  "https://tst-ws.berkley.com.ar/BIWebWSTst/com.binet17.webservices.awsmobimp_v2";
process.env.BERKLEY_USUARIO ??= "test-user";
process.env.BERKLEY_PASSWORD ??= "test-novedades-pass";
process.env.BERKLEY_KEY ??= "test-wsmobimp-key";
