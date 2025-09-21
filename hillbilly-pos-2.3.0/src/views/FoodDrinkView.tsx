
import React, { useMemo, useState } from 'react';
import ReceiptModal from '../features/receipts/ReceiptModal';
import { CartItem } from '../types';
import { getProducts, getStock, setStock, getRecipes, setRecipes } from '../lib/storage';

// Fallback demo data, pokud zatím nejsou importované produkty
const FALLBACK_PRODUCTS = [
  { id: 'p1', name: 'Hranolky', priceGross: 79, vatRate: 0, type: 'dry' as const },
  { id: 'p2', name: 'Kofola 0.5', priceGross: 45, vatRate: 0, type: 'wet' as const },
  { id: 'p3', name: 'Hot-dog', priceGross: 89, vatRate: 0, type: 'dry' as const },
  { id: 'p4', name: 'Limonáda 0.5', priceGross: 49, vatRate: 0, type: 'wet' as const },
  { id: 'p5', name: 'Burger', priceGross: 149, vatRate: 0, type: 'dry' as const },
  { id: 'p6', name: 'Káva', priceGross: 40, vatRate: 0, type: 'wet' as const },
];

function seedDemoData() {
  if (!getStock().length) setStock([
    { id: 'potato-kg', name: 'Brambory', unit: 'kg', qty: 10 },
    { id: 'oil-l', name: 'Olej fritovací', unit: 'l', qty: 5 },
    { id: 'kofola-l', name: 'Kofola (sirup)', unit: 'l', qty: 2 },
    { id: 'co2-kg', name: 'CO2', unit: 'kg', qty: 1 },
  ] as any);
  if (!getRecipes().length) setRecipes([
    { productId: 'p1', components: [{ stockId: 'potato-kg', amount: 0.25 }, { stockId: 'oil-l', amount: 0.02 }] },
    { productId: 'p2', components: [{ stockId: 'kofola-l', amount: 0.5 }, { stockId: 'co2-kg', amount: 0.01 }] },
  ] as any);
}

export default function FoodDrinkView() {
  seedDemoData();

  // Load products (importované ze storage, nebo fallback)
  // @ts-ignore – starší data mohla mít `price`, novější `priceGross`
  const PRODUCTS = (getProducts && getProducts())?.length ? getProducts() : FALLBACK_PRODUCTS;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'dry' | 'wet'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p: any) => {
      const passType = filter === 'all' ? true : p.type === filter;
      const passQ = !q || p.name.toLowerCase().includes(q);
      return passType && passQ;
    });
  }, [PRODUCTS, query, filter]);

  const add = (pid: string) => {
    const p: any = PRODUCTS.find((x: any) => x.id === pid)!;
    const price = p.priceGross ?? p.price ?? 0;
    setCart(prev => {
      const idx = prev.findIndex(i => i.productId === pid);
      if (idx > -1) {
        const copy = [...prev];
        const item = copy[idx];
        const qty = item.qty + 1;
        copy[idx] = { ...item, qty, total: qty * item.unitPrice };
        return copy;
      }
      return [...prev, { productId: p.id, name: p.name, qty: 1, unitPrice: price, total: price }];
    });
  };

  const removeOne = (pid: string) => {
    setCart(prev =>
      prev.flatMap(i => {
        if (i.productId !== pid) return [i];
        const qty = i.qty - 1;
        if (qty <= 0) return [];
        return [{ ...i, qty, total: qty * i.unitPrice }];
      }),
    );
  };

  const subtotal = cart.reduce((s, i) => s + i.total, 0);

  return (
    <div style={{ padding: 16, height: 'calc(100vh - 64px)' }}>
      <h2>Jídlo &amp; Pití</h2>
      <div style={{ display: 'flex', gap: 16, height: 'calc(100% - 48px)' }}>
        {/* LEVÝ SLOUPEC: nabídka (sticky ovládací lišta nahoře) */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Sticky lišta s vyhledáváním a filtry */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              background: '#fff',
              borderBottom: '1px solid #eee',
              padding: '8px 4px',
            }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                placeholder="Hledat položky…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ flex: 1, padding: '8px' }}
              />
              <select value={filter} onChange={e => setFilter(e.target.value as any)}>
                <option value="all">Vše</option>
                <option value="dry">Jídlo</option>
                <option value="wet">Pití</option>
              </select>
            </div>
          </div>

          {/* Scrollovací grid s nabídkou ve 3 sloupcích */}
          <div style={{ overflow: 'auto', paddingRight: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, paddingTop: 8 }}>
              {filtered.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => add(p.id)}
                  style={{ padding: '12px 10px', textAlign: 'left', border: '1px solid #ddd', borderRadius: 8 }}
                >
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ opacity: 0.8 }}>{p.priceGross ?? p.price ?? 0} Kč</div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ gridColumn: '1 / -1', opacity: 0.6, padding: 12 }}>Žádné položky</div>
              )}
            </div>
          </div>
        </div>

        {/* PRAVÝ SLOUPEC: košík se sticky header i footer */}
        <div style={{ width: 340, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #eee' }}>
          <div
            style={{
              position: 'sticky',
              top: 0,
              padding: '8px 12px',
              background: '#fff',
              borderBottom: '1px solid #eee',
              zIndex: 1,
            }}
          >
            <h3 style={{ margin: 0 }}>Košík</h3>
          </div>

          <div style={{ overflow: 'auto', padding: '0 12px' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {cart.map(i => (
                <li
                  key={i.productId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px dashed #eee',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{i.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>× {i.qty}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button onClick={() => removeOne(i.productId)}>-</button>
                    <button onClick={() => add(i.productId)}>+</button>
                    <div style={{ minWidth: 80, textAlign: 'right' }}>{i.total.toFixed(2)} Kč</div>
                  </div>
                </li>
              ))}
              {cart.length === 0 && <li style={{ opacity: 0.6, padding: '6px 0' }}>Prázdný</li>}
            </ul>
          </div>

          <div
            style={{
              position: 'sticky',
              bottom: 0,
              padding: 12,
              borderTop: '1px solid #eee',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              background: '#fff',
            }}
          >
            <strong style={{ flex: 1 }}>Mezisoučet: {subtotal.toFixed(2)} Kč</strong>
            <button disabled={!cart.length} onClick={() => setOpen(true)}>
              Zaplatit
            </button>
            <button disabled={!cart.length} onClick={() => setCart([])}>
              Vymazat
            </button>
          </div>
        </div>
      </div>

      <ReceiptModal open={open} onClose={() => { setOpen(false); setCart([]); }} cart={cart} />
    </div>
  );
}
