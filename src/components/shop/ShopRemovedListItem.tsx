/**
 * Shop Removed List Item
 * Crossed-off item with strikethrough; swipe to add back to the list.
 */

import React, { useState, useEffect } from 'react';
import type { ShoppingListItem } from '../../types';
import { colors, spacing } from '../../styles/designTokens';

interface ShopRemovedListItemProps {
  item: ShoppingListItem;
  onAddBack: (item: ShoppingListItem) => void;
}

const SWIPE_THRESHOLD = 100;

export const ShopRemovedListItem: React.FC<ShopRemovedListItemProps> = ({ item, onAddBack }) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    const clampedDiff = Math.max(-SWIPE_THRESHOLD * 2, Math.min(diff, SWIPE_THRESHOLD * 2));
    setTranslateX(clampedDiff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(translateX) >= SWIPE_THRESHOLD) {
      onAddBack(item);
      setTranslateX(0);
      return;
    }
    setTranslateX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const diff = e.clientX - startX;
        const clampedDiff = Math.max(-SWIPE_THRESHOLD * 2, Math.min(diff, SWIPE_THRESHOLD * 2));
        setTranslateX(clampedDiff);
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        if (Math.abs(translateX) >= SWIPE_THRESHOLD) {
          onAddBack(item);
          setTranslateX(0);
          return;
        }
        setTranslateX(0);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, startX, translateX, item, onAddBack]);

  const swipeOpacity = Math.min(Math.abs(translateX) / SWIPE_THRESHOLD, 1);
  const isSwiped = Math.abs(translateX) >= SWIPE_THRESHOLD;
  const isLeftSwipe = translateX < 0;

  const quantity = item.quantity ?? 1;
  const unit = item.quantityUnit ?? '';

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        backgroundColor: colors.white,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
    >
      {translateX !== 0 && (
        <div
          style={{
            position: 'absolute',
            ...(isLeftSwipe ? { right: 0 } : { left: 0 }),
            top: 0,
            bottom: 0,
            width: `${Math.min(Math.abs(translateX), SWIPE_THRESHOLD)}px`,
            backgroundColor: colors.success,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isLeftSwipe ? 'flex-end' : 'flex-start',
            ...(isLeftSwipe ? { paddingRight: spacing.md } : { paddingLeft: spacing.md }),
            color: colors.white,
            fontSize: '0.875rem',
            fontWeight: 500,
            opacity: swipeOpacity,
            transition: isDragging ? 'none' : 'opacity 0.2s'
          }}
        >
          {isSwiped ? 'Add back' : (isLeftSwipe ? '← Swipe' : '→ Swipe')}
        </div>
      )}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{
          padding: `${spacing.xs} ${spacing.md}`,
          border: `1px solid ${colors.gray[200]}`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: colors.white,
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s',
          cursor: 'grab',
          userSelect: 'none'
        }}
      >
        <div
          style={{
            fontSize: '1.25rem',
            fontWeight: 500,
            color: colors.gray[500],
            textDecoration: 'line-through',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}
        >
          <span>{quantity}</span>
          {unit && <span>{unit}</span>}
          <span>{item.name}</span>
        </div>
      </div>
    </div>
  );
};
