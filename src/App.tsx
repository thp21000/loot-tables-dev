import { useEffect, useRef, useState } from "react";
import type {
  ImportItemsResult,
  ImportMode,
  ItemSortMode,
  LootItem,
  LootTable,
  OwlbearContextState,
  OwlbearPlayerRole,
  OwlbearRoomState,
  RollOptions,
  RollResult,
  TableSortMode,
  ValidatedRollSummary,
} from "./types";
import {
  duplicateTable,
  exportSingleTableToCsv,
  exportSingleTableToJson,
  exportTablesToJson,
  importItemsFromCsvFile,
  importSingleTableFromCsv,
  importTablesFromFile,
  loadTables,
  loadUIState,
  mergeImportedTables,
  saveTables,
  saveUIState,
} from "./utils/storage";
import TableList from "./components/TableList";
import RollDialog from "./components/RollDialog";
import ResultDialog from "./components/ResultDialog";
import ConfirmModal from "./components/ConfirmModal";
import AlertModal from "./components/AlertModal";
import { getAvailableCategories, rollLootTable } from "./utils/loot";
import { buttons, colors, layout, typography } from "./styles/ui";
import {
  getOwlbearPlayerName,
  getOwlbearPlayerRole,
  getOwlbearRoomId,
  getRoomState,
  notifyInfo,
  notifySuccess,
  openValidatedRollModal,
  publishValidatedRoll,
  setRoomState,
  setOwlbearPopoverWidth,
  subscribeToRoomState,
  subscribeToValidatedRolls,
} from "./owlbear";

function getItemSignature(item: Omit<LootItem, "id"> | LootItem): string {
  return [
    item.name.trim().toLowerCase(),
    item.level,
    item.category,
    item.rarity,
    item.valueAmount,
    item.valueCurrency,
    item.url.trim().toLowerCase(),
  ].join("||");
}

function mergeItemsWithDuplicateFilter(
  existingItems: LootItem[],
  importedItems: LootItem[],
  mode: ImportMode
): ImportItemsResult & { nextItems: LootItem[] } {
  if (mode === "replace") {
    const seen = new Set<string>();
    const dedupedImported: LootItem[] = [];

    for (const item of importedItems) {
      const signature = getItemSignature(item);

      if (seen.has(signature)) {
        continue;
      }

      seen.add(signature);
      dedupedImported.push(item);
    }

    return {
      nextItems: dedupedImported,
      importedCount: dedupedImported.length,
      skippedDuplicatesCount: importedItems.length - dedupedImported.length,
      replaced: true,
    };
  }

  const seen = new Set(existingItems.map((item) => getItemSignature(item)));
  const appended: LootItem[] = [];
  let skippedDuplicatesCount = 0;

  for (const item of importedItems) {
    const signature = getItemSignature(item);

    if (seen.has(signature)) {
      skippedDuplicatesCount += 1;
      continue;
    }

    seen.add(signature);
    appended.push(item);
  }

  return {
    nextItems: [...existingItems, ...appended],
    importedCount: appended.length,
    skippedDuplicatesCount,
    replaced: false,
  };
}

function buildValidatedSummary(
  result: RollResult,
  validatedBy?: string | null
): ValidatedRollSummary {
  return {
    tableId: result.tableId,
    tableName: result.tableName,
    validatedAt: new Date().toISOString(),
    validatedBy: validatedBy ?? null,
    items: result.items.map((item) => ({
      name: item.name,
      url: item.url,
      level: item.level,
      category: item.category,
      rarity: item.rarity,
      valueAmount: item.valueAmount,
      valueCurrency: item.valueCurrency,
    })),
  };
}

function formatValidatedRollMessage(summary: ValidatedRollSummary): string {
  const prefix = summary.validatedBy
    ? `${summary.validatedBy} a validé un tirage`
    : "Un tirage a été validé";

  if (summary.items.length === 0) {
    return `${prefix} : aucun objet trouvé.`;
  }

  const itemList = summary.items.map((item) => item.name).join(", ");

  return `${prefix} : ${itemList}`;
}

