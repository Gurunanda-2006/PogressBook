import { nanoid } from 'nanoid';

/**
 * Generate a unique ID with an optional prefix.
 * Examples: "ses_V1StGXR8_Z5jdHi6B", "todo_a3fWea9Fg4", "txn_Uakgb_2FBR"
 */
export function generateId(prefix = '') {
  const id = nanoid(12);
  return prefix ? `${prefix}_${id}` : id;
}
