type HolidayWindow = {
  names: string[];
  start: string;
  end: string;
  label: string;
};

// The reported 2026 Chuseok closure dates, interpreted in Korea time.
const HOLIDAY_WINDOWS: HolidayWindow[] = [
  { names: ['시티페이'], start: '2026-09-24', end: '2026-09-27', label: '9/24~9/27' },
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
    window.names.some((name) => siteName.includes(name)) && today >= window.start && today <= window.end
  ) ?? null;
}

export function isVendorHoliday(siteName: string, date = new Date()): boolean {
  return getVendorHoliday(siteName, date) !== null;
}