function getRoleLabel(role: OwlbearPlayerRole): string {
  if (role === "GM") return "MJ";
  if (role === "PLAYER") return "Joueur";
  return "Inconnu";
}

export default function App() {
  const initialUIState = loadUIState();

  const [tables, setTables] = useState<LootTable[]>(() => loadTables());
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [rollingTableId, setRollingTableId] = useState<string | null>(null);
  const [lastRollTableId, setLastRollTableId] = useState<string | null>(null);
  const [lastRollOptions, setLastRollOptions] = useState<RollOptions>(
    initialUIState.lastRollOptions
  );
  const [rollResult, setRollResult] = useState<RollResult | null>(null);
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
  const [tableIdToDelete, setTableIdToDelete] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState(initialUIState.searchTerm);
  const [tableSortMode, setTableSortMode] = useState<TableSortMode>(
    initialUIState.tableSortMode
  );
  const [expandedTableIds, setExpandedTableIds] = useState<string[]>(
    initialUIState.expandedTableIds
  );
  const [itemSortModes, setItemSortModes] = useState<Record<string, ItemSortMode>>(
    initialUIState.itemSortModes
  );

  const [owlbearContext, setOwlbearContext] = useState<OwlbearContextState>({
    isOwlbearReady: false,
    roomId: null,
  });
  const [playerRole, setPlayerRole] = useState<OwlbearPlayerRole>("UNKNOWN");
  const [roomState, setLocalRoomState] = useState<OwlbearRoomState>({});

  const importInputRef = useRef<HTMLInputElement | null>(null);
  const importCsvInputRef = useRef<HTMLInputElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveTables(tables);
  }, [tables]);

  useEffect(() => {
    saveUIState({
      searchTerm,
      tableSortMode,
      expandedTableIds,
      itemSortModes,
      lastRollOptions,
    });
  }, [searchTerm, tableSortMode, expandedTableIds, itemSortModes, lastRollOptions]);

  useEffect(() => {
    let unsubscribeRoom: (() => void) | null = null;
    let unsubscribeBroadcast: (() => void) | null = null;

    async function initOwlbearContext() {
      const roomId = await getOwlbearRoomId();
      const role = await getOwlbearPlayerRole();
      const currentRoomState = await getRoomState();

      setOwlbearContext({
        isOwlbearReady: true,
        roomId,
      });
      setPlayerRole(role);
      setLocalRoomState(currentRoomState);

      await setRoomState({
        lastOpenedAt: new Date().toISOString(),
      });

      unsubscribeRoom = subscribeToRoomState((nextState) => {
        setLocalRoomState(nextState);
      });

      unsubscribeBroadcast = subscribeToValidatedRolls((summary) => {
        void notifyInfo(formatValidatedRollMessage(summary));
        void openValidatedRollModal(summary);
      });
    }

    initOwlbearContext().catch((error) => {
      console.error("Initialisation du contexte Owlbear impossible :", error);
    });

    return () => {
      if (unsubscribeRoom) {
        unsubscribeRoom();
      }
      if (unsubscribeBroadcast) {
        unsubscribeBroadcast();
      }
    };
  }, []);

  useEffect(() => {
    if (!owlbearContext.isOwlbearReady) {
      return;
    }

    const contentElement = contentRef.current;

    if (!contentElement) {
      return;
    }

    let animationFrameId = 0;

    const syncPopoverWidth = () => {
      cancelAnimationFrame(animationFrameId);

      animationFrameId = window.requestAnimationFrame(() => {
        const popoverHorizontalPadding = 56;
        const measuredWidth = Math.ceil(contentElement.scrollWidth + popoverHorizontalPadding);
        const nextWidth = Math.max(640, Math.min(1400, measuredWidth));
        void setOwlbearPopoverWidth(nextWidth);
      });
    };

    syncPopoverWidth();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            syncPopoverWidth();
          })
        : null;

    resizeObserver?.observe(contentElement);
    window.addEventListener("resize", syncPopoverWidth);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", syncPopoverWidth);
    };
  }, [owlbearContext.isOwlbearReady, tables, editingTableId, expandedTableIds, playerRole]);

  function handleCreateTable() {
    const now = new Date().toISOString();

    const newTable: LootTable = {
      id: crypto.randomUUID(),
      name: `Nouvelle table ${tables.length + 1}`,
      items: [],
      createdAt: now,
      updatedAt: now,
    };

    setTables((prev) => [...prev, newTable]);
    setEditingTableId(newTable.id);
  }

  function handleDeleteTable(tableId: string) {
    setTableIdToDelete(tableId);
  }

  function confirmDeleteTable() {
    if (!tableIdToDelete) {
      return;
    }

    const tableId = tableIdToDelete;

    setTables((prev) => prev.filter((table) => table.id !== tableId));

    if (editingTableId === tableId) {
      setEditingTableId(null);
    }

    if (rollingTableId === tableId) {
      setRollingTableId(null);
    }

    if (lastRollTableId === tableId) {
      setLastRollTableId(null);
      setRollResult(null);
    }

    setExpandedTableIds((prev) => prev.filter((id) => id !== tableId));

    setItemSortModes((prev) => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });

    setTableIdToDelete(null);
  }

  function cancelDeleteTable() {
    setTableIdToDelete(null);
  }

  function handleEditTable(tableId: string) {
    setEditingTableId(tableId);
  }

  function handleRollTable(tableId: string) {
    if (playerRole !== "GM") {
      setAlertMessage("Seul le MJ peut lancer un tirage.");
      return;
    }
    setRollingTableId(tableId);
  }

  async function persistLastRollTableId(tableId: string) {
    try {
      await setRoomState({ lastRollTableId: tableId });
    } catch (error) {
      console.error("Impossible de sauvegarder lastRollTableId dans Owlbear :", error);
    }
  }

  function pushHistory(result: RollResult) {
    setRollHistory((prev) => [result, ...prev].slice(0, 10));
  }

  function handleQuickRollTable(tableId: string) {
    if (playerRole !== "GM") {
      setAlertMessage("Seul le MJ peut lancer un tirage.");
      return;
    }

    const table = tables.find((entry) => entry.id === tableId);

    if (!table) {
      return;
    }

    const result = rollLootTable(table, lastRollOptions);

    setLastRollTableId(table.id);
    void persistLastRollTableId(table.id);
    setRollResult(result);
    pushHistory(result);
  }

  function handleDuplicateTable(tableId: string) {
    const table = tables.find((entry) => entry.id === tableId);
    if (!table) return;

    const duplicated = duplicateTable(table);
    setTables((prev) => [...prev, duplicated]);
    setAlertMessage(`Table dupliquée : ${duplicated.name}`);
  }

  function handleExportSingleTableJson(tableId: string) {
    const table = tables.find((entry) => entry.id === tableId);
    if (!table) return;

    exportSingleTableToJson(table);
    setAlertMessage(`Export JSON prêt pour : ${table.name}`);
  }

  function handleExportSingleTableCsv(tableId: string) {
    const table = tables.find((entry) => entry.id === tableId);
    if (!table) return;

    exportSingleTableToCsv(table);
    setAlertMessage(`Export CSV prêt pour : ${table.name}`);
  }

  function handleSaveEditedTable(updatedTable: LootTable) {
    setTables((prev) =>
      prev.map((table) => (table.id === updatedTable.id ? updatedTable : table))
    );
    setEditingTableId(null);
    setAlertMessage(`Table enregistrée : ${updatedTable.name}`);
  }

  function handleCancelEdit() {
    setEditingTableId(null);
  }

  async function handleImportCsvIntoTable(
    tableId: string,
    file: File,
    mode: ImportMode
  ) {
    try {
      const importedItems = await importItemsFromCsvFile(file);

      const tableToUpdate = tables.find((table) => table.id === tableId);

      if (!tableToUpdate) {
        setAlertMessage("Table introuvable pour l’import CSV.");
        return;
      }

      const merged = mergeItemsWithDuplicateFilter(
        tableToUpdate.items,
        importedItems,
        mode
      );

      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId
            ? {
                ...table,
                items: merged.nextItems,
                updatedAt: new Date().toISOString(),
              }
            : table
        )
      );

      const baseMessage = merged.replaced
        ? `Import terminé : ${merged.importedCount} objet(s) chargés en remplacement.`
        : `Import terminé : ${merged.importedCount} objet(s) ajoutés.`;

      const duplicateMessage =
        merged.skippedDuplicatesCount > 0
          ? ` ${merged.skippedDuplicatesCount} doublon(s) ignoré(s).`
          : "";

      setAlertMessage(baseMessage + duplicateMessage);
    } catch (error) {
      console.error(error);
      setAlertMessage("Impossible d’importer ce CSV dans la table.");
    }
  }

  function handleCloseRollDialog() {
    setRollingTableId(null);
  }

  function handleConfirmRoll(options: RollOptions) {
    const table = tables.find((entry) => entry.id === rollingTableId);

    if (!table) {
      return;
    }

    const result = rollLootTable(table, options);

    setLastRollTableId(table.id);
    void persistLastRollTableId(table.id);
    setLastRollOptions(options);
    setRollResult(result);
    pushHistory(result);
    setRollingTableId(null);
  }

  async function handleValidateRoll() {
    if (playerRole !== "GM") {
      setAlertMessage("Seul le MJ peut valider un tirage.");
      return;
    }

    if (!rollResult) {
      return;
    }

    const validatedBy = await getOwlbearPlayerName();
    const summary = buildValidatedSummary(rollResult, validatedBy);

    await publishValidatedRoll(summary);
    await notifySuccess(formatValidatedRollMessage(summary));
    setAlertMessage("Tirage validé et partagé à tous.");
  }

  function handleCloseResultDialog() {
    setRollResult(null);
  }

  function handleReroll() {
    if (!lastRollTableId) {
      return;
    }

    const table = tables.find((entry) => entry.id === lastRollTableId);

    if (!table) {
      return;
    }

    const result = rollLootTable(table, lastRollOptions);
    setRollResult(result);
    pushHistory(result);
  }

  function handleExportTables() {
    exportTablesToJson(tables);
    setAlertMessage("Export JSON global effectué.");
  }

  function handleClickImport() {
    importInputRef.current?.click();
  }

  function handleClickImportCsv() {
    importCsvInputRef.current?.click();
  }

  async function handleImportFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const importedTables = await importTablesFromFile(file);
      const mergedTables = mergeImportedTables(tables, importedTables);

      setTables(mergedTables);
      setAlertMessage(`${importedTables.length} table(s) importée(s) avec succès.`);
    } catch (error) {
      console.error(error);
      setAlertMessage("Le fichier importé n’est pas valide.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleImportCsvFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const importedTable = await importSingleTableFromCsv(file);
      setTables((prev) => [...prev, importedTable]);
      setAlertMessage(`Table CSV importée : ${importedTable.name}`);
    } catch (error) {
      console.error(error);
      setAlertMessage("Le fichier CSV importé n’est pas valide.");
    } finally {
      event.target.value = "";
    }
  }

  const rollingTable =
    rollingTableId === null
      ? null
      : tables.find((table) => table.id === rollingTableId) ?? null;

  const canManageTables = playerRole === "GM";

  return (
    <div
      style={{
        ...layout.page,
        width: "max-content",
        minWidth: "100%",
        maxWidth: "none",
        minHeight: "100vh",
        padding: "16px 18px 10px",
        boxSizing: "border-box",
        background: colors.pageBg,
      }}
    >
      <div
        ref={contentRef}
        style={{
          width: "max-content",
          maxWidth: "none",
          paddingBottom: "8px",
          boxSizing: "border-box",
          background: colors.pageBg,
        }}
      >
          <h1 style={{ ...typography.pageTitle, marginBottom: "4px" }}>
            Loot Tables
          </h1>

          <p style={{ ...typography.pageSubtitle, marginBottom: "14px" }}>
            Nombre de tables enregistrées : {tables.length}
          </p>

          {canManageTables ? (
            <div style={{ ...layout.topBar, marginBottom: "14px" }}>
              <button onClick={handleCreateTable} style={buttons.primary}>
                Créer une nouvelle table
              </button>
              <button onClick={handleExportTables} style={buttons.secondary}>
                Exporter tout en JSON
              </button>
              <button onClick={handleClickImport} style={buttons.secondary}>
                Importer JSON global
              </button>
              <button onClick={handleClickImportCsv} style={buttons.secondary}>
                Importer un CSV en nouvelle table
              </button>
            </div>
          ) : null}

          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFileChange}
            style={{ display: "none" }}
          />

          <input
            ref={importCsvInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportCsvFileChange}
            style={{ display: "none" }}
          />

