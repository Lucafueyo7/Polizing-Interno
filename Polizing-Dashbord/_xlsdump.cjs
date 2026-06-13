const XLSX = require('xlsx');
const path = process.argv[2];
const wb = XLSX.readFile(path);
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' });
  console.log("\n##### SHEET:", name, "#####");
  for (const r of rows.slice(0, 100)) {
    const line = r.map(c => String(c).replace(/\s+/g,' ').trim()).filter(Boolean).join(" | ");
    if (line.trim()) console.log(line);
  }
}
