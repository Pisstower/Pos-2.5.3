import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Product, StockItem, Recipe } from '../../types';

function _normalizePrice(input: any): number {
  if (input == null) return NaN;
  let s = String(input).trim();
  s = s.replace(/[^0-9,\.]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  if (!s.length) return NaN;
  const n = Number(s);
  return isFinite(n) ? n : NaN;
}
const _norm = (s:any)=> String(s||'').trim().toLowerCase().replace(/\s+/g,' ');

function parseMenuStrict(ws: XLSX.WorkSheet, warnings: string[]): Product[] {
  const arr = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }) as any[][];
  const data = arr.slice(1); // A: cat, B: name, C: price
  const wetTokens = ['piti','pití','nápoj','napoj','napoje','nápoje','drink','drinks','wet'];
  const out: Product[] = [];
  let r = 2;
  for (const row of data) {
    if (!row || row.every((v:any)=> (String(v||'').trim()===''))) { r++; continue; }
    const cat = _norm(row[0]);
    const name = String(row[1] ?? '').trim();
    const priceGross = _normalizePrice(row[2]);
    if (!name) { r++; continue; }
    if (!isFinite(priceGross)) { warnings.push(`menu řádek ${r}: neplatná cena "${row[2]}"`); r++; continue; }
    const type = wetTokens.some(t => cat.includes(t)) ? 'wet' : 'dry';
    out.push({ id: 'p-'+name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9_-]/g,''), name, priceGross, vatRate: 0, type });
    r++;
  }
  return out;
}

function parseSurovinyStrict(ws: XLSX.WorkSheet, warnings: string[]): (StockItem & { vatRate?: number, packCost?: number })[] {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }) as any[][];
  if (!rows.length) return [];
  const header = rows[0].map(_norm);
  const data = rows.slice(1);
  const find = (aliases: string[]) => {
    for (let i=0;i<header.length;i++){ if (aliases.some(a => header[i].includes(a))) return i; }
    return -1;
  };
  const idxId    = find(['sku','id','kód','kod']);
  const idxName  = find(['název','nazev','name']);
  const idxUnit  = find(['jednotka','unit']);
  const idxPack  = find(['množství','mnozstvi','balení','baleni','pack size','qty']);
  const idxCost  = find(['cena balení','pack cost','purchase price','pack price','nakupni cena','cena baleni']);
  const idxVat   = find(['dph','vat']); // G
  const out: (StockItem & { vatRate?: number, packCost?: number })[] = [];
  let r=2;
  for (const row of data) {
    if (!row || row.every((v:any)=> (String(v||'').trim()===''))) { r++; continue; }
    const name = String(idxName>=0 ? row[idxName] : '').trim();
    if (!name) { r++; continue; }
    let id = String(idxId>=0 ? row[idxId] : '').trim();
    if (!id) id = name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9_-]/g,'');
    const unit = String(idxUnit>=0 ? row[idxUnit] : 'ks').trim() || 'ks';
    const packSize = Number(idxPack>=0 ? row[idxPack] : 0);
    const packCostRaw = idxCost>=0 ? row[idxCost] : undefined;
    const packCost = packCostRaw!=null ? Number(String(packCostRaw).replace(',', '.')) : undefined;
    const vatRate = Number(idxVat>=0 ? row[idxVat] : 0);
    out.push({ id, name, unit, qty: isFinite(packSize)?packSize:0, packSize: isFinite(packSize)?packSize:0, onHand: 0, minQty: 0, vatRate: isFinite(vatRate)?vatRate:0, packCost: (packCost!=null && isFinite(packCost)) ? packCost : undefined });
    r++;
  }
  return out;
}

function parseRecepturyStrict(ws: XLSX.WorkSheet, warnings: string[], products: Product[], stock: StockItem[]): Recipe[] {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }) as any[][];
  if (!rows.length) return [];
  const header = rows[0].map(_norm);
  const data = rows.slice(1);
  const find = (aliases: string[]) => {
    for (let i=0;i<header.length;i++){ if (aliases.some(a => header[i].includes(a))) return i; }
    return -1;
  };
  const idxProd = find(['produkt','položka','polozka','product','menu']);
  const idxComp = find(['surovina','sku','ingredience','component']);
  const idxAmt  = find(['množství','mnozstvi','amount','qty']);
  const pByName = new Map(products.map(p => [p.name.trim().toLowerCase(), p.id]));
  const sById = new Map(stock.map(s => [s.id, s]));
  const sByName = new Map(stock.map(s => [s.name.trim().toLowerCase(), s]));

  const recMap = new Map<string, Recipe>();
  let r=2;
  for (const row of data) {
    const prodName = String(idxProd>=0 ? row[idxProd] : '').trim();
    const compRef = String(idxComp>=0 ? row[idxComp] : '').trim();
    const amount = Number(idxAmt>=0 ? row[idxAmt] : 0);
    if (!prodName || !compRef || !amount) { r++; continue; }
    const productId = pByName.get(prodName.toLowerCase());
    if (!productId) { warnings.push(`receptury řádek ${r}: produkt '${prodName}' nenalezen v menu`); r++; continue; }
    let stockId = compRef;
    if (!sById.has(stockId)) {
      const s = sByName.get(compRef.toLowerCase());
      if (!s) { warnings.push(`receptury řádek ${r}: surovina '${compRef}' nenalezena`); r++; continue; }
      stockId = s.id;
    }
    const rec = recMap.get(productId) || { productId, components: [] };
    rec.components.push({ stockId, amount });
    recMap.set(productId, rec);
    r++;
  }
  return Array.from(recMap.values());
}

