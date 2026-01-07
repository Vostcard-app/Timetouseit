/**
 * SwipeableListItem Component
 * A list item that can be swiped right to reveal delete action
 * 
 * @example
 * ```tsx
 * <SwipeableListItem 
 *   item={foodItem}
 *   onDelete={() => handleDelete()}
 *   onClick={() => navigate('/item-detail')}
 * />
 * ```
 */

import React, { useState, useRef, useEffect } from 'react';
import type { FoodItem } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface SwipeableListItemProps {
  /** The food item to display */
  item: FoodItem;
  /** Callback when item is swiped and deleted */
  onDelete: () => void;
  /** Callback when item is clicked/tapped */
  onClick?: () => void;
  /** Callback when freeze button is clicked */
  onFreeze?: () => void;
}

/**
 * SwipeableListItem component with swipe-to-delete functionality
 */
const SwipeableListItem: React.FC<SwipeableListItemProps> = React.memo(({ item, onDelete, onClick, onFreeze }) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const itemRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = 100; // Minimum swipe distance to trigger delete

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    // Allow swiping both left and right
    const maxSwipe = SWIPE_THRESHOLD * 2;
    if (Math.abs(diff) <= maxSwipe) {
      setTranslateX(diff);
    } else {
      setTranslateX(diff > 0 ? maxSwipe : -maxSwipe);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Check if swipe distance exceeds threshold in either direction
    if (Math.abs(translateX) >= SWIPE_THRESHOLD) {
      // Show confirmation before removing
      const confirmed = window.confirm('Are you sure you want to remove this item?');
      if (confirmed) {
        onDelete();
      }
      setTranslateX(0);
      return;
    } else {
      // Snap back - do not trigger onClick, only Edit button should edit
      setTranslateX(0);
    }
  };

  // Handle mouse events for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  // Add global mouse move/up listeners when dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const diff = e.clientX - startX;
        // Allow swiping both left and right
        const maxSwipe = SWIPE_THRESHOLD * 2;
        if (Math.abs(diff) <= maxSwipe) {
          setTranslateX(diff);
        } else {
          setTranslateX(diff > 0 ? maxSwipe : -maxSwipe);
        }
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        // Check if swipe distance exceeds threshold in either direction
        if (Math.abs(translateX) >= SWIPE_THRESHOLD) {
          // Show confirmation before removing
          const confirmed = window.confirm('Are you sure you want to remove this item?');
          if (confirmed) {
            onDelete();
          }
          setTranslateX(0);
          return;
        } else {
          // Snap back - do not trigger onClick, only Edit button should edit
          setTranslateX(0);
        }
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, startX, translateX, onDelete]);

  const deleteOpacity = Math.min(Math.abs(translateX) / SWIPE_THRESHOLD, 1);

  return (
    <div
      ref={itemRef}
      style={{
        position: 'relative',
        width: '100%',
        marginBottom: '0.5rem',
        overflow: 'hidden',
        touchAction: 'pan-x'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      {/* Remove background indicator - shows on both sides */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: deleteOpacity,
          zIndex: 1
        }}
      >
        <span style={{ color: 'white', fontWeight: '600', fontSize: '0.875rem' }}>
          Remove
        </span>
      </div>

      {/* Item content */}
      <div
        style={{
          position: 'relative',
          backgroundColor: '#ffffff',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        {/* First line: Quantity, Title, and Purchased date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Always show quantity for all items - with unit if specified, bold and before title */}
          <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '700' }}>
            {item.quantity || 1} {item.quantityUnit ? item.quantityUnit : ''}
          </span>
          <span style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
            {item.name}
          </span>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Purchased
          </span>
          <span style={{ fontSize: '0.875rem', color: '#1f2937', fontWeight: '500' }}>
            {item.addedDate ? formatDate(item.addedDate) : 'No date'}
          </span>
        </div>

        {/* Second line: Expires date and buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {item.isFrozen ? 'Thaws' : 'Expires'}
            </span>
            <span style={{ fontSize: '0.875rem', color: '#1f2937', fontWeight: '500' }}>
              {item.isFrozen && item.thawDate 
                ? formatDate(item.thawDate)
                : item.expirationDate 
                  ? formatDate(item.expirationDate)
                  : 'No date'
              }
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', position: 'relative', zIndex: 10 }}>
            {/* Only show Freeze button for non-dry/canned items that aren't already frozen */}
            {onFreeze && !item.isDryCanned && !item.thawDate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onFreeze();
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  minWidth: '60px',
                  minHeight: '36px'
                }}
                aria-label="Freeze item"
              >
                Freeze
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // Edit button should trigger onClick to navigate to edit page
                if (onClick) {
                  onClick();
                }
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#002B4D',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                minWidth: '60px',
                minHeight: '36px'
              }}
              aria-label="Edit item"
              type="button"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

SwipeableListItem.displayName = 'SwipeableListItem';

export default SwipeableListItem;

