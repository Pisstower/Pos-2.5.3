# Hillbilly POS — Changelog

## 1.1.0
- První stabilní verze s funkčním košíkem a účtenkami.
- Základní import menu (jídlo/pití), jednoduchá navigace.
- Platby řešeny jen základně, bez pokročilé klávesnice.

## 2.1.1
- Přidána centralizovaná logika pro výpočet DPH a totals (cartTotals, vatBreakdown).
- Opraveny nepřesnosti v zaokrouhlování.
- Účtenky i přehledy používají jednotnou funkci → konzistentní výsledky.

## 2.2.1
- Opraven modal platby – chyběly uzavírací JSX tagy → build selhával.
- Přidána numerická klávesnice a rychlotlačítka (100, 500, 1000).
- Zobrazování „K vrácení“ při hotovostní platbě.

## 2.3.0
- Refaktor App.tsx → rozdělení na kontejnerové komponenty:
  - FoodDrinkView, ReceiptsView, ReportsView, SkladView, RecepturyView, SettingsView
  - PaymentModal, ReceiptModal
- Lepší čitelnost a menší re-rendering díky odděleným komponentám.
- Připraveno pro Capacitor build (APK) – projekt strukturován jako multi-file scaffold.


## 📌 Plánované kroky

- **Persist účtenek**: uložit historii účtenek do localStorage (stejně jako čítač účtenek).
- **Debounce vyhledávání**: omezit počet renderů při psaní, přidat search index pro rychlejší filtrování.
- **Capacitor build (APK)**: připravit kompletní návod a config pro export do Android APK.
- **Typování**: nahradit `any` silnými typy (`Product`, `CartItem`, `Receipt`, `Totals`, `ImportPayload`).
- **Refaktor UI**: postupně oddělit další části do samostatných komponent pro čistší kód.


## 2.4.2
- **GUI vylepšení**: 
  - Nabídka jídel/nápojů zobrazená v mřížce **3 sloupců**.
  - Levý panel (nabídka) má **sticky lištu** s vyhledáváním a filtrem (Vše/Jídlo/Pití).
  - Pravý panel (košík) má **sticky hlavičku** a **sticky spodní lištu** (součet + tlačítka).
  - Košík i nabídka mají vlastní scrollování → lepší UX při delších seznamech.


## 2.5.0 (WIP)
- **Tisk / export účtenek (PDF)**: plnohodnotný náhled účtenky s hlavičkou, položkami, DPH rozpisem, QR/čárovým kódem.
- **Reporty rozšířené**: filtrování dle období (den/týden/měsíc/interval), export do CSV, rozdělení podle platební metody a DPH.
- **Import XLSX dokončení**: doplnění `vatRate` k produktům, kontrola konzistence mezi menu–suroviny–receptury.
- **Capacitor build (APK)**: příprava a testování build procesu pro Android.
- **Refaktor & typování**: odstranění `any`, sjednocení modelů (`Product`, `StockItem`, `Receipt`).

## 2.5.0
### Added
- Sklad: nový sloupec *On hand* a oddělený *Velikost balení*.
- Receptury: produkty tučně, komponenty s názvy surovin, množstvím a jednotkou.

### Changed
- Import XLSX: robustní parser cen, ignoruje prázdné řádky.
- Účtenky & Reporty: formátování podle `cs-CZ`.
- Prodej: 'Zaplatit' pevně dole v košíku.

### Fixed
- Po importu se nabídka aktualizuje bez reloadu.
- Ceny z importu se neukládají jako 0, pokud jsou vyplněny.

## 2.5.1
### Fixed
- Přidána „safe“ spodní mezera; nic se neschovává za dolní navigaci.
- Sklad: pevná lišta **Uložit** nalepená nad navigací.

## 2.5.2
### Added
- Sklad: přidávání/mazání surovin, edit všech polí.
- Receptury: editor (nové/úpravy/mazání komponent).

### Changed
- Import XLSX: vylepšené parsování cen; účtenky/reporty `cs-CZ`.

### Fixed
- Odečet skladu jde z *onHand*, ne z velikosti balení.

## 2.5.3 (WIP)
### Added
- **Strict import**: 
  - `menu`: A=kategorie (jídlo/pití), B=názov, C=cena vč. DPH.
  - `suroviny`: A–E + G (hlavičky v 1. řádku).
  - `receptury`: A–D (hlavičky v 1. řádku).
- **Food cost skeleton**:
  - typy: `packCost`, `yieldPct`, `targetFcPct`
  - `lib/foodcost.ts`: `unitCostNet`, `recipeCostNet`, `realFcPct`, `suggestedPriceGross`

## Roadmap (2.5.3 – Food cost)
- [ ] Napojit výpočty do UI Receptur (panel + „Nastavit jako cenu“).
- [ ] Sklad: přidat sloupce Pack cost a Yield % do tabulky.
- [ ] FC% badge v nabídce a filtry.
