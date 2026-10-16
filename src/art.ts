import type { Sweet } from "./engine";
const palette = {
  rose: ["#ff6e93", "#cb2b66"],
  citrus: ["#ffb85b", "#e57426"],
  lemon: ["#ffe66e", "#dda628"],
  mint: ["#78dfb6", "#25a77f"],
  berry: ["#b298ed", "#7750c5"],
};
export function sweetArt(s: Sweet): string {
  const [light, dark] = palette[s.color];
  const shape =
    s.color === "rose"
      ? '<path d="M14 20C10 7 28 4 32 15C40 3 56 11 50 24L37 48Q31 56 24 47Z"/>'
      : s.color === "citrus"
        ? '<rect x="13" y="9" width="38" height="46" rx="17" transform="rotate(23 32 32)"/>'
        : s.color === "lemon"
          ? '<path d="M32 6Q58 25 52 39Q44 60 22 52Q2 42 15 23Z"/>'
          : s.color === "mint"
            ? '<rect x="12" y="12" width="40" height="40" rx="11" transform="rotate(-8 32 32)"/>'
            : '<path d="M32 7L51 18L54 40L32 56L11 42L12 19Z"/>';
  const id = `g${s.id}`;
  let overlay = "";
  if (s.special === "row")
    overlay =
      '<path d="M13 25H51M13 35H51M18 45H46" stroke="white" stroke-width="5" opacity=".9"/>';
  if (s.special === "column")
    overlay =
      '<path d="M24 13V51M34 12V52M44 17V47" stroke="white" stroke-width="5" opacity=".9"/>';
  if (s.special === "parcel")
    overlay =
      '<path d="M10 30H54M31 9V55" stroke="#fff5d5" stroke-width="8"/><path d="M31 28C6 17 28 6 31 28C37 4 57 25 31 28" fill="none" stroke="#fff5d5" stroke-width="4"/>';
  if (s.special === "prism")
    return (
      '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="p' +
      s.id +
      '" x2="1" y2="1"><stop stop-color="#7051b9"/><stop offset="1" stop-color="#332151"/></linearGradient></defs><circle cx="32" cy="33" r="24" fill="url(#p' +
      s.id +
      ')" stroke="#f5d59a" stroke-width="3"/>' +
      ["#ff90b0", "#ffe584", "#93f4d1", "#b7a2ff", "#ffb060"]
        .map(
          (c, i) =>
            `<path d="M${15 + i * 7} ${22 + (i % 2) * 15}l3 -4l3 4l-3 4Z" fill="${c}"/>`,
        )
        .join("") +
      '<path d="M20 17Q27 11 36 15" stroke="white" opacity=".5" stroke-width="4" fill="none"/></svg>'
    );
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${id}" x2=".7" y2="1"><stop stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient></defs><g fill="url(#${id})" stroke="${dark}" stroke-width="2">${shape}</g><g style="clip-path:inset(12% 15% round 20%)">${overlay}</g><path d="M23 17Q29 13 35 17" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" opacity=".55"/></svg>`;
}
export const blockArt =
  '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="12" width="48" height="44" rx="11" fill="#e8c18d" stroke="#bb8d5d" stroke-width="2"/><path d="M10 31Q13 10 24 20Q31 1 40 19Q53 12 55 32Z" fill="#fff9eb" stroke="#e9d7b7" stroke-width="2"/><path d="M16 43H48" stroke="#fff1d4" stroke-width="5" stroke-linecap="round"/></svg>';
