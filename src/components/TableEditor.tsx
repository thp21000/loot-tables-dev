import { useEffect, useRef, useState } from "react";
import type {
  ImportMode,
  LootCategory,
  LootCurrency,
  LootItem,
  LootRarity,
  LootTable,
} from "../types";
import { buttons, colors, controls, layout, radius, typography } from "../styles/ui";
import ConfirmModal from "./ConfirmModal";

type TableEditorProps = {
  table: LootTable;
  onSave: (updatedTable: LootTable) => void;
  onCancel: () => void;
  onImportCsvIntoTable: (
    tableId: string,
    file: File,
    mode: ImportMode
  ) => Promise<void>;
  onShowAlert: (message: string) => void;
};

type EditableLootItem = LootItem & {
  isEditing: boolean;
  isNew?: boolean;
};

const CATEGORY_OPTIONS: LootCategory[] = [
  "Arme",
  "Armure",
  "Consommable",
  "Contenant",
  "Equipement",
  "Trésor",
  "Autre",
];

const RARITY_OPTIONS: LootRarity[] = [
  "Courant",
  "Peu courant",
  "Rare",
  "Unique",
];

const CURRENCY_OPTIONS: LootCurrency[] = ["pc", "pa", "po", "pp"];

function createEmptyItem(): EditableLootItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    url: "",
    level: 0,
    category: "Autre",
    rarity: "Courant",
    valueAmount: 0,
    valueCurrency: "pc",
    isEditing: true,
    isNew: true,
  };
}

function getRarityColor(rarity: LootRarity): string {
  if (rarity === "Courant") return "#9ca3af";
  if (rarity === "Peu courant") return "#f59e0b";
  if (rarity === "Rare") return "#60a5fa";
  return "#a78bfa";
}

function normalizePastedCategory(value: string): LootCategory {
  if (
    value === "Arme" ||
    value === "Armure" ||
    value === "Consommable" ||
    value === "Contenant" ||
    value === "Equipement" ||
    value === "Trésor"
  ) {
    return value;
  }
  return "Autre";
}

function normalizePastedRarity(value: string): LootRarity {
  if (
    value === "Courant" ||
    value === "Peu courant" ||
    value === "Rare" ||
    value === "Unique"
  ) {
    return value;
  }
  return "Courant";
}

function normalizePastedCurrency(value: string): LootCurrency {
  if (value === "pc" || value === "pa" || value === "po" || value === "pp") {
    return value;
  }
  return "pc";
}

function parsePastedRows(text: string): LootItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  return lines.map((line) => {
    const parts = line.split("\t");

    return {
      id: crypto.randomUUID(),
      name: (parts[0] ?? "").trim(),
      url: (parts[1] ?? "").trim(),
      level: Number(parts[2]) || 0,
      category: normalizePastedCategory((parts[3] ?? "").trim()),
      rarity: normalizePastedRarity((parts[4] ?? "").trim()),
      valueAmount: Number(parts[5]) || 0,
      valueCurrency: normalizePastedCurrency((parts[6] ?? "").trim()),
    };
  });
}

