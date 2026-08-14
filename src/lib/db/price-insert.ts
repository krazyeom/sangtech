type PriceRow = {
  site_name: string;
  site_url: string;
  gift_card_type: string;
  denomination: number;
  buy_price: number;
  buy_rate: number;
  sell_price?: number | null;
  sell_rate?: number | null;
  crawled_at: string;
};

type DbClient = {
  from: (table: string) => {
    insert: (rows: PriceRow[]) => Promise<{ error: any }>;
  };
};

export async function insertPricesWithFallback(client: DbClient, rows: PriceRow[]) {
  try {
    const { error } = await client.from('prices').insert(rows);
    if (!error) return { insertedRows: rows, fallbackUsed: false, error: null };

    const isMissingSellColumns =
      error?.code === 'PGRST204' ||
      String(error?.message || '').includes('sell_price') ||
      String(error?.message || '').includes('sell_rate');

    if (!isMissingSellColumns) {
      return { insertedRows: rows, fallbackUsed: false, error };
    }

    const buyOnlyRows = rows.map(({ sell_price, sell_rate, ...rest }) => rest);
    const fallback = await client.from('prices').insert(buyOnlyRows as PriceRow[]);
    return {
      insertedRows: buyOnlyRows,
      fallbackUsed: true,
      error: fallback.error || null,
    };
  } catch (error) {
    return { insertedRows: rows, fallbackUsed: false, error };
  }
}