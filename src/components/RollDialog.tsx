import { useEffect, useState } from "react";
import type { LootCategory, ProbabilityMode, RollOptions } from "../types";
import { buttons, controls, colors, typography } from "../styles/ui";

type RollDialogProps = {
  isOpen: boolean;
  tableName: string;
  availableCategories: LootCategory[];
  initialOptions: RollOptions;
  onClose: () => void;
  onConfirm: (options: RollOptions) => void;
  onShowAlert: (message: string) => void;
};

export default function RollDialog({
  isOpen,
  tableName,
  availableCategories,
  initialOptions,
  onClose,
  onConfirm,
  onShowAlert,
}: RollDialogProps) {
  const [maxLevel, setMaxLevel] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<LootCategory[]>(
    []
  );
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [probabilityMode, setProbabilityMode] =
    useState<ProbabilityMode>("balanced");

  useEffect(() => {
    if (!isOpen) return;

    setMaxLevel(initialOptions.maxLevel);
    setQuantity(initialOptions.quantity);
    setSelectedCategories(initialOptions.categories);
    setAllowDuplicates(initialOptions.allowDuplicates);
    setProbabilityMode(initialOptions.probabilityMode);
  }, [isOpen, initialOptions]);

  function toggleCategory(category: LootCategory) {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((entry) => entry !== category)
        : [...prev, category]
    );
  }

  function handleSubmit() {
    if (maxLevel < 0) {
      onShowAlert("Le niveau max doit être supérieur ou égal à 0.");
      return;
    }

    if (quantity <= 0) {
      onShowAlert("La quantité doit être supérieure à 0.");
      return;
    }

    onConfirm({
      maxLevel,
      quantity,
      categories: selectedCategories,
      allowDuplicates,
      probabilityMode,
    });
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 1000,
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          background: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: "16px",
          padding: "22px",
        }}
      >
        <h2 style={typography.cardTitle}>Lancer la table</h2>

        <p style={{ ...typography.pageSubtitle, marginBottom: "18px" }}>
          {tableName}
        </p>

        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <label style={typography.label}>Niveau maximum</label>
            <input
              type="number"
              min="0"
              value={maxLevel}
              onChange={(event) => setMaxLevel(Number(event.target.value))}
              style={controls.input}
            />
          </div>

          <div>
            <label style={typography.label}>Nombre d’objets à tirer</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              style={controls.input}
            />
          </div>

          <div>
            <label style={typography.label}>Mode de probabilité</label>
            <select
              value={probabilityMode}
              onChange={(event) =>
                setProbabilityMode(event.target.value as ProbabilityMode)
              }
              style={controls.select}
            >
              <option value="balanced">Équilibré</option>
              <option value="low-soft">Favorise légèrement les bas niveaux</option>
              <option value="low-strong">Favorise fortement les bas niveaux</option>
              <option value="rarity-only">Rareté uniquement</option>
            </select>
          </div>

          <div>
            <label style={typography.label}>Catégories autorisées</label>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {availableCategories.map((category) => {
                const isSelected = selectedCategories.includes(category);

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    style={{
                      ...buttons.secondary,
                      background: isSelected ? colors.primary : colors.secondary,
                    }}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <p
              style={{
                ...typography.pageSubtitle,
                textAlign: "left",
                marginTop: "8px",
                marginBottom: 0,
              }}
            >
              Si aucune catégorie n’est sélectionnée, toutes les catégories sont autorisées.
            </p>
          </div>

          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: colors.textSoft,
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={allowDuplicates}
                onChange={(event) => setAllowDuplicates(event.target.checked)}
              />
              Autoriser les doublons
            </label>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            marginTop: "24px",
            flexWrap: "wrap",
          }}
        >
          <button onClick={handleSubmit} style={buttons.primary}>
            Lancer
          </button>
          <button onClick={onClose} style={buttons.secondary}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}