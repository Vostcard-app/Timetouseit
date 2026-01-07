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

export interface RecipeImportResult {
  title: string;
  ingredients: string[];
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

