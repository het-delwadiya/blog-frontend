const dateFmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "short" });
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export const longDate = (d?: string) => (d ? dateFmt.format(new Date(d)) : "");
export const shortDate = (d?: string) => (d ? shortFmt.format(new Date(d)) : "");

export function timeAgo(d: string) {
  const s = (new Date(d).getTime() - Date.now()) / 1000;
  const abs = Math.abs(s);
  if (abs < 45) return "just now";
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (abs < 7 * 86400) return rtf.format(Math.round(s / 86400), "day");
  return shortDate(d);
}

export const plural = (n: number, word: string) => `${n.toLocaleString("en")} ${n === 1 ? word : /[^aeiou]y$/.test(word) ? `${word.slice(0, -1)}ies` : `${word}s`}`;
