const toISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseISO = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const countWorkingDays = (startISO, endISO, holidayDates = []) => {
  if (!startISO || !endISO || endISO < startISO) return 0;
  const holidays = new Set(holidayDates);
  let count = 0;
  const cur = parseISO(startISO);
  const end = parseISO(endISO);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6 && !holidays.has(toISO(cur))) count += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

export const todayISO = () => toISO(new Date());