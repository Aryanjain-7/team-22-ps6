"use client";

import { useEffect, useRef, useState } from "react";
import { appearanceKey, modes, palettes, type AppearanceMode, type Palette } from "@/lib/appearance";
import { Icon } from "./Icon";

export function AppearanceMenu() {
  const [palette, setPalette] = useState<Palette>("jade");
  const [mode, setMode] = useState<AppearanceMode>("system");
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const { palette, appearance } = document.documentElement.dataset;
    const savedPalette = palettes.find(({ id }) => id === palette);
    const savedMode = modes.find(({ id }) => id === appearance);
    if (savedPalette) setPalette(savedPalette.id);
    if (savedMode) setMode(savedMode.id);

    function closeOutside(event: PointerEvent) {
      const details = menu.current;
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
        details.open = false;
      }
    }

    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  function changeAppearance(nextPalette: Palette, nextMode: AppearanceMode) {
    document.documentElement.dataset.palette = nextPalette;
    document.documentElement.dataset.appearance = nextMode;
    setPalette(nextPalette);
    setMode(nextMode);
    try {
      localStorage.setItem(appearanceKey, JSON.stringify({ palette: nextPalette, mode: nextMode }));
    } catch {
      // Appearance still applies when browser storage is unavailable.
    }
  }

  return (
    <details ref={menu} className="appearance-menu" onBlur={(event) => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
        event.currentTarget.open = false;
      }
    }} onKeyDown={(event) => {
      if (event.key === "Escape" && event.currentTarget.open) {
        event.preventDefault();
        event.currentTarget.open = false;
        event.currentTarget.querySelector("summary")?.focus();
      }
    }}>
      <summary className="menu-action" aria-label="Appearance">
        <Icon name="palette" size={18} />
        <span className="menu-action-label">Appearance</span>
      </summary>
      <div className="appearance-panel surface">
        <fieldset className="palette-options">
          <legend>Color palette</legend>
          {palettes.map(({ id, label, description }) => (
            <label className="palette-option" key={id}>
              <input type="radio" name="palette" checked={palette === id}
                onChange={() => changeAppearance(id, mode)} />
              <span className="palette-swatch" data-swatch={id} aria-hidden="true" />
              <span><strong>{label}</strong><small>{description}</small></span>
            </label>
          ))}
        </fieldset>
        <fieldset className="mode-options">
          <legend>Display mode</legend>
          <div className="mode-control">
            {modes.map(({ id, label }) => (
              <label key={id}>
                <input type="radio" name="appearance-mode" checked={mode === id}
                  onChange={() => changeAppearance(palette, id)} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </details>
  );
}
