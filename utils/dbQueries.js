import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Generic Supabase GET function
 * @param {string} table - Table name
 * @param {string[]} columns - Columns to select (e.g., ['id', 'name'])
 * @param {string} whereColumn - Column to apply where condition
 * @param {string|number} whereValue - Value for the where condition
 * @returns {Promise<{ data: any, error: any }>}
 */
export async function getData(table, columns, whereColumn, whereValue) {
  const { data, error } = await supabase
    .from(table)
    .select(columns.join(", "))
    .eq(whereColumn, whereValue);

  return { data, error };
}

/**
 * Generic Supabase UPSERT function
 * @param {string} table - Table name
 * @param {object[]} rows - Array of row objects to insert or update
 * @param {string} conflictColumn - Column with unique constraint to resolve conflicts
 * @returns {Promise<{ data: any, error: any }>}
 */
export async function upsertData(table, value, conflictColumn) {
  const { data, error } = await supabase
    .from(table)
    .upsert(value, { onConflict: conflictColumn })
    .select();

  return { data, error };
}
