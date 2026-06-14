"use client";

import { createContext, FormEvent, ReactNode, useCallback, useContext, useMemo, useState } from "react";

type ToastTone = "success" | "error" | "info";
type Toast = { id: number; tone: ToastTone; title: string; message?: string };
type DialogState =
  | { type: "confirm"; title: string; message?: string; confirmLabel?: string; danger?: boolean; resolve: (value: boolean) => void }
  | { type: "prompt"; title: string; message?: string; defaultValue?: string; placeholder?: string; confirmLabel?: string; danger?: boolean; resolve: (value: string | null) => void };

type UiContextValue = {
  toast: (toast: Omit<Toast, "id">) => void;
  confirm: (options: Omit<Extract<DialogState, { type: "confirm" }>, "type" | "resolve">) => Promise<boolean>;
  prompt: (options: Omit<Extract<DialogState, { type: "prompt" }>, "type" | "resolve">) => Promise<string | null>;
};

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [promptValue, setPromptValue] = useState("");

  const toast = useCallback((next: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((items) => [...items, { id, ...next }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4200);
  }, []);

  const confirm = useCallback<UiContextValue["confirm"]>((options) => new Promise((resolve) => {
    setDialog({ type: "confirm", ...options, resolve });
  }), []);

  const prompt = useCallback<UiContextValue["prompt"]>((options) => new Promise((resolve) => {
    setPromptValue(options.defaultValue ?? "");
    setDialog({ type: "prompt", ...options, resolve });
  }), []);

  function closeDialog(value: boolean | string | null) {
    if (!dialog) return;
    if (dialog.type === "confirm") dialog.resolve(Boolean(value));
    else dialog.resolve(typeof value === "string" ? value : null);
    setDialog(null);
  }

  function submitPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    closeDialog(promptValue);
  }

  const value = useMemo(() => ({ toast, confirm, prompt }), [confirm, prompt, toast]);

  return (
    <UiContext.Provider value={value}>
      {children}
      {dialog ? (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(null); }}>
          <div className="dialog-panel" role="dialog" aria-modal="true">
            <p className="kicker">действие администратора</p>
            <h2 style={{ margin: 0 }}>{dialog.title}</h2>
            {dialog.message ? <p className="muted" style={{ lineHeight: 1.6 }}>{dialog.message}</p> : null}
            {dialog.type === "prompt" ? (
              <form onSubmit={submitPrompt}>
                <input className="input" autoFocus value={promptValue} onChange={(event) => setPromptValue(event.target.value)} placeholder={dialog.placeholder} />
                <div className="dialog-actions">
                  <button className="button secondary" onClick={() => closeDialog(null)} type="button">Отмена</button>
                  <button className={dialog.danger ? "button secondary" : "button"} type="submit">{dialog.confirmLabel ?? "Подтвердить"}</button>
                </div>
              </form>
            ) : (
              <div className="dialog-actions">
                <button className="button secondary" onClick={() => closeDialog(false)} type="button">Отмена</button>
                <button className={dialog.danger ? "button secondary" : "button"} onClick={() => closeDialog(true)} type="button">{dialog.confirmLabel ?? "Подтвердить"}</button>
              </div>
            )}
          </div>
        </div>
      ) : null}
      <div className="toast-stack">
        {toasts.map((item) => <div className={`toast ${item.tone}`} key={item.id}><strong>{item.title}</strong>{item.message ? <p className="muted" style={{ margin: "6px 0 0" }}>{item.message}</p> : null}</div>)}
      </div>
    </UiContext.Provider>
  );
}

export function useUi() {
  const context = useContext(UiContext);
  if (!context) throw new Error("useUi must be used inside UiProvider");
  return context;
}
