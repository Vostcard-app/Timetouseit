## Changes Required

### File: `src/pages/FavoriteRecipes.tsx`

**Update button styling (lines 171-219):**
Replace the current icon button styling with the same button styling used on the shop page.

**Current styling:**
- Transparent background (`background: 'none'`)
- Dark blue icons (`color: '#002B4D'`)
- Icon button style (32x32px, minimal padding)
- Hover adds light gray background

**Target styling (shop page):**
- Dark blue background (`backgroundColor: '#002B4D'`)
- White icons (`color: 'white'`)
- Button padding (`padding: '0.5rem 1rem'`)
- Border radius (`borderRadius: '6px'`)
- Flex layout with gap for icons (`display: 'flex', alignItems: 'center', gap: '0.5rem'`)

## Implementation

Replace the button style object and remove hover handlers:

**Current button style (lines 180-196):**
```typescript
style={{
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#002B4D',
  fontSize: '1.25rem',
  lineHeight: 1,
  width: '32px',
  height: '32px',
  borderRadius: '4px',
  transition: 'background-color 0.2s',
  flexShrink: 0
}}
```

**Updated button style:**
```typescript
style={{
  backgroundColor: '#002B4D',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  padding: '0.5rem 1rem',
  fontSize: '1rem',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  transition: 'all 0.2s'
}}
```

**Remove:**
- `onMouseEnter` handler (lines 197-199)
- `onMouseLeave` handler (lines 200-202)
- Fixed `width` and `height` constraints
- `flexShrink: 0`

## Notes

- The button will have a dark blue background with white icons, matching the shop page
- The icons (+ and calendar) will be white instead of dark blue
- The button will have proper padding and rounded corners
- The button will automatically size based on content
