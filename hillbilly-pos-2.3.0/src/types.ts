export type Product = {
  id: string;
  name: string;
  priceGross: number; // včetně DPH
  vatRate: number;    // sazba DPH produktu
  type: 'dry'|'wet';  // jidlo/piti
  /** cílový food cost % (např. 25) */
  targetFcPct?: number;
};

export type StockItem = {
  id: string;      // SKU
  name: string;
  unit: string;    // ks/g/ml/...
  qty: number;     // legacy (velikost balení)
  packSize?: number;
  onHand?: number;
  minQty?: number;
  /** nákupní cena celého balení (netto) */
  packCost?: number;
  /** výtěžnost v procentech (0–100), default 100 */
  yieldPct?: number;
};

export type Recipe = {
  productId: string;
  components: { stockId: string; amount: number }[];
};
