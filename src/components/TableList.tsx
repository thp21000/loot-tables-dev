import type { GameSystem, ItemSortMode, LootTable, TableSortMode } from "../types";
import { useMemo } from "react";
import TableEditor from "./TableEditor";
import { buttons, colors, controls, layout, radius, typography } from "../styles/ui";

type TableListProps = {
  tables: LootTable[];
  editingTableId: string | null;
  onEdit: (tableId: string) => void;
  onDelete: (tableId: string) => void;
  onRoll: (tableId: string) => void;
  onQuickRoll: (tableId: string) => void;
  onDuplicate: (tableId: string) => void;
  onSaveTable: (updatedTable: LootTable) => void;
  onCancelEdit: () => void;
  onShowAlert: (message: string) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  tableSortMode: TableSortMode;
  onTableSortModeChange: (value: TableSortMode) => void;
  expandedTableIds: string[];
  onExpandedTableIdsChange: (value: string[]) => void;
  itemSortModes: Record<string, ItemSortMode>;
  onItemSortModesChange: (value: Record<string, ItemSortMode>) => void;
  canManageTables: boolean;
  currentSystem: GameSystem;
};

const VIEW_ITEM_GRID_TEMPLATE_PF2E = "minmax(160px, 220px) 72px 72px 118px 118px 108px";
const VIEW_ITEM_GRID_TEMPLATE_DND5E = "minmax(160px, 220px) 72px 128px 128px 118px 108px";
const VIEW_ITEM_MIN_WIDTH = "648px";

const viewItemBlockStyle = {
  width: "fit-content",
  minWidth: VIEW_ITEM_MIN_WIDTH,
  margin: 0,
} as const;

const viewItemRowStyle = {
  width: "fit-content",
  minWidth: VIEW_ITEM_MIN_WIDTH,
  margin: 0,
} as const;

