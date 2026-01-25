/**
 * Recipe URL Tab Component
 * Handles recipe URL import and favorite website selection
 */

import React from 'react';
import type { RecipeSite } from '../../types/recipeImport';
import { buttonStyles, inputStyles, combineStyles } from '../../styles/componentStyles';
import { spacing, colors } from '../../styles/designTokens';

interface RecipeUrlTabProps {
  recipeUrl: string;
  onRecipeUrlChange: (url: string) => void;
  onGetIngredients: () => void;
  importingRecipe: boolean;
  recipeImportError: boolean;
  favoriteWebsites: RecipeSite[];
  loadingFavorites: boolean;
  selectedFavoriteSite: RecipeSite | null;
  onFavoriteSiteSelect: (site: RecipeSite) => void;
  onViewFavoriteSite: () => void;
  onGoogleSearch: () => void;
  combinedIngredients: string[];
  selectedSearchIngredients: Set<string>;
  onToggleSearchIngredient: (ingredient: string) => void;
  onOpenGoogleSearchModal: () => void;
  isValidUrl: (url: string) => boolean;
}

export const RecipeUrlTab: React.FC<RecipeUrlTabProps> = ({
  recipeUrl,
  onRecipeUrlChange,
  onGetIngredients,
  importingRecipe,
  recipeImportError,
  favoriteWebsites,
  loadingFavorites,
  selectedFavoriteSite,
  onFavoriteSiteSelect,
  onViewFavoriteSite,
  onGoogleSearch,
  combinedIngredients,
  selectedSearchIngredients,
  onToggleSearchIngredient,
  onOpenGoogleSearchModal,
  isValidUrl,
}) => {
  return (
    <div>
      {/* Recipe URL Paste Field */}
      <div style={{ marginBottom: spacing.lg }}>
        <label htmlFor="recipeUrl" style={{ display: 'block', marginBottom: spacing.sm, fontSize: '0.875rem', fontWeight: 500, color: colors.gray[700] }}>
          Paste Recipe URL
        </label>
        <input
          id="recipeUrl"
          type="url"
          value={recipeUrl}
          onChange={(e) => onRecipeUrlChange(e.target.value)}
          placeholder="https://example.com/recipe"
          style={inputStyles.base}
        />
        <button
          onClick={onGetIngredients}
          disabled={!recipeUrl.trim() || importingRecipe || !isValidUrl(recipeUrl.trim())}
          style={combineStyles(
            buttonStyles.primary,
            { marginTop: spacing.md, width: '100%' },
            (!recipeUrl.trim() || importingRecipe || !isValidUrl(recipeUrl.trim())) && buttonStyles.disabled
          )}
        >
          {importingRecipe ? 'Importing...' : 'Get Ingredients'}
        </button>
        {importingRecipe && (
          <p style={{ marginTop: spacing.sm, fontSize: '0.875rem', color: colors.primary, fontStyle: 'italic', textAlign: 'center' }}>
            Importing recipe...
          </p>
        )}
        {recipeImportError && (
          <div style={{ marginTop: spacing.md, padding: spacing.md, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#991b1b', fontWeight: 500 }}>
              Copy then paste ingredients in the Add Ingredients tab
            </p>
          </div>
        )}
        <p style={{ marginTop: spacing.sm, fontSize: '0.875rem', color: colors.gray[500] }}>
          Paste a recipe URL and click "Get Ingredients" to import the recipe.
        </p>
      </div>

      {/* Favorite Websites Dropdown */}
      <div style={{ marginBottom: spacing.lg }}>
        <label htmlFor="favoriteWebsite" style={{ display: 'block', marginBottom: spacing.sm, fontSize: '0.875rem', fontWeight: 500, color: colors.gray[700] }}>
          Select Favorite Website
        </label>
        <select
          id="favoriteWebsite"
          value={selectedFavoriteSite?.id || ''}
          onChange={(e) => {
            if (e.target.value === '__add_favorite__') {
              const ingredientsToSearch = selectedSearchIngredients.size > 0
                ? Array.from(selectedSearchIngredients)
                : combinedIngredients.slice(0, 3);
              
              if (ingredientsToSearch.length === 0) {
                return;
              }
              
              onOpenGoogleSearchModal();
            } else {
              const site = favoriteWebsites.find(s => s.id === e.target.value);
              if (site) {
                onFavoriteSiteSelect(site);
              }
            }
          }}
          disabled={loadingFavorites}
          style={combineStyles(
            inputStyles.base,
            loadingFavorites && inputStyles.disabled
          )}
        >
          <option value="">Choose a favorite website...</option>
          {favoriteWebsites.map(site => (
            <option key={site.id} value={site.id}>
              {site.label}
            </option>
          ))}
          <option value="__add_favorite__" style={{ fontStyle: 'italic', color: colors.gray[500] }}>
            + Add Favorite (Google Search)
          </option>
        </select>
        {loadingFavorites && (
          <p style={{ marginTop: spacing.sm, fontSize: '0.875rem', color: colors.gray[500] }}>
            Loading favorite websites...
          </p>
        )}
        {!loadingFavorites && favoriteWebsites.length === 0 && (
          <p style={{ marginTop: spacing.sm, fontSize: '0.875rem', color: colors.error }}>
            No favorite websites found. Add favorites at{' '}
            <a 
              href="/favorite-websites" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: colors.primary, textDecoration: 'underline' }}
            >
              Favorite Websites
            </a>
          </p>
        )}
      </div>

      {/* View Button */}
      {selectedFavoriteSite && (
        <div style={{ marginBottom: spacing.lg }}>
          <button
            onClick={onViewFavoriteSite}
            style={combineStyles(buttonStyles.primary, { width: '100%' })}
          >
            View {selectedFavoriteSite.label}
          </button>
        </div>
      )}

      {/* Check up to 3 items to search */}
      {combinedIngredients.length > 0 && (
        <div style={{ marginBottom: spacing.lg, padding: spacing.md, backgroundColor: colors.gray[50], borderRadius: '6px', border: `1px solid ${colors.gray[200]}` }}>
          <h4 style={{ marginBottom: spacing.md, fontSize: '1rem', fontWeight: 600, color: colors.gray[900] }}>
            Check up to 3 items to search ({selectedSearchIngredients.size} of 3 selected)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, maxHeight: '200px', overflowY: 'auto' }}>
            {combinedIngredients.map((ingredient, index) => (
              <label
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: spacing.sm,
                  cursor: selectedSearchIngredients.size >= 3 && !selectedSearchIngredients.has(ingredient) ? 'not-allowed' : 'pointer',
                  borderRadius: '4px',
                  backgroundColor: selectedSearchIngredients.has(ingredient) ? '#f0f8ff' : 'transparent',
                  opacity: selectedSearchIngredients.size >= 3 && !selectedSearchIngredients.has(ingredient) ? 0.5 : 1
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedSearchIngredients.has(ingredient)}
                  onChange={() => onToggleSearchIngredient(ingredient)}
                  disabled={selectedSearchIngredients.size >= 3 && !selectedSearchIngredients.has(ingredient)}
                  style={{
                    marginRight: spacing.md,
                    width: '1.25rem',
                    height: '1.25rem',
                    cursor: selectedSearchIngredients.size >= 3 && !selectedSearchIngredients.has(ingredient) ? 'not-allowed' : 'pointer'
                  }}
                />
                <span style={{ flex: 1, fontSize: '0.875rem' }}>{ingredient}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Search with Google Button */}
      <div style={{ marginBottom: spacing.lg }}>
        <button
          onClick={onGoogleSearch}
          disabled={selectedSearchIngredients.size === 0 || selectedSearchIngredients.size > 3}
          style={combineStyles(
            buttonStyles.primary,
            { width: '100%' },
            (selectedSearchIngredients.size === 0 || selectedSearchIngredients.size > 3) && buttonStyles.disabled
          )}
        >
          Search with Google
        </button>
      </div>
    </div>
  );
};
