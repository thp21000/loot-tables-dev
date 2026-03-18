export type LootCategory =
  | "Arme"
  | "Armure"
  | "Consommable"
  | "Contenant"
  | "Equipement"
  | "Trésor"
  | "Autre";

export type LootRarity = "Courant" | "Peu courant" | "Rare" | "Unique";

export type LootCurrency = "pc" | "pa" | "po" | "pp";

export type ProbabilityMode =
  | "balanced"
  | "low-soft"
  | "low-strong"
  | "rarity-only";

export type TableSortMode =
  | "updated-desc"
  | "updated-asc"
  | "name-asc"
  | "name-desc"
  | "count-desc"
  | "count-asc";

export type ItemSortMode =
  | "name-asc"
  | "name-desc"
  | "level-asc"
  | "level-desc"
  | "category-asc"
  | "category-desc"
  | "rarity-asc"
  | "rarity-desc"
  | "value-asc"
  | "value-desc";

export type ImportMode = "append" | "replace";

export type OwlbearPlayerRole = "GM" | "PLAYER" | "UNKNOWN";

export type LootItem = {
  id: string;
  name: string;
  url: string;
  level: number;
  category: LootCategory;
  rarity: LootRarity;
  valueAmount: number;
  valueCurrency: LootCurrency;
};

export type LootTable = {
  id: string;
  name: string;
  items: LootItem[];
  createdAt: string;
  updatedAt: string;
};

export type RollOptions = {
  maxLevel: number;
  quantity: number;
  categories: LootCategory[];
  allowDuplicates: boolean;
  probabilityMode: ProbabilityMode;
};

export type RolledLootItem = LootItem & {
  effectiveWeight: number;
  valueInCopper: number;
};

export type RollResult = {
  tableId: string;
  tableName: string;
  options: RollOptions;
  items: RolledLootItem[];
  rolledAt: string;
};

export type UIState = {
  searchTerm: string;
  tableSortMode: TableSortMode;
  expandedTableIds: string[];
  itemSortModes: Record<string, ItemSortMode>;
  lastRollOptions: RollOptions;
};

export type ImportItemsResult = {
  importedCount: number;
  skippedDuplicatesCount: number;
  replaced: boolean;
};

export type ValidatedRollSummaryItem = {
  name: string;
  url: string;
  level: number;
  category: LootCategory;
  rarity: LootRarity;
  valueAmount: number;
  valueCurrency: LootCurrency;
};

export type ValidatedRollSummary = {
  tableId: string;
  tableName: string;
  validatedAt: string;
  validatedBy?: string | null;
  items: ValidatedRollSummaryItem[];
};

export type OwlbearRoomState = {
  lastOpenedAt?: string;
  lastRollTableId?: string | null;
  sharedNote?: string;
  lastValidatedRoll?: ValidatedRollSummary | null;
};

export type OwlbearContextState = {
  isOwlbearReady: boolean;
  roomId: string | null;
};

export type ValidatedRollBroadcast = {
  type: "validated-roll";
  payload: ValidatedRollSummary;
};