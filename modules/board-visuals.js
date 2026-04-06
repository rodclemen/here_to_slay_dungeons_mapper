const hexPathTemplateCache = new Map();

function parseRgbTripletVar(cssVars, name, fallback) {
  const raw = cssVars.getPropertyValue(name).trim();
  if (!raw) return fallback;
  const parts = raw.split(",").map((part) => Number.parseInt(part.trim(), 10));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return fallback;
  return { r: parts[0], g: parts[1], b: parts[2] };
}

function parseNumberVar(cssVars, name, fallback) {
  const raw = cssVars.getPropertyValue(name).trim();
  if (!raw) return fallback;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function computeBoardHexThemeMetrics(cssVars, { isDarkTheme }) {
  const strokeColor = cssVars.getPropertyValue("--hex-stroke").trim() || "rgba(216, 198, 180, 0.45)";
  const borderRgb = parseRgbTripletVar(cssVars, "--hex-border-rgb", { r: 196, g: 206, b: 213 });
  const darkestTargetHexes = isDarkTheme
    ? parseNumberVar(cssVars, "--hex-dark-target-hexes", 9)
    : 4;
  const lightRgb = parseRgbTripletVar(cssVars, "--hex-center-rgb", { r: 255, g: 248, b: 240 });
  const darkEndpoint = isDarkTheme
    ? {
        r: Math.round(lightRgb.r * 0.62),
        g: Math.round(lightRgb.g * 0.62),
        b: Math.round(lightRgb.b * 0.62),
      }
    : {
        r: Math.round(borderRgb.r + (lightRgb.r - borderRgb.r) * 0.4),
        g: Math.round(borderRgb.g + (lightRgb.g - borderRgb.g) * 0.4),
        b: Math.round(borderRgb.b + (lightRgb.b - borderRgb.b) * 0.4),
      };

  return {
    isDarkTheme,
    strokeColor,
    borderRgb,
    darkestTargetHexes,
    lightRgb,
    darkEndpoint,
  };
}

export function hexPath(cx, cy, radius, sqrt3) {
  const key = Number(radius.toFixed(4));
  let template = hexPathTemplateCache.get(key);
  if (!template) {
    const halfH = (sqrt3 * radius) / 2;
    template = [
      [radius, 0],
      [radius / 2, halfH],
      [-radius / 2, halfH],
      [-radius, 0],
      [-radius / 2, -halfH],
      [radius / 2, -halfH],
    ];
    hexPathTemplateCache.set(key, template);
  }
  return `M ${cx + template[0][0]} ${cy + template[0][1]}`
    + ` L ${cx + template[1][0]} ${cy + template[1][1]}`
    + ` L ${cx + template[2][0]} ${cy + template[2][1]}`
    + ` L ${cx + template[3][0]} ${cy + template[3][1]}`
    + ` L ${cx + template[4][0]} ${cy + template[4][1]}`
    + ` L ${cx + template[5][0]} ${cy + template[5][1]} Z`;
}
