export type CountryInfo = {
  countryCode: string;
  nameEs: string;
  flagEmoji: string;
  fifaName?: string;
};

function flag(iso2: string) {
  const upper = iso2.toUpperCase();
  return [...upper].map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65)).join("");
}

const englandFlag = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}";
const scotlandFlag = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}";

export const countryCatalog: CountryInfo[] = [
  { countryCode: "MEX", nameEs: "M\u00e9xico", flagEmoji: flag("MX"), fifaName: "Mexico" },
  { countryCode: "RSA", nameEs: "Sud\u00e1frica", flagEmoji: flag("ZA"), fifaName: "South Africa" },
  { countryCode: "KOR", nameEs: "Corea del Sur", flagEmoji: flag("KR"), fifaName: "South Korea" },
  { countryCode: "CZE", nameEs: "Rep\u00fablica Checa", flagEmoji: flag("CZ"), fifaName: "Czech Republic" },
  { countryCode: "CAN", nameEs: "Canad\u00e1", flagEmoji: flag("CA"), fifaName: "Canada" },
  { countryCode: "BIH", nameEs: "Bosnia y Herzegovina", flagEmoji: flag("BA"), fifaName: "Bosnia and Herzegovina" },
  { countryCode: "QAT", nameEs: "Qatar", flagEmoji: flag("QA"), fifaName: "Qatar" },
  { countryCode: "SUI", nameEs: "Suiza", flagEmoji: flag("CH"), fifaName: "Switzerland" },
  { countryCode: "BRA", nameEs: "Brasil", flagEmoji: flag("BR"), fifaName: "Brazil" },
  { countryCode: "MAR", nameEs: "Marruecos", flagEmoji: flag("MA"), fifaName: "Morocco" },
  { countryCode: "HAI", nameEs: "Hait\u00ed", flagEmoji: flag("HT"), fifaName: "Haiti" },
  { countryCode: "SCO", nameEs: "Escocia", flagEmoji: scotlandFlag, fifaName: "Scotland" },
  { countryCode: "USA", nameEs: "Estados Unidos", flagEmoji: flag("US"), fifaName: "United States" },
  { countryCode: "PAR", nameEs: "Paraguay", flagEmoji: flag("PY"), fifaName: "Paraguay" },
  { countryCode: "AUS", nameEs: "Australia", flagEmoji: flag("AU"), fifaName: "Australia" },
  { countryCode: "TUR", nameEs: "Turqu\u00eda", flagEmoji: flag("TR"), fifaName: "Turkey" },
  { countryCode: "GER", nameEs: "Alemania", flagEmoji: flag("DE"), fifaName: "Germany" },
  { countryCode: "CUW", nameEs: "Curazao", flagEmoji: flag("CW"), fifaName: "Cura\u00e7ao" },
  { countryCode: "CIV", nameEs: "Costa de Marfil", flagEmoji: flag("CI"), fifaName: "Ivory Coast" },
  { countryCode: "ECU", nameEs: "Ecuador", flagEmoji: flag("EC"), fifaName: "Ecuador" },
  { countryCode: "NED", nameEs: "Pa\u00edses Bajos", flagEmoji: flag("NL"), fifaName: "Netherlands" },
  { countryCode: "JPN", nameEs: "Jap\u00f3n", flagEmoji: flag("JP"), fifaName: "Japan" },
  { countryCode: "SWE", nameEs: "Suecia", flagEmoji: flag("SE"), fifaName: "Sweden" },
  { countryCode: "TUN", nameEs: "T\u00fanez", flagEmoji: flag("TN"), fifaName: "Tunisia" },
  { countryCode: "BEL", nameEs: "B\u00e9lgica", flagEmoji: flag("BE"), fifaName: "Belgium" },
  { countryCode: "EGY", nameEs: "Egipto", flagEmoji: flag("EG"), fifaName: "Egypt" },
  { countryCode: "IRN", nameEs: "Ir\u00e1n", flagEmoji: flag("IR"), fifaName: "Iran" },
  { countryCode: "NZL", nameEs: "Nueva Zelanda", flagEmoji: flag("NZ"), fifaName: "New Zealand" },
  { countryCode: "ESP", nameEs: "Espa\u00f1a", flagEmoji: flag("ES"), fifaName: "Spain" },
  { countryCode: "CPV", nameEs: "Cabo Verde", flagEmoji: flag("CV"), fifaName: "Cape Verde" },
  { countryCode: "KSA", nameEs: "Arabia Saud\u00ed", flagEmoji: flag("SA"), fifaName: "Saudi Arabia" },
  { countryCode: "URU", nameEs: "Uruguay", flagEmoji: flag("UY"), fifaName: "Uruguay" },
  { countryCode: "FRA", nameEs: "Francia", flagEmoji: flag("FR"), fifaName: "France" },
  { countryCode: "SEN", nameEs: "Senegal", flagEmoji: flag("SN"), fifaName: "Senegal" },
  { countryCode: "IRQ", nameEs: "Irak", flagEmoji: flag("IQ"), fifaName: "Iraq" },
  { countryCode: "NOR", nameEs: "Noruega", flagEmoji: flag("NO"), fifaName: "Norway" },
  { countryCode: "ARG", nameEs: "Argentina", flagEmoji: flag("AR"), fifaName: "Argentina" },
  { countryCode: "ALG", nameEs: "Argelia", flagEmoji: flag("DZ"), fifaName: "Algeria" },
  { countryCode: "AUT", nameEs: "Austria", flagEmoji: flag("AT"), fifaName: "Austria" },
  { countryCode: "JOR", nameEs: "Jordania", flagEmoji: flag("JO"), fifaName: "Jordan" },
  { countryCode: "POR", nameEs: "Portugal", flagEmoji: flag("PT"), fifaName: "Portugal" },
  { countryCode: "COD", nameEs: "RD Congo", flagEmoji: flag("CD"), fifaName: "DR Congo" },
  { countryCode: "UZB", nameEs: "Uzbekist\u00e1n", flagEmoji: flag("UZ"), fifaName: "Uzbekistan" },
  { countryCode: "COL", nameEs: "Colombia", flagEmoji: flag("CO"), fifaName: "Colombia" },
  { countryCode: "ENG", nameEs: "Inglaterra", flagEmoji: englandFlag, fifaName: "England" },
  { countryCode: "CRO", nameEs: "Croacia", flagEmoji: flag("HR"), fifaName: "Croatia" },
  { countryCode: "GHA", nameEs: "Ghana", flagEmoji: flag("GH"), fifaName: "Ghana" },
  { countryCode: "PAN", nameEs: "Panam\u00e1", flagEmoji: flag("PA"), fifaName: "Panama" }
];

