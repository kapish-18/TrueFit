// Date formatting and calculation helpers

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getToday() {
  return formatDate(new Date());
}

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date as readable string — "Mon, Jun 26"
 */
export function formatDateReadable(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

/**
 * Get the start of the current week (Monday) as YYYY-MM-DD
 */
export function getWeekStart(dateStr = null) {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d);
  monday.setDate(diff);
  return formatDate(monday);
}

/**
 * Get date N days ago as YYYY-MM-DD
 */
export function getDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDate(d);
}

/**
 * Get date N weeks ago
 */
export function getWeeksAgo(n) {
  return getDaysAgo(n * 7);
}

/**
 * Get the ISO week number of a date
 */
export function getWeekNumber(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

/**
 * Get difference in days between two date strings
 */
export function daysBetween(date1, date2) {
  const d1 = new Date(date1 + 'T00:00:00');
  const d2 = new Date(date2 + 'T00:00:00');
  return Math.abs(Math.round((d2 - d1) / 86400000));
}

/**
 * Get an array of the last N week start dates
 */
export function getLastNWeeks(n) {
  const weeks = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (i * 7));
    weeks.push(getWeekStart(formatDate(d)));
  }
  return weeks.reverse();
}

/**
 * Format a timestamp to a relative time string — "2 days ago"
 */
export function timeAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.floor((now - then) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  return `${Math.floor(diffDays / 30)} months ago`;
}
