import type {
  LootCategory,
  LootItem,
  LootRarity,
  ProbabilityMode,
  RollOptions,
  RollResult,
  RolledLootItem,
  LootTable,
} from "../types";

function getRarityWeight(rarity: LootRarity): number {
  if (rarity === "Aucun") return 1;
  if (rarity === "Courant") return 1;
  if (rarity === "Peu courant") return 5;
  if (rarity === "Rare") return 10;
  if (rarity === "Très rare") return 20;
  if (rarity === "Légendaire") return 40;
  if (rarity === "Artéfact") return 60;
  if (rarity === "Unique") return 20;
  return 1;
}

function getValueInCopper(item: LootItem): number {
  if (item.valueCurrency === "pc") return item.valueAmount * 1;
  if (item.valueCurrency === "pa") return item.valueAmount * 10;
  if (item.valueCurrency === "pe") return item.valueAmount * 50;
  if (item.valueCurrency === "po") return item.valueAmount * 100;
  return item.valueAmount * 1000;
}

function getModeFactor(
  system: LootTable["system"],
  lowDistance: number,
  highDistance: number,
  mode: ProbabilityMode
): number {

  if (lowDistance <= 0 || highDistance <= 0) {
    return 0;
  }

  if (mode === "balanced") {
    return 1;
  }

  const softPower = system === "DND5E" ? 1.2 : 1.5;
  const strongPower = system === "DND5E" ? 1.6 : 2;

  if (mode === "low-soft") {
    return Math.pow(highDistance, softPower);
  }

  if (mode === "low-strong") {
    return Math.pow(highDistance, strongPower);
  }

  if (mode === "high-soft") {
    return Math.pow(lowDistance, softPower);
  }

  if (mode === "high-strong") {
    return Math.pow(lowDistance, strongPower);
  }

  return 1;
}

function getEffectiveWeight(
  item: LootItem,
  table: LootTable,
  options: RollOptions
): number {
  const rarityWeight = getRarityWeight(item.rarity);
  const itemValue = getValueInCopper(item);

  if (table.system === "DND5E") {
    const baseWeight = rarityWeight * itemValue;

    const lowDistance = itemValue - options.minValuePc + 1;
    const highDistance = options.maxValuePc - itemValue + 1;
    const valueFactor = getModeFactor(table.system, lowDistance, highDistance, options.probabilityMode);
    return baseWeight * valueFactor;
  }

  if (item.level < options.minLevel || item.level > options.maxLevel) return 0;

  const baseWeight = rarityWeight * itemValue;
  const lowDistance = item.level - options.minLevel + 1;
  const highDistance = options.maxLevel - item.level + 1;
  const levelFactor = getModeFactor(table.system, lowDistance, highDistance, options.probabilityMode);


  return baseWeight * levelFactor;
}

function weightedPick(items: RolledLootItem[]): RolledLootItem | null {
  const totalWeight = items.reduce((sum, item) => sum + item.effectiveWeight, 0);

  if (totalWeight <= 0) {
    return null;
  }

  let roll = Math.random() * totalWeight;

  for (const item of items) {
    roll -= item.effectiveWeight;
    if (roll <= 0) {
      return item;
    }
  }

  return items[items.length - 1] ?? null;
}

export function getAvailableCategories(table: LootTable): LootCategory[] {
  const categories = new Set<LootCategory>();

  for (const item of table.items) {
    categories.add(item.category);
  }

  return Array.from(categories).sort();
}

export function getProbabilityModeLabel(mode: ProbabilityMode): string {
  if (mode === "balanced") return "Équilibré";
  if (mode === "low-soft") return "Favorise légèrement les bas niveaux";
  if (mode === "low-strong") return "Favorise fortement les bas niveaux";
  if (mode === "high-soft") return "Favorise légèrement les hauts niveaux";
  if (mode === "high-strong") return "Favorise fortement les hauts niveaux";
  return "Rareté uniquement";
}

function getRandomInt(min: number, max: number): number {
  if (max <= min) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function rollLootTable(
  table: LootTable,
  options: RollOptions
): RollResult {
  const filteredBaseItems = table.items.filter((item) => {
    const matchesLevel =
      table.system === "DND5E" ||
      (item.level >= options.minLevel && item.level <= options.maxLevel);
    const matchesCategory =
      options.categories.length === 0 ||
      options.categories.includes(item.category);
    const itemValuePc = getValueInCopper(item);
    const matchesValue =
      itemValuePc >= options.minValuePc && itemValuePc <= options.maxValuePc;
    const matchesMagic =
      table.system !== "PF2E" || options.allowMagic || !item.magic;
      
    return matchesLevel && matchesCategory && matchesValue && matchesMagic;
  });

  const weightedItems: RolledLootItem[] = filteredBaseItems
    .map((item) => ({
      ...item,
      effectiveWeight: getEffectiveWeight(item, table, options),

      valueInCopper: getValueInCopper(item),
    }))
    .filter((item) => item.effectiveWeight > 0);

  const pool = [...weightedItems];
  const results: RolledLootItem[] = [];

  const quantity = getRandomInt(options.minQuantity, options.maxQuantity);

  for (let i = 0; i < quantity; i += 1) {
    const picked = weightedPick(pool);

    if (!picked) {
      break;
    }

    results.push(picked);

    if (!options.allowDuplicates) {
      const pickedIndex = pool.findIndex((item) => item.id === picked.id);
      if (pickedIndex >= 0) {
        pool.splice(pickedIndex, 1);
      }
    }
  }

  return {
    tableId: table.id,
    tableName: table.name,
    options,
    items: results,
    rolledAt: new Date().toISOString(),
  };
}