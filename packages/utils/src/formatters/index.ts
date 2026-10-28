/**
 * Formats a number of kilometers into a localized string with 'km' suffix.
 * e.g., 14500 -> "14,500 km"
 */
export function formatOdometer(km: number, locale = 'en-US'): string {
  if (isNaN(km) || km < 0) return '0 km';
  return `${new Intl.NumberFormat(locale).format(km)} km`;
}

export const formatOdometerKm = formatOdometer;

/**
 * Formats an ISO date string into a readable local date.
 * e.g., "2026-10-28T06:00:00Z" -> "Oct 28, 2026"
 */
export function formatDate(isoString: string, locale = 'en-US'): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

/**
 * Formats relative time from now.
 * e.g., "2 hours ago", "yesterday", "just now"
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(isoString);
  } catch {
    return '';
  }
}

/**
 * Formats a vehicle display title.
 * e.g., (modelYear: 2022, name: "Classic 350", nickname: "Stealth Black") -> "2022 Classic 350 ('Stealth Black')"
 */
export function formatVehicleTitle(
  modelYear: number,
  modelName: string,
  nickname?: string
): string {
  const base = `${modelYear} ${modelName}`;
  return nickname ? `${base} ("${nickname}")` : base;
}

