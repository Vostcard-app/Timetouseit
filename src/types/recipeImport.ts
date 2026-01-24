/**
 * Recipe Import Types
 */

export interface RecipeSite {
  id: string;
  label: string;
  baseUrl: string;
  searchTemplateUrl: string; // Contains {query} placeholder
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParsedIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
}

export interface RecipeImportResult {
  title: string;
  ingredients: string[];
  parsedIngredients?: ParsedIngredient[]; // AI-parsed structured ingredient data
  imageUrl?: string;
  sourceUrl: string;
  sourceDomain: string;
}

export interface RecipeSiteData {
  label: string;
  baseUrl: string;
  searchTemplateUrl: string;
  enabled: boolean;
}

