const EST_TZ = "America/New_York";
const MADRID_TZ = "Europe/Madrid";

export function getEstDayKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: EST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function getEstDayLabel(date: Date = new Date()): string {
  const estTime = new Intl.DateTimeFormat("es-ES", { timeZone: EST_TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  const madridTime = new Intl.DateTimeFormat("es-ES", { timeZone: MADRID_TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  const tzAbbr = new Intl.DateTimeFormat("en-US", { timeZone: EST_TZ, timeZoneName: "short" })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value ?? "EST";
  return `hoy ${estTime} ${tzAbbr} (${madridTime} Madrid)`;
}
