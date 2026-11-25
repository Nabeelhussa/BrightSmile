export function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const dt = new Date(year, month - 1, day);
  return dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDisplayTime(timeStr) {
  if (!timeStr) return '—';
  const [hoursRaw, minutesRaw] = timeStr.split(':').map(Number);
  if (Number.isNaN(hoursRaw) || Number.isNaN(minutesRaw)) return timeStr;
  const suffix = hoursRaw >= 12 ? 'PM' : 'AM';
  const hours12 = hoursRaw % 12 || 12;
  return `${hours12}:${String(minutesRaw).padStart(2, '0')} ${suffix}`;
}

export function getInitials(name = '') {
  const cleaned = name.replace(/^Dr\.\s+/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const SPECIALIZATIONS = [
  'General Dentistry',
  'Orthodontics',
  'Endodontics',
  'Periodontics',
  'Pediatric Dentistry',
  'Prosthodontics',
  'Oral Surgery',
  'Cosmetic Dentistry',
];

export const APPOINTMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];
