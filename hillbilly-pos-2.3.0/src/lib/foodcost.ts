import { Product, Recipe, StockItem } from '../types';

/** Netto jednotková cena suroviny (bere v potaz výtěžnost). */
export function unitCostNet(stock: StockItem): number {
  const packSize = (stock.packSize ?? stock.qty) || 0;
  const cost = stock.packCost ?? NaN;
  const yieldPct = (stock.yieldPct == null ? 100 : stock.yieldPct);
  if (!packSize || !isFinite(packSize) || !isFinite(cost)) return NaN;
  const base = cost / packSize;
  const adj = yieldPct > 0 ? base / (yieldPct / 100) : base;
  return adj;
}

/** Náklad receptu bez DPH (Σ amount * unitCost). */
export function recipeCostNet(recipe: Recipe, stockIndex: Map<string, StockItem>): number {
  if (!recipe || !recipe.components) return 0;
  let sum = 0;
  for (const c of recipe.components) {
    const s = stockIndex.get(c.stockId);
    if (!s) continue;
    const u = unitCostNet(s);
    if (!isFinite(u)) continue;
    sum += (c.amount || 0) * u;
  }
  return sum;
}

/** Skutečný FC% = recipeCostNet / priceNet * 100 */
export function realFcPct(product: Product, recipeCost: number): number {
  const vat = product.vatRate ?? 0;
  const priceNet = (product.priceGross || 0) / (1 + vat/100);
  if (!priceNet) return NaN;
  return (recipeCost / priceNet) * 100;
}

/** Návrh ceny s DPH pro dosažení targetFcPct. */
export function suggestedPriceGross(product: Product, recipeCost: number): number {
  const target = product.targetFcPct;
  if (!target || !isFinite(target) || target <= 0) return NaN;
  const priceNet = recipeCost / (target/100);
  const vat = product.vatRate ?? 0;
  return priceNet * (1 + vat/100);
}
