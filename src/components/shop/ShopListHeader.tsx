/**
 * Shop List Header Component
 * Header with list selector, add item form, and scan button
 */

import React from 'react';
import type { ShoppingList } from '../../types';
import { buttonStyles, inputStyles, combineStyles } from '../../styles/componentStyles';
import { colors, spacing } from '../../styles/designTokens';

interface ShopListHeaderProps {
  shoppingLists: ShoppingList[];
  selectedListId: string | null;
  onListChange: (listId: string) => void;
  onCreateListClick: () => void;
  newItemName: string;
  onNewItemNameChange: (value: string) => void;
  onAddItem: (e: React.FormEvent) => void;
  showDropdown: boolean;
  inputFocused: boolean;
  onInputFocus: () => void;
  onInputBlur: () => void;
  foodKeeperSuggestions: Array<{ name: string; category: string }>;
  onSuggestionClick: (name: string) => void;
  isPremium: boolean;
  onAddItemScanClick: () => void;
}

export const ShopListHeader: React.FC<ShopListHeaderProps> = ({
  shoppingLists,
  selectedListId,
  onListChange,
  onCreateListClick,
  newItemName,
  onNewItemNameChange,
  onAddItem,
  showDropdown,
  inputFocused,
  onInputFocus,
  onInputBlur,
  foodKeeperSuggestions,
  onSuggestionClick,
  isPremium,
  onAddItemScanClick,
}) => {
  return (
    <div style={{ marginBottom: spacing.lg }}>
      <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.md }}>
        <select
          value={selectedListId || ''}
          onChange={(e) => onListChange(e.target.value)}
          style={{
            flex: 1,
            height: '42px',
            padding: `${spacing.sm} ${spacing.md}`,
            border: `1px solid ${colors.gray[300]}`,
            borderRadius: '6px',
            fontSize: '1.25rem',
            fontWeight: 500,
            fontFamily: 'inherit',
            color: colors.gray[900],
            outline: 'none',
            backgroundColor: colors.white,
            cursor: 'pointer'
          }}
        >
          {shoppingLists.length === 0 ? (
            <option value="">No lists available</option>
          ) : (
            <>
              {!selectedListId && <option value="">Select a list</option>}
              {shoppingLists.map((list) => {
                const displayName = list.name
                  .split(/\s+/)
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(' ');
                return (
                  <option key={list.id} value={list.id} style={{ fontSize: '1.25rem' }}>
                    {displayName}
                  </option>
                );
              })}
              <option value="__add_list__" style={{ fontStyle: 'italic', color: colors.gray[500] }}>
                + Add list
              </option>
            </>
          )}
        </select>
        <button
          onClick={onCreateListClick}
          style={combineStyles(
            buttonStyles.primary,
            {
              height: '42px',
              minWidth: '100px',
              fontSize: '1.25rem'
            }
          )}
        >
          {shoppingLists.length === 0 ? 'Create list' : 'Lists'}
        </button>
      </div>

      {/* Add Item Form */}
      <form onSubmit={onAddItem} style={{ display: 'flex', gap: spacing.sm, position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={newItemName}
            onChange={(e) => {
              onNewItemNameChange(e.target.value);
            }}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            placeholder="Add item to list"
            style={{
              ...inputStyles.base,
              height: '42px'
            }}
          />
          {/* Dropdown with FoodKeeper suggestions */}
          {showDropdown && (inputFocused || newItemName.trim()) && foodKeeperSuggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                backgroundColor: colors.white,
                border: `1px solid ${colors.gray[300]}`,
                borderRadius: '6px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1000
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {foodKeeperSuggestions.map((suggestion, index) => (
                <div
                  key={`foodkeeper-${suggestion.name}-${index}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSuggestionClick(suggestion.name);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    padding: `${spacing.md} ${spacing.md}`,
                    borderBottom: `1px solid ${colors.gray[100]}`,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    backgroundColor: '#fef3c7'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fde68a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef3c7';
                  }}
                >
                  <div style={{ fontSize: '1rem', fontWeight: 500, color: colors.gray[900] }}>
                    {suggestion.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[500] }}>
                    {suggestion.category}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
          <button
            type="submit"
            style={combineStyles(
              buttonStyles.primary,
              {
                padding: spacing.sm,
                fontSize: '1.5rem',
                height: '42px',
                width: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }
            )}
            aria-label="Add item"
            title="Add item"
          >
            +
          </button>
          {isPremium && (
            <button
              type="button"
              onClick={onAddItemScanClick}
              style={combineStyles(
                buttonStyles.success,
                {
                  padding: '0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  height: '42px',
                  width: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }
              )}
              aria-label="AI"
              title="AI"
            >
              <img 
                src="/icons/Scan.svg" 
                alt="Scan" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            </button>
          )}
        </div>
      </form>
      <div style={{ 
        marginTop: spacing.xs, 
        fontSize: '1.25rem', 
        color: colors.gray[900],
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        Swipe to remove
      </div>
    </div>
  );
};