type Parsed = { products: Product[]; stock: (StockItem & { vatRate?: number, packCost?: number })[]; recipes: Recipe[]; warnings: string[]; };

export default function ImportXlsx() {
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [error, setError] = useState<string>('');
  const [defaultVat, setDefaultVat] = useState<number>(21);
  const [inferVat, setInferVat] = useState<boolean>(true);

  const onFile = async (f: File) => {
    try {
      setError('');
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const warnings: string[] = [];
      const wsMenu = wb.Sheets['menu'] || wb.Sheets['Menu'];
      const wsSuroviny = wb.Sheets['suroviny'] || wb.Sheets['Suroviny'];
      const wsReceptury = wb.Sheets['receptury'] || wb.Sheets['Receptury'];
      if (!wsMenu) throw new Error("Chybí list 'menu'");
      if (!wsSuroviny) throw new Error("Chybí list 'suroviny'");
      if (!wsReceptury) warnings.push("Chybí list 'receptury' – import bez receptur");

      const products0 = parseMenuStrict(wsMenu, warnings);
      let products = products0.map(p => ({...p, vatRate: defaultVat}));
      const stock = parseSurovinyStrict(wsSuroviny, warnings);
      const recipes = wsReceptury ? parseRecepturyStrict(wsReceptury, warnings, products, stock) : [];

      if (inferVat && recipes.length && stock.length) {
        const sIdx = new Map(stock.map((s:any)=> [s.id, s.vatRate ?? defaultVat]));
        const byProd = new Map<string, number[]>();
        for (const r of recipes) {
          const rates = r.components.map(c => sIdx.get(c.stockId) ?? defaultVat);
          byProd.set(r.productId, rates);
        }
        products = products.map(p => {
          const arr = byProd.get(p.id);
          if (!arr || !arr.length) return p;
          const freq = new Map<number, number>();
          arr.forEach(v => freq.set(v, (freq.get(v)||0)+1));
          let best = defaultVat, bestN = -1;
          for (const [k,n] of freq) { if (n>bestN) {best=k; bestN=n;} }
          return {...p, vatRate: best};
        });
      }

      setParsed({ products, stock, recipes, warnings });
    } catch (e:any) { setError(e.message || String(e)); }
  };

  const apply = () => {
    if (!parsed) return;
    console.log('IMPORT SET', parsed);
    alert('Data naimportována (log v konzoli) — napoj prosím na storage.');
  };

  return (
    <div>
      <input type="file" accept=".xlsx,.xls" onChange={e=>{ const f=e.target.files?.[0]; if (f) onFile(f); }} />
      {error && <div style={{color:'red', marginTop:8}}>{error}</div>}
      {parsed && (
        <div style={{marginTop:12}}>
          <div style={{display:'flex', gap:12, alignItems:'center', marginTop:8}}>
            <label style={{display:'flex', alignItems:'center', gap:6}}>
              <input type="checkbox" checked={inferVat} onChange={e=>setInferVat(e.target.checked)} /> Vypočítat DPH produktu z receptur
            </label>
            <label style={{display:'flex', alignItems:'center', gap:6}}>
              Výchozí DPH produktu:
              <select value={defaultVat} onChange={e=>setDefaultVat(Number(e.target.value))}>
                <option value={21}>21 %</option>
                <option value={12}>12 %</option>
                <option value={0}>0 %</option>
              </select>
            </label>
          </div>

          <h4>Náhled importu</h4>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
            <div>
              <strong>Menu ({parsed.products.length})</strong>
              <ul>{parsed.products.slice(0,10).map(p=> <li key={p.id}>{p.name} — {p.priceGross} (DPH {p.vatRate}%)</li>)}</ul>
            </div>
            <div>
              <strong>Suroviny ({parsed.stock.length})</strong>
              <ul>{parsed.stock.slice(0,10).map(s=> <li key={s.id}>{s.name} [{s.unit}]</li>)}</ul>
            </div>
            <div>
              <strong>Receptury ({parsed.recipes.length})</strong>
              <ul>{parsed.recipes.slice(0,10).map(r=> <li key={r.productId}>{r.productId}: {r.components.length} položek</li>)}</ul>
            </div>
          </div>

          {!!parsed.warnings.length && (
            <details style={{marginTop:8}}>
              <summary>Varování ({parsed.warnings.length})</summary>
              <ul>{parsed.warnings.map((w,i)=> <li key={i}>{w}</li>)}</ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