const viewItemNameCellStyle = {
  width: "100%",
  maxWidth: "220px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

function getRarityColor(rarity: string): string {
  if (rarity === "Courant") return "#9ca3af";
  if (rarity === "Peu courant") return "#f59e0b";
  if (rarity === "Rare") return "#60a5fa";
  return "#a78bfa";
}

function getRarityRank(rarity: string): number {
  if (rarity === "Courant") return 1;
  if (rarity === "Peu courant") return 2;
  if (rarity === "Rare") return 3;
  return 4;
}

function getValueInCopper(
  valueAmount: number,
  valueCurrency: "pc" | "pa" | "pe" | "po" | "pp"
): number {
  if (valueCurrency === "pc") return valueAmount;
  if (valueCurrency === "pa") return valueAmount * 10;
  if (valueCurrency === "pe") return valueAmount * 50;
  if (valueCurrency === "po") return valueAmount * 100;
  return valueAmount * 1000;
}

function sortTables(tables: LootTable[], mode: TableSortMode): LootTable[] {
  const sorted = [...tables];

  sorted.sort((a, b) => {
    if (mode === "updated-desc") {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }

    if (mode === "updated-asc") {
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }

    if (mode === "name-asc") {
      return a.name.localeCompare(b.name, "fr");
    }

    if (mode === "name-desc") {
      return b.name.localeCompare(a.name, "fr");
    }

    if (mode === "count-desc") {
      return b.items.length - a.items.length;
    }

    return a.items.length - b.items.length;
  });

  return sorted;
}

function sortItems(items: LootTable["items"], mode: ItemSortMode) {
  const sorted = [...items];

  sorted.sort((a, b) => {
    if (mode === "name-asc") {
      return a.name.localeCompare(b.name, "fr");
    }

    if (mode === "name-desc") {
      return b.name.localeCompare(a.name, "fr");
    }

    if (mode === "level-asc") {
      return a.level - b.level;
    }

    if (mode === "level-desc") {
      return b.level - a.level;
    }

    if (mode === "category-asc") {
      return a.category.localeCompare(b.category, "fr");
    }

    if (mode === "category-desc") {
      return b.category.localeCompare(a.category, "fr");
    }

    if (mode === "rarity-asc") {
      return getRarityRank(a.rarity) - getRarityRank(b.rarity);
    }

    if (mode === "rarity-desc") {
      return getRarityRank(b.rarity) - getRarityRank(a.rarity);
    }

    if (mode === "value-asc") {
      return (
        getValueInCopper(a.valueAmount, a.valueCurrency) -
        getValueInCopper(b.valueAmount, b.valueCurrency)
      );
    }

    return (
      getValueInCopper(b.valueAmount, b.valueCurrency) -
      getValueInCopper(a.valueAmount, a.valueCurrency)
    );
  });

  return sorted;
}

export default function TableList({
  tables,
  editingTableId,
  onEdit,
  onDelete,
  onRoll,
  onQuickRoll,
  onDuplicate,
  onSaveTable,
  onCancelEdit,
  onShowAlert,
  searchTerm,
  onSearchTermChange,
  tableSortMode,
  onTableSortModeChange,
  expandedTableIds,
  onExpandedTableIdsChange,
  itemSortModes,
  onItemSortModesChange,
  canManageTables,
  currentSystem,
}: TableListProps) {
  const viewItemGridTemplate =
    currentSystem === "DND5E"
      ? VIEW_ITEM_GRID_TEMPLATE_DND5E
      : VIEW_ITEM_GRID_TEMPLATE_PF2E;
  function toggleExpanded(tableId: string) {
    onExpandedTableIdsChange(
      expandedTableIds.includes(tableId)
        ? expandedTableIds.filter((id) => id !== tableId)
        : [...expandedTableIds, tableId]
    );
  }

  function getItemSortMode(tableId: string): ItemSortMode {
    return itemSortModes[tableId] ?? "level-asc";
  }

  function setItemSortMode(tableId: string, mode: ItemSortMode) {
    onItemSortModesChange({
      ...itemSortModes,
      [tableId]: mode,
    });
  }

  const filteredAndSortedTables = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered =
      normalizedSearch.length === 0
        ? tables
        : tables.filter((table) =>
            table.name.toLowerCase().includes(normalizedSearch)
          );

    return sortTables(filtered, tableSortMode);
  }, [tables, searchTerm, tableSortMode]);

  if (tables.length === 0) {
    return <p style={typography.pageSubtitle}>Aucune table enregistrée.</p>;
  }

  return (
    <div style={{ marginTop: "16px", width: "fit-content", maxWidth: "100%" }}>
      <div
        style={{
          ...layout.toolbarCard,
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <div style={{ width: "420px", maxWidth: "100%" }}>
          <label style={typography.label}>Rechercher une table</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Nom de la table..."
            style={controls.input}
          />
        </div>

        <div style={{ width: "280px", maxWidth: "100%" }}>
          <label style={typography.label}>Trier les tables</label>
          <select
            value={tableSortMode}
            onChange={(event) =>
              onTableSortModeChange(event.target.value as TableSortMode)
            }
            style={controls.select}
          >
            <option value="updated-desc">Modification récente → ancienne</option>
            <option value="updated-asc">Modification ancienne → récente</option>
            <option value="name-asc">Nom A → Z</option>
            <option value="name-desc">Nom Z → A</option>
            <option value="count-desc">Plus d’objets → moins d’objets</option>
            <option value="count-asc">Moins d’objets → plus d’objets</option>
          </select>
        </div>
      </div>

      {filteredAndSortedTables.length === 0 ? (
        <p style={typography.pageSubtitle}>Aucune table ne correspond à la recherche.</p>
      ) : (
        <div style={{ display: "grid", gap: "16px", width: "100%" }}>
          {filteredAndSortedTables.map((table) => {
            const isEditing = editingTableId === table.id;
            const isExpanded = expandedTableIds.includes(table.id);
            const sortedItems = sortItems(
              table.items,
              getItemSortMode(table.id)
            );

            return (
              <div
                key={table.id}
                style={{
                  ...layout.card,
                  width: "100%",
                  maxWidth: "100%",
                }}
              >
                {!isEditing ? (
                  <div>
                    <div>
                      <h3 style={typography.cardTitle}>{table.name}</h3>

                      <p style={{ margin: "0 0 12px 0", textAlign: "center" }}>
                        <button
                          onClick={() => toggleExpanded(table.id)}
                          style={{
                            ...buttons.ghost,
                            border: "none",
                            padding: "0",
                            background: "transparent",
                            textDecoration: "underline",
                            color: colors.primary,
                          }}
                          title={
                            isExpanded
                              ? "Masquer les objets de la table"
                              : "Afficher les objets de la table"
                          }
                        >
                          {isExpanded ? "▼" : "▶"} {table.items.length} objet(s)
                        </button>
                      </p>

                      {canManageTables ? (
                      <div
                        style={{
                          ...layout.centerRow,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                          <button onClick={() => onEdit(table.id)} style={buttons.secondary}>
                            Modifier
                          </button>
                          <button onClick={() => onDelete(table.id)} style={buttons.danger}>
                            Supprimer
                          </button>
                          <button onClick={() => onDuplicate(table.id)} style={buttons.secondary}>
                            Dupliquer
                          </button>
                          <button
                            onClick={() => onQuickRoll(table.id)}
                            title="Tirage rapide"
                            style={{
                              ...buttons.icon,
                              width: "52px",
                              height: "52px",
                              borderRadius: "999px",
                              background: "#f59e0b",
                              border: "none",
                              fontSize: "1.25rem",
                            }}
                          >
                            ⚡
                          </button>
                          <button
                            onClick={() => onRoll(table.id)}
                            title="Lancer la table"
                            style={buttons.launch}
                          >
                            ▶
                          </button>
                        </div>
                      ) : null}

                      {isExpanded && (
                        <div
                          style={{
                            marginTop: "16px",
                            borderTop: `1px solid ${colors.borderSoft}`,
                            paddingTop: "12px",
                            overflowX: "auto",
                          }}
                        >
                          {table.items.length === 0 ? (
                            <p
                              style={{
                                margin: 0,
                                color: colors.textMuted,
                                textAlign: "center",
                              }}
                            >
                              Aucun objet dans cette table.
                            </p>
                          ) : (
                            <div style={viewItemBlockStyle}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  marginBottom: "10px",
                                  width: "100%",
                                }}
                              >
                                <div style={{ width: "220px" }}>
                                  <label style={typography.label}>Trier les objets</label>
                                  <select
                                    value={getItemSortMode(table.id)}
                                    onChange={(event) =>
                                      setItemSortMode(
                                        table.id,
                                        event.target.value as ItemSortMode
                                      )
                                    }
                                    style={controls.select}
                                  >
                                    <option value="level-asc">Niveau croissant</option>
                                    <option value="level-desc">Niveau décroissant</option>
                                    <option value="name-asc">Nom A → Z</option>
                                    <option value="name-desc">Nom Z → A</option>
                                    <option value="category-asc">Catégorie A → Z</option>
                                    <option value="category-desc">Catégorie Z → A</option>
                                    <option value="rarity-asc">Rareté croissante</option>
                                    <option value="rarity-desc">Rareté décroissante</option>
                                    <option value="value-asc">Valeur croissante</option>
                                    <option value="value-desc">Valeur décroissante</option>
                                  </select>
                                </div>
                              </div>

                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: viewItemGridTemplate,
                                  gap: "8px",
                                  alignItems: "center",
                                  padding: "8px",
                                  marginBottom: "8px",
                                  fontWeight: "bold",
                                  color: colors.textSoft,
                                  textAlign: "left",
                                  ...viewItemRowStyle,
                                }}
                              >
                                <div>Nom</div>
                                <div>Fiche</div>
                                {currentSystem === "PF2E" ? <div>Niveau</div> : null}
                                <div>Catégorie</div>
                                {currentSystem === "DND5E" ? <div>Type</div> : null}
                                <div>Rareté</div>
                                <div>Montant</div>
                              </div>

                              <div style={{ display: "grid", gap: "8px" }}>
                                {sortedItems.map((item) => (
                                  <div
                                    key={item.id}
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: viewItemGridTemplate,
                                      gap: "8px",
                                      alignItems: "center",
                                      padding: "10px",
                                      border: `1px solid ${colors.borderSoft}`,
                                      borderRadius: radius.md,
                                      background: colors.cardBgAlt,
                                      textAlign: "left",
                                      ...viewItemRowStyle,
                                    }}
                                  >
                                    <div style={viewItemNameCellStyle} title={item.name || "Sans nom"}>
                                      <strong>{item.name || "Sans nom"}</strong>
                                    </div>

                                    <div>
                                      {item.url ? (
                                        <a
                                          href={item.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{ color: colors.primary }}
                                        >
                                          Fiche
                                        </a>
                                      ) : (
                                        "—"
                                      )}
                                    </div>

                                    {currentSystem === "PF2E" ? <div>Niv. {item.level}</div> : null}
                                    <div>{item.category}</div>
                                    {currentSystem === "DND5E" ? (
                                      <div>{item.type || "Aucun"}</div>
                                    ) : null}
                                    <div
                                      style={{
                                        color: getRarityColor(item.rarity),
                                        fontWeight: 700,
                                      }}
                                    >
                                      {item.rarity}
                                    </div>
                                    <div>{item.valueAmount} {item.valueCurrency}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <TableEditor
                    table={table}
                    currentSystem={currentSystem}
                    onSave={onSaveTable}
                    onCancel={onCancelEdit}
                    onShowAlert={onShowAlert}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}