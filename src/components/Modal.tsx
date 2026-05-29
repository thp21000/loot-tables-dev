import { useEffect } from "react";

type ModalProps = {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
};

export default function Modal({
  isOpen,
  title,
  children,
  onClose,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 2000,
        overflow: "hidden",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "520px",
          maxHeight: "calc(100svh - 32px)",
          background: "#1e1e1e",
          border: "1px solid #444",
          borderRadius: "14px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: title ? "1px solid #333" : "none",
            flexShrink: 0,
          }}
        >
          {title ? (
            <h2 style={{ margin: 0, fontSize: "1.2rem", textAlign: "center" }}>
              {title}
            </h2>
          ) : null}
        </div>

        <div
          style={{
            padding: "20px",
            overflowY: "auto",
            overscrollBehavior: "contain",
          }}
        >
          {children}
        </div>

        {footer ? (
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid #333",
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              flexWrap: "wrap",
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}