<div style={{ width: "fit-content", maxWidth: "100%" }}>
            <TableList
              tables={tables}
              editingTableId={editingTableId}
              onEdit={handleEditTable}
              onDelete={handleDeleteTable}
              onRoll={handleRollTable}
              onQuickRoll={handleQuickRollTable}
              onDuplicate={handleDuplicateTable}
              onExportTableJson={handleExportSingleTableJson}
              onExportTableCsv={handleExportSingleTableCsv}
              onSaveTable={handleSaveEditedTable}
              onCancelEdit={handleCancelEdit}
              onImportCsvIntoTable={handleImportCsvIntoTable}
              onShowAlert={(message) => setAlertMessage(message)}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              tableSortMode={tableSortMode}
              onTableSortModeChange={setTableSortMode}
              expandedTableIds={expandedTableIds}
              onExpandedTableIdsChange={setExpandedTableIds}
              itemSortModes={itemSortModes}
              onItemSortModesChange={setItemSortModes}
              canManageTables={canManageTables}
            />

            <div
              style={{
                width: "100%",
                marginTop: "12px",
                paddingTop: "8px",
                borderTop: `1px solid ${colors.borderSoft}`,
                display: "grid",
                gap: "6px",
                color: colors.textMuted,
                fontSize: "0.82rem",
                lineHeight: 1.2,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  gap: "6px 14px",
                }}
              >
                <span>Mode : {getRoleLabel(playerRole)}</span>
                <span>Owlbear : {owlbearContext.isOwlbearReady ? "connecté" : "initialisation"}</span>
                {owlbearContext.roomId ? (
                  <span style={{ overflowWrap: "anywhere" }}>
                    Room : {owlbearContext.roomId}
                  </span>
                ) : null}
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  gap: "6px 14px",
                }}
              >
                {roomState.lastOpenedAt ? (
                  <span>
                    Dernière ouverture : {new Date(roomState.lastOpenedAt).toLocaleString()}
                  </span>
                ) : null}
                {roomState.lastValidatedRoll ? (
                  <span>Dernier gain : {roomState.lastValidatedRoll.tableName}</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

      <RollDialog
        isOpen={rollingTable !== null}
        tableName={rollingTable?.name ?? ""}
        availableCategories={
          rollingTable ? getAvailableCategories(rollingTable) : []
        }
        initialOptions={lastRollOptions}
        onClose={handleCloseRollDialog}
        onConfirm={handleConfirmRoll}
        onShowAlert={(message) => setAlertMessage(message)}
      />

      <ResultDialog
        isOpen={rollResult !== null}
        result={rollResult}
        history={rollHistory}
        onClose={handleCloseResultDialog}
        onReroll={handleReroll}
        onValidate={handleValidateRoll}
        onShowAlert={(message) => setAlertMessage(message)}
        playerRole={playerRole}
      />

      <ConfirmModal
        isOpen={tableIdToDelete !== null}
        title="Supprimer la table"
        message="Voulez-vous vraiment supprimer cette table ?"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={confirmDeleteTable}
        onCancel={cancelDeleteTable}
      />

      <AlertModal
        isOpen={alertMessage !== null}
        title="Information"
        message={alertMessage ?? ""}
        onClose={() => setAlertMessage(null)}
      />
    </div>
  );
}