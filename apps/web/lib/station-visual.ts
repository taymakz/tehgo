export function stationMarkerBackground(colors: string[]): string {
  const unique = Array.from(new Set(colors.filter(Boolean)));

  if (unique.length <= 1) {
    return unique[0] ?? "#888888";
  }

  if (unique.length === 2) {
    return `linear-gradient(90deg, ${unique[0]} 50%, ${unique[1]} 50%)`;
  }

  const step = 360 / unique.length;
  const stops = unique
    .map((color, i) => `${color} ${i * step}deg ${(i + 1) * step}deg`)
    .join(", ");
  return `conic-gradient(${stops})`;
}

export function isLightColor(hex: string): boolean {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 150;
}
