import assert from 'node:assert/strict';
import test from 'node:test';
import { getVendorHoliday, isVendorHoliday, withoutVendorHolidays } from '../src/lib/vendor-holidays.ts';

test('price feeds exclude 하이티켓 until October 5 at 07:00 KST', () => {
  const rows = [{ site_name: '하이티켓', buy_price: 99000 }, { site_name: '우천상품권', buy_price: 98000 }];
  assert.deepEqual(withoutVendorHolidays(rows, new Date('2026-10-04T21:59:59Z')), [rows[1]]);
  assert.deepEqual(withoutVendorHolidays(rows, new Date('2026-10-04T22:00:00Z')), rows);
});

test('하이티켓 holiday starts October 3 and expires exactly October 5 at 07:00 KST', () => {
  const before = new Date('2026-10-02T14:59:59Z');
  const start = new Date('2026-10-02T15:00:00Z');
  const justBeforeEnd = new Date('2026-10-04T21:59:59Z');
  const end = new Date('2026-10-04T22:00:00Z');
  assert.equal(isVendorHoliday('하이티켓', before), false);
  assert.equal(isVendorHoliday('하이티켓', start), true);
  assert.equal(getVendorHoliday('하이티켓', justBeforeEnd)?.label, '10/3~10/5 07:00');
  assert.equal(isVendorHoliday('하이티켓', end), false);
});

test('other vendors are not affected on 2026-10-03', () => {
  assert.equal(isVendorHoliday('우천상품권', new Date('2026-10-03T03:00:00Z')), false);
});
