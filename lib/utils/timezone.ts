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

function getTimeZoneOffsetMinutes(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), Number(map.hour), Number(map.minute), Number(map.second));
  return (asUtc - date.getTime()) / 60000;
}

/**
 * `Match.fecha` stores the Madrid calendar date (UTC midnight) and `Match.hora` the
 * Madrid local kickoff time ("HH:MM"). Combines both to recover the real kickoff instant.
 */
export function getMatchKickoffUtc(fecha: Date, hora: string | null): Date {
  const [hourStr, minuteStr] = (hora ?? "00:00").split(":");
  const hour = Number(hourStr) || 0;
  const minute = Number(minuteStr) || 0;
  const naiveUtc = Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate(), hour, minute);
  const offsetMinutes = getTimeZoneOffsetMinutes(MADRID_TZ, new Date(naiveUtc));
  return new Date(naiveUtc - offsetMinutes * 60000);
}

export function getMatchMadridDayKey(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}
