/**
 * Fuzzy Ingredient Matcher
 * Matches ingredients to shopping list items or dashboard items using fuzzy matching
 */

import { normalizeItemName, parseIngredientQuantity } from './ingredientQuantityParser';

/**
 * Calculate similarity between two strings using word overlap
 * Returns a score between 0 and 1
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/).filter(w => w.length > 2);
  const words2 = str2.split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  let matches = 0;
  const totalWords = Math.max(words1.length, words2.length);
  
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matches++;
        break;
      }
    }
  }
  
  return matches / totalWords;
}

/**
 * Fuzzy match an ingredient string to an item name
 * Returns true if they match (using various matching strategies)
 */
export function fuzzyMatchIngredientToItem(ingredient: string, itemName: string): boolean {
  // Parse ingredient to get the item name part
  const parsed = parseIngredientQuantity(ingredient);
  const ingredientName = parsed.itemName;
  
  // Normalize both names
  const normalizedIngredient = normalizeItemName(ingredientName);
  const normalizedItem = normalizeItemName(itemName);
  
  // 1. Exact match (after normalization)
  if (normalizedIngredient === normalizedItem) {
    return true;
  }
  
  // 2. Substring match (ingredient contains item or vice versa)
  if (normalizedIngredient.includes(normalizedItem) || normalizedItem.includes(normalizedIngredient)) {
    return true;
  }
  
  // 3. Word overlap - check if at least 2 significant words match
  const ingredientWords = normalizedIngredient.split(/\s+/).filter(w => w.length > 2);
  const itemWords = normalizedItem.split(/\s+/).filter(w => w.length > 2);
  
  if (ingredientWords.length === 0 || itemWords.length === 0) {
    return false;
  }
  
  const matchingWords = ingredientWords.filter(ingWord => 
    itemWords.some(itemWord => 
      ingWord === itemWord || 
      ingWord.includes(itemWord) || 
      itemWord.includes(ingWord)
    )
  );
  
  // Require at least 2 matching words, or all words if there are only 1-2 words total
  const minMatches = Math.min(2, Math.min(ingredientWords.length, itemWords.length));
  if (matchingWords.length >= minMatches) {
    return true;
  }
  
  // 4. Similarity score (70% threshold)
  const similarity = calculateSimilarity(normalizedIngredient, normalizedItem);
  if (similarity >= 0.7) {
    return true;
  }
  
  return false;
}

/**
 * Find the best matching item name from a list of items
 * Returns the item name if a match is found, null otherwise
 */
export function findBestMatch(
  ingredient: string,
  itemNames: string[]
): string | null {
  for (const itemName of itemNames) {
    if (fuzzyMatchIngredientToItem(ingredient, itemName)) {
      return itemName;
    }
  }
  return null;
}
