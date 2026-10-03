type HolidayWindow = {
  names: string[];
  start: string;
  end: string;
  endsAt?: string;
  label: string;
};

// Reported vendor closures, interpreted in Korea time.
const HOLIDAY_WINDOWS: HolidayWindow[] = [
  { names: ['하이티켓'], start: '2026-10-03', end: '2026-10-05', endsAt: '2026-10-05T07:00:00+09:00', label: '10/3~10/5 07:00' },
  { names: ['시티페이', '씨티상품권'], start: '2026-09-24', end: '2026-09-27', label: '9/24~9/27' },
  { names: ['우현'], start: '2026-09-24', end: '2026-09-27', label: '9/24~9/27' },
  { names: ['고고상품'], start: '2026-09-24', end: '2026-09-27', label: '9/24~9/27' },
  { names: ['드림상품권'], start: '2026-09-24', end: '2026-09-27', label: '9/24~9/27' },
  { names: ['최고상품권'], start: '2026-09-24', end: '2026-09-27', label: '9/24~9/27' },
  { names: ['마이페이'], start: '2026-09-24', end: '2026-09-25', label: '9/24~9/25' },
  { names: ['VIP상품'], start: '2026-09-24', end: '2026-09-25', label: '9/24~9/25' },
];

function koreaDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export function getVendorHoliday(siteName: string, date = new Date()): HolidayWindow | null {
  const today = koreaDateKey(date);
  return HOLIDAY_WINDOWS.find((window) =>
    window.names.some((name) => siteName.includes(name)) &&
    today >= window.start && today <= window.end &&
    (!window.endsAt || date.getTime() < new Date(window.endsAt).getTime())
  ) ?? null;
}

export function isVendorHoliday(siteName: string, date = new Date()): boolean {
  return getVendorHoliday(siteName, date) !== null;
}

export function withoutVendorHolidays<T extends { site_name: string }>(prices: T[], date = new Date()): T[] {
  return prices.filter((price) => !isVendorHoliday(price.site_name, date));
}