const byCode = new Map(countryCatalog.map((country) => [country.countryCode.toUpperCase(), country]));
const byName = new Map<string, CountryInfo>();

function addName(name: string | null | undefined, country: CountryInfo) {
  if (!name) return;
  byName.set(name.trim().toLocaleUpperCase("es-ES"), country);
}

for (const country of countryCatalog) {
  addName(country.nameEs, country);
  addName(country.fifaName, country);
}

addName("United Kingdom", byCode.get("ENG")!);
addName("Reino Unido", byCode.get("ENG")!);
addName("England", byCode.get("ENG")!);
addName("Morocco", byCode.get("MAR")!);
addName("Spain", byCode.get("ESP")!);
addName("Espana", byCode.get("ESP")!);
addName("Espa\u00f1a", byCode.get("ESP")!);
addName("Paises Bajos", byCode.get("NED")!);

export function countryByCode(code: string | null | undefined): CountryInfo | null {
  if (!code) return null;
  return byCode.get(code.trim().toUpperCase()) ?? null;
}

export function countryByName(name: string | null | undefined): CountryInfo | null {
  if (!name) return null;
  return byName.get(name.trim().toLocaleUpperCase("es-ES")) ?? null;
}

export function countryForTeam(code: string | null | undefined, name?: string | null): CountryInfo | null {
  return countryByCode(code) ?? countryByName(name);
}

export function normalizeCountryName(code: string | null | undefined, name?: string | null): string | null {
  return countryForTeam(code, name)?.nameEs ?? name ?? code ?? null;
}

export function normalizeCountryFlag(code: string | null | undefined, name?: string | null): string | null {
  return countryForTeam(code, name)?.flagEmoji ?? null;
}

export function formatCountry(code: string | null | undefined, name?: string | null): string {
  const country = countryForTeam(code, name);
  if (country) return `${country.flagEmoji} ${country.nameEs}`;
  return name ?? code ?? "Por definir";
}

export function formatCountryOrNull(code: string | null | undefined, name?: string | null): string | null {
  if (!code && !name) return null;
  return formatCountry(code, name);
}