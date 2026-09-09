const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "just now", "5m ago", "3h ago", "18 Aug", "18 Aug 2023"
export function timeAgo(date) {
  if (!date) return "";

  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  // Older — show a short date, add the year when it's a past year
  const short = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  if (d.getFullYear() !== now.getFullYear()) {
    return `${short} ${d.getFullYear()}`;
  }
  return short;
}

// "23h 45m left", "2d 6h left", "45m left", "Poll ended"
export function pollTimeLeft(endsAt) {
  if (!endsAt) return "Poll ended";

  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Poll ended";

  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${Math.max(minutes, 1)}m left`;
}