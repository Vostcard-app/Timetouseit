/**
 * Google Search Recipe Modal
 * Opens Google search with ingredients, allows copying recipe URLs and importing recipes
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebaseConfig';
import { recipeImportService } from '../../services';
import type { RecipeImportResult } from '../../types/recipeImport';
import { showToast } from '../Toast';
import { BaseModal } from '../ui/BaseModal';
import { buttonStyles, combineStyles } from '../../styles/componentStyles';
import { spacing } from '../../styles/designTokens';

interface GoogleSearchRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: string[];
  onRecipeImported: (recipe: RecipeImportResult) => void;
}

export const GoogleSearchRecipeModal: React.FC<GoogleSearchRecipeModalProps> = ({
  isOpen,
  onClose,
  ingredients,
  onRecipeImported
}) => {
  const [user] = useAuthState(auth);
  const [pastedUrl, setPastedUrl] = useState('');
  const [importingRecipe, setImportingRecipe] = useState(false);
  const [importedRecipe, setImportedRecipe] = useState<RecipeImportResult | null>(null);
  const [dishName, setDishName] = useState('');
  const [saving, setSaving] = useState(false);

  // Build Google search URL with ingredients
  const searchUrl = useMemo(() => {
    if (ingredients.length === 0) return '';
    const query = `${ingredients.join(' ')} recipe`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }, [ingredients]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPastedUrl('');
      setImportedRecipe(null);
      setDishName('');
      setImportingRecipe(false);
      setSaving(false);
    }
  }, [isOpen]);

  // Auto-set dish name from imported recipe
  useEffect(() => {
    if (importedRecipe && importedRecipe.title && !dishName.trim()) {
      setDishName(importedRecipe.title);
    }
  }, [importedRecipe, dishName]);

  const handlePasteUrl = async () => {
    if (!pastedUrl.trim()) {
      showToast('Please paste a recipe URL', 'warning');
      return;
    }

    // Validate URL
    try {
      new URL(pastedUrl);
    } catch {
      showToast('Please enter a valid URL', 'error');
      return;
    }

    setImportingRecipe(true);
    try {
      const recipe = await recipeImportService.importRecipe(pastedUrl, user?.uid);
      setImportedRecipe(recipe);
      if (recipe.title && !dishName.trim()) {
        setDishName(recipe.title);
      }
      showToast('Recipe imported successfully!', 'success');
    } catch (error: unknown) {
      console.error('Error importing recipe:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import recipe. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setImportingRecipe(false);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(searchUrl, '_blank');
    showToast('Google search opened in new tab. Copy the recipe URL and return here to paste it.', 'info');
  };

  const handleSaveRecipe = () => {
    if (!dishName.trim()) {
      showToast('Please enter a dish name', 'error');
      return;
    }

    if (!importedRecipe) {
      showToast('Please import a recipe first', 'error');
      return;
    }

    setSaving(true);
    try {
      onRecipeImported(importedRecipe);
      showToast('Recipe added to dish ingredients!', 'success');
      onClose();
    } catch (error) {
      console.error('Error saving recipe:', error);
      showToast('Failed to save recipe. Please try again.', 'error');
      setSaving(false);
    }
  };

  // Footer buttons
  const footer = (
    <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
      <button
        onClick={onClose}
        disabled={saving}
        style={combineStyles(
          buttonStyles.secondary,
          saving && buttonStyles.disabled
        )}
      >
        Cancel
      </button>
      <button
        onClick={handleSaveRecipe}
        disabled={!dishName.trim() || !importedRecipe || saving}
        style={combineStyles(
          buttonStyles.primary,
          (!dishName.trim() || !importedRecipe || saving) && buttonStyles.disabled
        )}
      >
        {saving ? 'Saving...' : 'Add to Dish'}
      </button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Search Recipes on Google"
      size="full"
      footer={footer}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {/* Search Info */}
          <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
              Searching for:
            </p>
            <p style={{ margin: 0, fontSize: '1rem', color: '#1f2937', fontWeight: '600' }}>
              {ingredients.join(', ')} recipe
            </p>
          </div>

          {/* Instructions */}
          <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af' }}>
              💡 <strong>Tip:</strong> Browse Google results below. When you find a recipe, click "Open in New Tab" to copy the URL more easily.
            </p>
          </div>

          {/* Google Search iframe */}
          <div style={{ position: 'relative', flex: 1, minHeight: '500px', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
            {/* Floating "Open in New Tab" button */}
            <button
              onClick={handleOpenInNewTab}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                zIndex: 10,
                padding: '0.5rem 1rem',
                backgroundColor: '#002B4D',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                whiteSpace: 'nowrap'
              }}
              title="Open Google search in a new tab for easier URL copying"
            >
              Open in New Tab
            </button>
            <iframe
              src={searchUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                minHeight: '500px'
              }}
              title="Google Recipe Search"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          </div>

          {/* Paste URL and Import Section */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
              Paste Recipe URL to Import Ingredients:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="url"
                value={pastedUrl}
                onChange={(e) => setPastedUrl(e.target.value)}
                placeholder="https://example.com/recipe"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  color: '#1f2937'
                }}
              />
              <button
                onClick={handlePasteUrl}
                disabled={!pastedUrl.trim() || importingRecipe}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: (!pastedUrl.trim() || importingRecipe) ? '#9ca3af' : '#002B4D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: (!pastedUrl.trim() || importingRecipe) ? 'not-allowed' : 'pointer'
                }}
              >
                {importingRecipe ? 'Importing...' : 'Import Recipe'}
              </button>
            </div>

            {importedRecipe && (
              <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#166534', fontWeight: '500' }}>
                  ✓ Recipe imported: {importedRecipe.title}
                </p>
                {importedRecipe.ingredients && importedRecipe.ingredients.length > 0 && (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#15803d' }}>
                    {importedRecipe.ingredients.length} ingredient{importedRecipe.ingredients.length !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Dish Name */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
              Dish Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="Enter dish name (required)"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                color: '#1f2937'
              }}
            />
          </div>
      </div>
    </BaseModal>
  );
};
