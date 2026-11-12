export const appearanceKey = "careermatch-appearance";

export const palettes = [
  { id: "jade", label: "Jade", description: "Warm neutrals with deep green accents" },
  { id: "sapphire", label: "Sapphire", description: "Cool slate with crisp blue accents" },
  { id: "plum", label: "Plum", description: "Soft rose with muted violet accents" },
] as const;

export const modes = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
] as const;

export type Palette = typeof palettes[number]["id"];
export type AppearanceMode = typeof modes[number]["id"];

// Apply the saved preference before the page paints, including on the login screen.
export const appearanceScript = `try {
  const saved = JSON.parse(localStorage.getItem(${JSON.stringify(appearanceKey)}) || "{}");
  if (${JSON.stringify(palettes.map(({ id }) => id))}.includes(saved?.palette)) {
    document.documentElement.dataset.palette = saved.palette;
  }
  if (${JSON.stringify(modes.map(({ id }) => id))}.includes(saved?.mode)) {
    document.documentElement.dataset.appearance = saved.mode;
  }
  if (saved?.animateBackground === false) {
    document.documentElement.dataset.backgroundMotion = "paused";
  }
} catch {}`;
