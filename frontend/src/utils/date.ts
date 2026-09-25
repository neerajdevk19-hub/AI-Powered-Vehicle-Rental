export const formatDateTimeDisplay = (rawStr: string | Date | undefined | null): string => {
  if (!rawStr) return '';
  try {
    const d = typeof rawStr === 'string' ? new Date(rawStr) : rawStr;
    if (isNaN(d.getTime())) return String(rawStr);

    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  } catch {
    return String(rawStr);
  }
};
