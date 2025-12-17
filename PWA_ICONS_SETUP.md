# PWA Icons Setup

## Current Status
The app is using a temporary SVG icon (`/vite.svg`) for the PWA manifest. To create proper PWA icons:

## Option 1: Use PWA Asset Generator (Recommended)

1. **Install the tool:**
   ```bash
   npm install -g pwa-asset-generator
   ```

2. **Create a source image:**
   - Create a square image (at least 512x512px)
   - Save it as `icon-source.png` in the project root

3. **Generate icons:**
   ```bash
   pwa-asset-generator icon-source.png public/icons --icon-only --favicon
   ```

4. **Uncomment icons in vite.config.ts:**
   - Open `vite.config.ts`
   - Uncomment the icon entries in the `manifest.icons` array

## Option 2: Use Online Tool

1. Go to: https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload your icon (512x512px recommended)
3. Download the generated icons
4. Place them in `public/icons/`:
   - `icon-192.png` (192x192)
   - `icon-512.png` (512x512)
   - `icon-192-maskable.png` (192x192, maskable)
   - `icon-512-maskable.png` (512x512, maskable)

## Option 3: Create Manually

If you have an image editor:

1. Create a square icon (512x512px minimum)
2. Export these sizes:
   - `icon-192.png` - 192x192px
   - `icon-512.png` - 512x512px
   - `icon-192-maskable.png` - 192x192px (with safe zone for maskable)
   - `icon-512-maskable.png` - 512x512px (with safe zone for maskable)

3. Place all files in `public/icons/`

## Maskable Icons

Maskable icons need a "safe zone" - keep important content in the center 80% of the image, as the outer 20% may be masked/cropped on some devices.

## After Creating Icons

1. Uncomment the icon entries in `vite.config.ts`
2. Rebuild: `npm run build`
3. Test the PWA manifest: Check browser DevTools → Application → Manifest

## Temporary Solution

The app currently uses `/vite.svg` as a fallback icon. This works but isn't ideal for production. Create proper icons when ready!