export default function TableEditor({
  table,
  onSave,
  onCancel,
  onImportCsvIntoTable,
  onShowAlert,
}: TableEditorProps) {
  const [name, setName] = useState(table.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [items, setItems] = useState<EditableLootItem[]>([]);
  const [pasteArea, setPasteArea] = useState("");
  const [isPasteAreaOpen, setIsPasteAreaOpen] = useState(false);
  const [pendingCsvFile, setPendingCsvFile] = useState<File | null>(null);

  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(table.name);
    setIsEditingName(false);
    setPasteArea("");
    setIsPasteAreaOpen(false);
    setPendingCsvFile(null);
    setItems(
      table.items.map((item) => ({
        ...item,
        isEditing: false,
      }))
    );
  }, [table]);

  function handleAddItem() {
    setItems((prev) => [...prev, createEmptyItem()]);
  }

  function handleDeleteItem(itemId: string) {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  function handleDuplicateItem(itemId: string) {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;

    const duplicated: EditableLootItem = {
      ...item,
      id: crypto.randomUUID(),
      name: `${item.name} (copie)`,
      isEditing: false,
      isNew: false,
    };

    setItems((prev) => [...prev, duplicated]);
  }

  function handleEditItem(itemId: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isEditing: true } : item
      )
    );
  }

  function handleValidateItem(itemId: string) {
    const item = items.find((entry) => entry.id === itemId);

    if (!item) return;

    if (!item.name.trim()) {
      onShowAlert("Le nom de l’objet est obligatoire.");
      return;
    }

    if (item.level < 0 || Number.isNaN(item.level)) {
      onShowAlert("Le niveau doit être un nombre valide.");
      return;
    }

    if (item.valueAmount < 0 || Number.isNaN(item.valueAmount)) {
      onShowAlert("La valeur doit être un nombre valide.");
      return;
    }

    setItems((prev) =>
      prev.map((entry) =>
        entry.id === itemId
          ? {
              ...entry,
              name: entry.name.trim(),
              url: entry.url.trim(),
              level: Number(entry.level) || 0,
              valueAmount: Number(entry.valueAmount) || 0,
              isEditing: false,
              isNew: false,
            }
          : entry
      )
    );
  }

  function handleItemChange<K extends keyof EditableLootItem>(
    itemId: string,
    field: K,
    value: EditableLootItem[K]
  ) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function handleCsvImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setPendingCsvFile(file);
    event.target.value = "";
  }

  async function confirmCsvImport(mode: ImportMode) {
    if (!pendingCsvFile) {
      return;
    }

    try {
      await onImportCsvIntoTable(table.id, pendingCsvFile, mode);
    } catch (error) {
      console.error(error);
      onShowAlert("Impossible d’importer ce CSV dans la table.");
    } finally {
      setPendingCsvFile(null);
    }
  }

  function cancelCsvImport() {
    setPendingCsvFile(null);
  }

  function handlePasteImport() {
    const importedItems = parsePastedRows(pasteArea).filter(
      (item) => item.name.trim() !== ""
    );

    if (importedItems.length === 0) {
      onShowAlert("Aucune ligne exploitable à importer.");
      return;
    }

    const importedEditableItems: EditableLootItem[] = importedItems.map(
      (item) => ({
        ...item,
        isEditing: false,
        isNew: false,
      })
    );

    setItems((prev) => [...prev, ...importedEditableItems]);
    setPasteArea("");
    setIsPasteAreaOpen(false);
    onShowAlert(
      `${importedEditableItems.length} objet(s) ajouté(s) depuis le collage.`
    );
  }

  function handleSaveTable() {
    const cleanedName = name.trim();

    if (!cleanedName) {
      onShowAlert("Le nom de la table est obligatoire.");
      return;
    }

    const hasEditingRow = items.some((item) => item.isEditing);
    if (hasEditingRow) {
      onShowAlert(
        "Il reste au moins une ligne d’objet en cours de modification. Valide ou supprime cette ligne avant d’enregistrer la table."
      );
      return;
    }

    const cleanedItems: LootItem[] = items.map((item) => ({
      id: item.id,
      name: item.name.trim(),
      url: item.url.trim(),
      level: Number(item.level) || 0,
      category: item.category,
      rarity: item.rarity,
      valueAmount: Number(item.valueAmount) || 0,
      valueCurrency: item.valueCurrency,
    }));

    const updatedTable: LootTable = {
      ...table,
      name: cleanedName,
      items: cleanedItems,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedTable);
  }

  return (
    <div style={{ width: "100%", overflow: "visible" }}>
      <div style={{ marginBottom: "16px", textAlign: "center" }}>
        {!isEditingName ? (
          <div style={{ ...layout.centerRow }}>
            <h2 style={{ ...typography.cardTitle, margin: 0 }}>{name}</h2>
            <button
              onClick={() => setIsEditingName(true)}
              title="Modifier le nom"
              style={buttons.icon}
            >
              ✏️
            </button>
          </div>
        ) : (
          <div style={layout.centerRow}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              style={{ ...controls.input, minWidth: "320px", maxWidth: "420px" }}
            />
            <button onClick={() => setIsEditingName(false)} style={buttons.primary}>
              ✅
            </button>
          </div>
        )}
      </div>

      <div style={{ ...layout.centerRow, marginBottom: "16px" }}>
        <button onClick={handleAddItem} style={buttons.primary}>
          Ajouter une ligne d’objet
        </button>
        <button
          onClick={() => importInputRef.current?.click()}
          style={buttons.secondary}
        >
          Importer un CSV dans cette table
        </button>
      </div>

      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleCsvImport}
        style={{ display: "none" }}
      />

      <div style={{ ...layout.sectionCard, marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => setIsPasteAreaOpen((prev) => !prev)}
            style={buttons.secondary}
          >
            {isPasteAreaOpen
              ? "▼ Masquer le collage multiple depuis Excel"
              : "▶ Afficher le collage multiple depuis Excel"}
          </button>
        </div>

        {isPasteAreaOpen && (
          <div style={{ marginTop: "12px" }}>
            <h3 style={typography.cardTitle}>Collage multiple depuis Excel</h3>
            <p style={{ ...typography.pageSubtitle, marginBottom: "12px" }}>
              Colle des lignes tabulées dans cet ordre : nom, url, level,
              category, rarity, valueAmount, valueCurrency
            </p>

            <textarea
              value={pasteArea}
              onChange={(event) => setPasteArea(event.target.value)}
              rows={6}
              style={controls.textarea}
            />

            <div style={{ marginTop: "10px", textAlign: "center" }}>
              <button onClick={handlePasteImport} style={buttons.primary}>
                Importer le collage dans cette table
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 2fr 90px 140px 140px 110px 90px auto",
          gap: "8px",
          alignItems: "center",
          padding: "10px",
          marginBottom: "8px",
          fontWeight: "bold",
          color: colors.textSoft,
          minWidth: "1140px",
          textAlign: "center",
        }}
      >
        <div>Nom</div>
        <div>Fiche</div>
        <div>Niveau</div>
        <div>Catégorie</div>
        <div>Rareté</div>
        <div>Montant</div>
        <div>Devise</div>
        <div>Actions</div>
      </div>

      <div style={{ display: "grid", gap: "8px" }}>
        {items.map((item) => {
          if (item.isEditing) {
            return (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "2fr 2fr 90px 140px 140px 110px 90px auto",
                  gap: "8px",
                  alignItems: "center",
                  padding: "10px",
                  border: `1px solid ${colors.borderSoft}`,
                  borderRadius: radius.md,
                  background: colors.cardBgAlt,
                  minWidth: "1140px",
                }}
              >
                <input
                  placeholder="Nom"
                  value={item.name}
                  onChange={(event) =>
                    handleItemChange(item.id, "name", event.target.value)
                  }
                  style={{ ...controls.input, textAlign: "center" }}
                />

                <input
                  placeholder="Lien fiche"
                  value={item.url}
                  onChange={(event) =>
                    handleItemChange(item.id, "url", event.target.value)
                  }
                  style={{ ...controls.input, textAlign: "center" }}
                />

                <input
                  type="number"
                  min="0"
                  value={item.level}
                  onChange={(event) =>
                    handleItemChange(
                      item.id,
                      "level",
                      Number(event.target.value)
                    )
                  }
                  style={{ ...controls.input, textAlign: "center" }}
                />

                <select
                  value={item.category}
                  onChange={(event) =>
                    handleItemChange(
                      item.id,
                      "category",
                      event.target.value as LootCategory
                    )
                  }
                  style={{ ...controls.select, textAlign: "center" }}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <select
                  value={item.rarity}
                  onChange={(event) =>
                    handleItemChange(
                      item.id,
                      "rarity",
                      event.target.value as LootRarity
                    )
                  }
                  style={{ ...controls.select, textAlign: "center" }}
                >
                  {RARITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  value={item.valueAmount}
                  onChange={(event) =>
                    handleItemChange(
                      item.id,
                      "valueAmount",
                      Number(event.target.value)
                    )
                  }
                  style={{ ...controls.input, textAlign: "center" }}
                />

                <select
                  value={item.valueCurrency}
                  onChange={(event) =>
                    handleItemChange(
                      item.id,
                      "valueCurrency",
                      event.target.value as LootCurrency
                    )
                  }
                  style={{ ...controls.select, textAlign: "center" }}
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <div style={layout.centerRow}>
                  <button
                    title="Valider"
                    onClick={() => handleValidateItem(item.id)}
                    style={buttons.primary}
                  >
                    ✅
                  </button>
                  <button
                    title="Supprimer"
                    onClick={() => handleDeleteItem(item.id)}
                    style={buttons.danger}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "2fr 2fr 90px 140px 140px 110px 90px auto",
                gap: "8px",
                alignItems: "center",
                padding: "10px",
                border: `1px solid ${colors.borderSoft}`,
                borderRadius: radius.md,
                background: colors.cardBgAlt,
                minWidth: "1140px",
                textAlign: "center",
              }}
            >
              <div>
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

              <div>Niv. {item.level}</div>
              <div>{item.category}</div>
              <div style={{ color: getRarityColor(item.rarity), fontWeight: 700 }}>
                {item.rarity}
              </div>
              <div>{item.valueAmount}</div>
              <div>{item.valueCurrency}</div>

              <div style={layout.centerRow}>
                <button title="Modifier" onClick={() => handleEditItem(item.id)} style={buttons.icon}>
                  ✏️
                </button>
                <button title="Dupliquer" onClick={() => handleDuplicateItem(item.id)} style={buttons.icon}>
                  📄
                </button>
                <button title="Supprimer" onClick={() => handleDeleteItem(item.id)} style={buttons.icon}>
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ ...layout.centerRow, marginTop: "20px" }}>
        <button onClick={handleSaveTable} style={buttons.primary}>
          Enregistrer la table
        </button>
        <button onClick={onCancel} style={buttons.secondary}>
          Annuler
        </button>
      </div>

      <ConfirmModal
        isOpen={pendingCsvFile !== null}
        title="Importer un CSV"
        message="Que veux-tu faire avec les objets du fichier CSV ?"
        onCancel={cancelCsvImport}
        customFooter={
          <>
            <button onClick={() => confirmCsvImport("append")} style={buttons.primary}>
              Ajouter à la table
            </button>
            <button onClick={() => confirmCsvImport("replace")} style={buttons.danger}>
              Remplacer la table
            </button>
            <button onClick={cancelCsvImport} style={buttons.secondary}>
              Annuler
            </button>
          </>
        }
      />
    </div>
  );
}