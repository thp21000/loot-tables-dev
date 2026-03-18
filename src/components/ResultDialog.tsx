import { useMemo, useState } from "react";
import type { OwlbearPlayerRole, RollResult } from "../types";
import { getProbabilityModeLabel } from "../utils/loot";
import { buttons, colors, layout, radius, typography } from "../styles/ui";

type ResultDialogProps = {
  isOpen: boolean;
  result: RollResult | null;
  history: RollResult[];
  onClose: () => void;
  onReroll: () => void;
  onValidate: () => void;
  onShowAlert: (message: string) => void;
  playerRole: OwlbearPlayerRole;
};

function getRarityColor(rarity: string): string {
  if (rarity === "Courant") return "#9ca3af";
  if (rarity === "Peu courant") return "#f59e0b";
  if (rarity === "Rare") return "#60a5fa";
  return "#a78bfa";
}

function formatResultText(result: RollResult): string {
  const header = `Résultat du tirage — ${result.tableName}`;
  const options = `Niveau max : ${result.options.maxLevel} | Quantité : ${result.options.quantity} | Doublons : ${result.options.allowDuplicates ? "Oui" : "Non"} | Mode : ${getProbabilityModeLabel(result.options.probabilityMode)}`;
  const categories =
    result.options.categories.length > 0
      ? `Catégories : ${result.options.categories.join(", ")}`
      : "Catégories : toutes";

  const items =
    result.items.length === 0
      ? ["Aucun objet ne correspond aux filtres choisis."]
      : result.items.map(
          (item, index) =>
            `${index + 1}. ${item.name} — Niveau ${item.level} — ${item.category} — ${item.rarity} — ${item.valueAmount} ${item.valueCurrency}${item.url ? ` — ${item.url}` : ""}`
        );

  return [header, options, categories, "", ...items].join("\n");
}

export default function ResultDialog({
  isOpen,
  result,
  history,
  onClose,
  onReroll,
  onValidate,
  onShowAlert,
  playerRole,
}: ResultDialogProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const textToCopy = useMemo(() => {
    if (!result) return "";
    return formatResultText(result);
  }, [result]);

  async function handleCopy() {
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      onShowAlert("Résultat copié dans le presse-papiers.");
    } catch (error) {
      console.error(error);
      onShowAlert("Impossible de copier le résultat.");
    }
  }

  if (!isOpen || !result) {
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
          maxWidth: "920px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: "16px",
          padding: "22px",
        }}
      >
        <h2 style={typography.cardTitle}>
          {playerRole === "GM" ? "Résultat du tirage" : "Butin reçu"}
        </h2>

        <p style={{ ...typography.pageSubtitle, marginBottom: "6px" }}>
          {result.tableName}
        </p>

        <p style={{ ...typography.pageSubtitle, marginBottom: "4px" }}>
          Niveau max : {result.options.maxLevel} · Quantité{" "}
          {result.options.quantity} · Doublons :{" "}
          {result.options.allowDuplicates ? "Oui" : "Non"}
        </p>

        <p style={{ ...typography.pageSubtitle, marginBottom: "18px" }}>
          Mode : {getProbabilityModeLabel(result.options.probabilityMode)}
        </p>

        {result.items.length === 0 ? (
          <p style={{ textAlign: "center", marginTop: "24px", color: colors.textSoft }}>
            Aucun objet ne correspond aux filtres choisis.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "12px", marginTop: "20px" }}>
            {result.items.map((item, index) => (
              <div
                key={`${item.id}-${index}-${item.effectiveWeight}`}
                style={{
                  border: `1px solid ${colors.borderSoft}`,
                  borderRadius: radius.md,
                  padding: "14px",
                  background: colors.cardBgAlt,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "16px",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>{item.name}</strong>
                    {item.url ? (
                      <>
                        {" · "}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: colors.primary }}
                        >
                          Fiche
                        </a>
                      </>
                    ) : null}
                  </div>

                  <div style={{ color: colors.textMuted }}>
                    {item.valueAmount} {item.valueCurrency}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginTop: "8px",
                    color: colors.textSoft,
                  }}
                >
                  <span>Niveau {item.level}</span>
                  <span>{item.category}</span>
                  <span
                    style={{
                      color: getRarityColor(item.rarity),
                      fontWeight: 700,
                    }}
                  >
                    {item.rarity}
                  </span>
                  <span>Poids : {Math.round(item.effectiveWeight * 100) / 100}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            ...layout.centerRow,
            marginTop: "24px",
          }}
        >
          {playerRole === "GM" ? (
            <>
              <button onClick={onValidate} style={buttons.primary}>
                Valider le tirage
              </button>
              <button onClick={onReroll} style={buttons.secondary}>
                Relancer
              </button>
            </>
          ) : null}

          <button onClick={handleCopy} style={buttons.secondary}>
            Copier les résultats
          </button>
          <button onClick={onClose} style={buttons.secondary}>
            Fermer
          </button>
        </div>

        <div style={{ marginTop: "28px" }}>
          <button
            onClick={() => setIsHistoryOpen((prev) => !prev)}
            style={buttons.secondary}
          >
            {isHistoryOpen
              ? "Masquer l’historique récent"
              : "Afficher l’historique récent"}
          </button>

          {isHistoryOpen && (
            <>
              {history.length === 0 ? (
                <p style={{ color: colors.textMuted, marginTop: "12px" }}>
                  Aucun historique disponible.
                </p>
              ) : (
                <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
                  {history.map((entry, index) => (
                    <div
                      key={`${entry.rolledAt}-${index}`}
                      style={{
                        border: `1px solid ${colors.borderSoft}`,
                        borderRadius: radius.md,
                        padding: "12px",
                        background: colors.panelBg,
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{entry.tableName}</div>
                      <div
                        style={{
                          color: colors.textMuted,
                          fontSize: "0.9rem",
                          marginTop: "4px",
                        }}
                      >
                        Niveau max {entry.options.maxLevel} · Quantité{" "}
                        {entry.options.quantity} · Mode{" "}
                        {getProbabilityModeLabel(entry.options.probabilityMode)}
                      </div>
                      <div style={{ marginTop: "6px", color: colors.textSoft }}>
                        {entry.items.length === 0
                          ? "Aucun objet"
                          : entry.items.map((item) => item.name).join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}