# Blog Images Setup Instructions

## Required Image Files

Place these 3 image files in the `public/assets/` folder:

1. **`ai-blog.webp`** (or `.jpg` or `.png`)
   - For: "How AI is Revolutionizing Custom Software Development"
   - Location: `public/assets/ai-blog.webp`

2. **`mvp-blog.webp`** (or `.jpg` or `.png`)
   - For: "Why Your Business Needs an MVP First"
   - Location: `public/assets/mvp-blog.webp`

3. **`hidden-cost-blog.webp`** (or `.jpg` or `.png`)
   - For: "The Hidden Costs of Offshore Development"
   - Location: `public/assets/hidden-cost-blog.webp`

## File Format Support

The system will automatically try these formats in order:
1. `.webp` (preferred)
2. `.jpg` (fallback)
3. `.png` (fallback)

If none are found, a gradient fallback will be displayed.

## Image Specifications

- **Recommended dimensions:** 1920x1080px (16:9 ratio)
- **File size:** Under 200KB for optimal performance
- **Format:** WebP preferred, but JPG/PNG also work

## Current File Structure

```
public/
  assets/
    ai-blog.webp          ← Add this file
    mvp-blog.webp         ← Add this file
    hidden-cost-blog.webp ← Add this file
```

## After Adding Files

Once you add the image files to `public/assets/`, they will automatically display on:
- Blog listing page (`/blog`)
- Individual blog post pages (`/blog/[slug]`)

The images will automatically fit within their frames and scale responsively.

