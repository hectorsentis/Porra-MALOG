const REGIONAL_INDICATOR_START = 0x1f1e6;
const REGIONAL_INDICATOR_END = 0x1f1ff;
const BLACK_FLAG = 0x1f3f4;
const TAG_LOWER_A = 0xe0061;
const TAG_LOWER_Z = 0xe007a;
const TAG_CANCEL = 0xe007f;

const SUBDIVISION_FLAGS: Record<string, string> = {
  gbeng: "gb-eng",
  gbsct: "gb-sct",
  gbwls: "gb-wls",
  gbnir: "gb-nir"
};

function splitFlagPrefix(value: string): { flagCode: string | null; rest: string } {
  const chars = [...value];
  if (chars.length === 0) return { flagCode: null, rest: value };
  const first = chars[0].codePointAt(0)!;

  if (first >= REGIONAL_INDICATOR_START && first <= REGIONAL_INDICATOR_END && chars.length > 1) {
    const second = chars[1].codePointAt(0)!;
    if (second >= REGIONAL_INDICATOR_START && second <= REGIONAL_INDICATOR_END) {
      const iso = String.fromCharCode(first - REGIONAL_INDICATOR_START + 65) + String.fromCharCode(second - REGIONAL_INDICATOR_START + 65);
      return { flagCode: iso.toLowerCase(), rest: chars.slice(2).join("").trimStart() };
    }
  }

  if (first === BLACK_FLAG) {
    let tag = "";
    let i = 1;
    while (i < chars.length) {
      const code = chars[i].codePointAt(0)!;
      i += 1;
      if (code === TAG_CANCEL) break;
      if (code >= TAG_LOWER_A && code <= TAG_LOWER_Z) tag += String.fromCharCode(code - 0xe0000);
    }
    const flagCode = SUBDIVISION_FLAGS[tag] ?? null;
    return { flagCode, rest: flagCode ? chars.slice(i).join("").trimStart() : value };
  }

  return { flagCode: null, rest: value };
}

export function CountryLabel({ value, className }: { value: string | null | undefined; className?: string }) {
  if (!value) return null;
  const { flagCode, rest } = splitFlagPrefix(value);
  if (!flagCode) return <>{value}</>;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
      <span className={`fi fi-${flagCode}`} aria-hidden="true" />
      <span>{rest}</span>
    </span>
  );
}
