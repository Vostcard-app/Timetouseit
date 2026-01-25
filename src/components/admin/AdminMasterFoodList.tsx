/**
 * Admin Master Food List Component
 * Manages the master food list (import, add, edit, delete, search, filter)
 */

import React, { useState, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebaseConfig';
import type { MasterFoodListItem } from '../../services/masterFoodListService';
import type { FoodKeeperItem } from '../../types';
import { getAllMasterFoodItems, createMasterFoodItem, updateMasterFoodItem, deleteMasterFoodItem, getMasterFoodListCategories, importFromJSON } from '../../services/masterFoodListService';
import foodkeeperData from '../../data/foodkeeper.json';
import { showToast } from '../Toast';
import { buttonStyles, cardStyles, inputStyles, combineStyles } from '../../styles/componentStyles';
import { textStyles } from '../../styles/componentStyles';
import { colors, spacing } from '../../styles/designTokens';

interface AdminMasterFoodListProps {
  onItemsChange: () => Promise<void>;
}

export const AdminMasterFoodList: React.FC<AdminMasterFoodListProps> = ({
  onItemsChange,
}) => {
  const [user] = useAuthState(auth);
  const [items, setItems] = useState<MasterFoodListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterFoodListItem | null>(null);
  const [formData, setFormData] = useState<FoodKeeperItem>({
    name: '',
    category: '',
    refrigeratorDays: null,
    freezerDays: null,
    pantryDays: null,
  });
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  // Load items and categories
  React.useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedItems, loadedCategories] = await Promise.all([
        getAllMasterFoodItems(),
        getMasterFoodListCategories(),
      ]);
      setItems(loadedItems);
      setCategories(loadedCategories);
    } catch (err) {
      console.error('Error loading master food list:', err);
      setError('Failed to load master food list');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, categoryFilter]);

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ name: '', category: '', refrigeratorDays: null, freezerDays: null, pantryDays: null });
    setShowForm(true);
  };

  const handleEdit = (item: MasterFoodListItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      refrigeratorDays: item.refrigeratorDays ?? null,
      freezerDays: item.freezerDays ?? null,
      pantryDays: item.pantryDays ?? null,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category) {
      showToast('Name and category are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const adminEmail = user?.email || '';
      if (editingItem) {
        await updateMasterFoodItem(editingItem.id, formData, adminEmail);
        showToast('Food item updated successfully', 'success');
      } else {
        await createMasterFoodItem(formData, adminEmail);
        showToast('Food item created successfully', 'success');
      }
      setShowForm(false);
      setEditingItem(null);
      await loadItems();
      await onItemsChange();
    } catch (err) {
      console.error('Error saving food item:', err);
      showToast('Failed to save food item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string, itemName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }

    try {
      await deleteMasterFoodItem(itemId);
      showToast('Food item deleted successfully', 'success');
      await loadItems();
      await onItemsChange();
    } catch (err) {
      console.error('Error deleting food item:', err);
      showToast('Failed to delete food item', 'error');
    }
  };

  const handleImport = async () => {
    if (!window.confirm('This will import all items from the default foodkeeper.json. Continue?')) {
      return;
    }

    setImporting(true);
    try {
      const adminEmail = user?.email || '';
      await importFromJSON(foodkeeperData as FoodKeeperItem[], adminEmail);
      showToast('Import completed successfully', 'success');
      await loadItems();
      await onItemsChange();
    } catch (err) {
      console.error('Error importing from JSON:', err);
      showToast('Failed to import from JSON', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ marginBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={combineStyles(textStyles.heading3, { margin: 0 })}>
          Master Food List Management
        </h2>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <button
            onClick={handleImport}
            disabled={importing}
            style={combineStyles(
              buttonStyles.success,
              importing && buttonStyles.disabled
            )}
          >
            {importing ? 'Importing...' : 'Import from JSON'}
          </button>
          <button onClick={handleCreate} style={buttonStyles.primary}>
            Add Food Item
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: spacing.md,
          backgroundColor: '#fee2e2',
          border: `1px solid ${colors.error}`,
          borderRadius: '8px',
          marginBottom: spacing.lg,
          color: '#991b1b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{error}</span>
          <button
            onClick={loadItems}
            style={{
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.875rem',
              marginLeft: spacing.md
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.lg, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search food items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={combineStyles(inputStyles.base, { flex: 1, minWidth: '200px' })}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={combineStyles(inputStyles.base, { minWidth: '150px' })}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div style={combineStyles(cardStyles.base, { marginBottom: spacing.lg })}>
          <h3 style={combineStyles(textStyles.heading3, { margin: `0 0 ${spacing.md} 0`, fontSize: '1.125rem' })}>
            {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <div>
              <label style={{ display: 'block', marginBottom: spacing.sm, fontSize: '0.875rem', fontWeight: 500 }}>
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Milk"
                disabled={!!editingItem}
                style={combineStyles(inputStyles.base, editingItem && inputStyles.disabled)}
              />
              {editingItem && (
                <p style={{ fontSize: '0.75rem', color: colors.gray[500], marginTop: spacing.xs }}>
                  Name cannot be changed after creation
                </p>
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: spacing.sm, fontSize: '0.875rem', fontWeight: 500 }}>
                Category *
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Dairy"
                list="category-suggestions"
                style={inputStyles.base}
              />
              <datalist id="category-suggestions">
                {categories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.md }}>
              <div>
                <label style={{ display: 'block', marginBottom: spacing.sm, fontSize: '0.875rem', fontWeight: 500 }}>
                  Refrigerator Days
                </label>
                <input
                  type="number"
                  value={formData.refrigeratorDays ?? ''}
                  onChange={(e) => setFormData({ ...formData, refrigeratorDays: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Days"
                  min="0"
                  style={inputStyles.base}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: spacing.sm, fontSize: '0.875rem', fontWeight: 500 }}>
                  Freezer Days
                </label>
                <input
                  type="number"
                  value={formData.freezerDays ?? ''}
                  onChange={(e) => setFormData({ ...formData, freezerDays: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Days"
                  min="0"
                  style={inputStyles.base}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: spacing.sm, fontSize: '0.875rem', fontWeight: 500 }}>
                  Pantry Days
                </label>
                <input
                  type="number"
                  value={formData.pantryDays ?? ''}
                  onChange={(e) => setFormData({ ...formData, pantryDays: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Days"
                  min="0"
                  style={inputStyles.base}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  setFormData({ name: '', category: '', refrigeratorDays: null, freezerDays: null, pantryDays: null });
                }}
                disabled={saving}
                style={combineStyles(buttonStyles.secondary, saving && buttonStyles.disabled)}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={combineStyles(buttonStyles.primary, saving && buttonStyles.disabled)}
              >
                {saving ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: colors.gray[500] }}>
          <p>Loading master food list...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: colors.gray[500] }}>
          <p>
            {items.length === 0
              ? 'No food items in master list. Click "Import from JSON" to import the default list, or "Add Food Item" to create one.'
              : 'No food items match your search/filter criteria.'}
          </p>
        </div>
      ) : (
        <div style={combineStyles(cardStyles.base, { maxHeight: '600px', overflowY: 'auto' })}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr',
            gap: spacing.md,
            padding: spacing.md,
            backgroundColor: colors.gray[50],
            borderBottom: `1px solid ${colors.gray[200]}`,
            fontWeight: 600,
            color: colors.gray[700],
            fontSize: '0.875rem',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <div>Name</div>
            <div>Category</div>
            <div style={{ textAlign: 'center' }}>Refrigerator</div>
            <div style={{ textAlign: 'center' }}>Freezer</div>
            <div style={{ textAlign: 'center' }}>Pantry</div>
            <div style={{ textAlign: 'center' }}>Actions</div>
          </div>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr',
                gap: spacing.md,
                padding: spacing.md,
                borderBottom: `1px solid ${colors.gray[200]}`,
                alignItems: 'center'
              }}
            >
              <div style={{ fontWeight: 500, color: colors.gray[900] }}>{item.name}</div>
              <div style={{ fontSize: '0.875rem', color: colors.gray[500] }}>{item.category}</div>
              <div style={{ textAlign: 'center', color: colors.gray[500] }}>{item.refrigeratorDays ?? '-'}</div>
              <div style={{ textAlign: 'center', color: colors.gray[500] }}>{item.freezerDays ?? '-'}</div>
              <div style={{ textAlign: 'center', color: colors.gray[500] }}>{item.pantryDays ?? '-'}</div>
              <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'center' }}>
                <button onClick={() => handleEdit(item)} style={buttonStyles.primary}>
                  Edit
                </button>
                <button onClick={() => handleDelete(item.id, item.name)} style={buttonStyles.danger}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          <div style={{
            padding: spacing.md,
            backgroundColor: colors.gray[50],
            borderTop: `1px solid ${colors.gray[200]}`,
            fontSize: '0.875rem',
            color: colors.gray[500],
            textAlign: 'center'
          }}>
            Showing {filteredItems.length} of {items.length} items
          </div>
        </div>
      )}
    </div>
  );
};
