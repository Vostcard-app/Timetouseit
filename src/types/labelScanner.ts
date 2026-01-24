/**
 * Label Scanner Types
 */

export interface LabelScanResult {
  itemName: string;
  quantity?: number;
  expirationDate?: Date | null;
}
