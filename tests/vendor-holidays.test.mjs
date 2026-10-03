import assert from 'node:assert/strict';
import test from 'node:test';
import { getVendorHoliday, isVendorHoliday, withoutVendorHolidays } from '../src/lib/vendor-holidays.ts';

test('price feeds exclude closed vendors only during the KST holiday', () => {
  const rows = [{ site_name: '하이티켓', buy_price: 99000 }, { site_name: '우천상품권', buy_price: 98000 }];
  assert.deepEqual(withoutVendorHolidays(rows, new Date('2026-10-03T03:00:00Z')), [rows[1]]);
  assert.deepEqual(withoutVendorHolidays(rows, new Date('2026-10-03T15:00:00Z')), rows);
});

test('하이티켓 prices are hidden only on 2026-10-03 in Korea', () => {
  const before = new Date('2026-10-02T14:59:59Z');
  const start = new Date('2026-10-02T15:00:00Z');
  const end = new Date('2026-10-03T14:59:59Z');
  const after = new Date('2026-10-03T15:00:00Z');
  assert.equal(isVendorHoliday('하이티켓', before), false);
  assert.equal(isVendorHoliday('하이티켓', start), true);
  assert.equal(getVendorHoliday('하이티켓', end)?.label, '10/3');
  assert.equal(isVendorHoliday('하이티켓', after), false);
});

test('other vendors are not affected on 2026-10-03', () => {
  assert.equal(isVendorHoliday('우천상품권', new Date('2026-10-03T03:00:00Z')), false);
});
