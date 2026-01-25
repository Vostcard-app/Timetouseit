/**
 * Admin Recipe Sites Component
 * Manages recipe sites (add, edit, delete, enable/disable)
 */

import React, { useState } from 'react';
import type { RecipeSite, RecipeSiteData } from '../../types/recipeImport';
import { recipeSiteService } from '../../services/recipeSiteService';
import { showToast } from '../Toast';
import { buttonStyles, cardStyles, inputStyles, combineStyles } from '../../styles/componentStyles';
import { textStyles } from '../../styles/componentStyles';
import { colors, spacing } from '../../styles/designTokens';

interface AdminRecipeSitesProps {
  recipeSites: RecipeSite[];
  loading: boolean;
  onSitesChange: () => Promise<void>;
}

export const AdminRecipeSites: React.FC<AdminRecipeSitesProps> = ({
  recipeSites,
  loading,
  onSitesChange,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState<RecipeSite | null>(null);
  const [formData, setFormData] = useState<RecipeSiteData>({
    label: '',
    baseUrl: '',
    searchTemplateUrl: '',
    enabled: true,
  });
  const [saving, setSaving] = useState(false);

  const handleCreate = () => {
    setEditingSite(null);
    setFormData({ label: '', baseUrl: '', searchTemplateUrl: '', enabled: true });
    setShowForm(true);
  };

  const handleEdit = (site: RecipeSite) => {
    setEditingSite(site);
    setFormData({
      label: site.label,
      baseUrl: site.baseUrl,
      searchTemplateUrl: site.searchTemplateUrl,
      enabled: site.enabled,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.label || !formData.baseUrl || !formData.searchTemplateUrl) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingSite) {
        await recipeSiteService.updateRecipeSite(editingSite.id, formData);
        showToast('Recipe site updated successfully', 'success');
      } else {
        await recipeSiteService.createRecipeSite(formData);
        showToast('Recipe site created successfully', 'success');
      }
      setShowForm(false);
      setEditingSite(null);
      await onSitesChange();
    } catch (error) {
      console.error('Error saving recipe site:', error);
      showToast('Failed to save recipe site', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (siteId: string) => {
    if (!window.confirm(`Are you sure you want to delete "${recipeSites.find(s => s.id === siteId)?.label}"?`)) {
      return;
    }

    try {
      await recipeSiteService.deleteRecipeSite(siteId);
      showToast('Recipe site deleted successfully', 'success');
      await onSitesChange();
    } catch (error) {
      console.error('Error deleting recipe site:', error);
      showToast('Failed to delete recipe site', 'error');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSite(null);
    setFormData({ label: '', baseUrl: '', searchTemplateUrl: '', enabled: true });
  };

  return (
    <div style={{ marginBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={combineStyles(textStyles.heading3, { margin: 0 })}>
          Recipe Sites Management
        </h2>
        <button onClick={handleCreate} style={buttonStyles.primary}>
          Add Recipe Site
        </button>
      </div>

      {showForm && (
        <div style={combineStyles(cardStyles.base, { marginBottom: spacing.lg })}>
          <h3 style={combineStyles(textStyles.heading3, { margin: `0 0 ${spacing.md} 0`, fontSize: '1.125rem' })}>
            {editingSite ? 'Edit Recipe Site' : 'Add New Recipe Site'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <div>
              <label style={{ display: 'block', marginBottom: spacing.sm, fontSize: '0.875rem', fontWeight: 500 }}>
                Label *
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., AllRecipes"
                style={inputStyles.base}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: spacing.sm, fontSize: '0.875rem', fontWeight: 500 }}>
                Base URL *
              </label>
              <input
                type="url"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder="https://www.allrecipes.com"
                style={inputStyles.base}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: spacing.sm, fontSize: '0.875rem', fontWeight: 500 }}>
                Search Template URL * (must contain {'{query}'})
              </label>
              <input
                type="url"
                value={formData.searchTemplateUrl}
                onChange={(e) => setFormData({ ...formData, searchTemplateUrl: e.target.value })}
                placeholder="https://www.allrecipes.com/search/results/?search={query}"
                style={inputStyles.base}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <input
                type="checkbox"
                id="recipe-site-enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
              <label htmlFor="recipe-site-enabled" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
                Enabled
              </label>
            </div>
            <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
              <button onClick={handleCancel} disabled={saving} style={combineStyles(buttonStyles.secondary, saving && buttonStyles.disabled)}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={combineStyles(buttonStyles.primary, saving && buttonStyles.disabled)}>
                {saving ? 'Saving...' : (editingSite ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: colors.gray[500] }}>
          <p>Loading recipe sites...</p>
        </div>
      ) : recipeSites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: colors.gray[500] }}>
          <p>No recipe sites configured. Add one to get started.</p>
        </div>
      ) : (
        <div style={cardStyles.base}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 3fr 3fr 1fr 1fr',
            gap: spacing.md,
            padding: spacing.md,
            backgroundColor: colors.gray[50],
            borderBottom: `1px solid ${colors.gray[200]}`,
            fontWeight: 600,
            color: colors.gray[700],
            fontSize: '0.875rem'
          }}>
            <div>Label</div>
            <div>Base URL</div>
            <div>Search Template</div>
            <div style={{ textAlign: 'center' }}>Enabled</div>
            <div style={{ textAlign: 'center' }}>Actions</div>
          </div>
          {recipeSites.map((site) => (
            <div
              key={site.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 3fr 3fr 1fr 1fr',
                gap: spacing.md,
                padding: spacing.md,
                borderBottom: `1px solid ${colors.gray[200]}`,
                alignItems: 'center'
              }}
            >
              <div style={{ fontWeight: 500, color: colors.gray[900] }}>{site.label}</div>
              <div style={{ fontSize: '0.875rem', color: colors.gray[500], wordBreak: 'break-all' }}>{site.baseUrl}</div>
              <div style={{ fontSize: '0.875rem', color: colors.gray[500], wordBreak: 'break-all' }}>{site.searchTemplateUrl}</div>
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  backgroundColor: site.enabled ? '#d1fae5' : '#fee2e2',
                  color: site.enabled ? '#065f46' : '#991b1b'
                }}>
                  {site.enabled ? 'Yes' : 'No'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'center' }}>
                <button onClick={() => handleEdit(site)} style={buttonStyles.primary}>
                  Edit
                </button>
                <button onClick={() => handleDelete(site.id)} style={buttonStyles.danger}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
