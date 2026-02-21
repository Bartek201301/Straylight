# OpenDyslexic Fonts Setup

## Required Font Files

To enable dyslexic-friendly typography, you need to download and place the following OpenDyslexic font files in this directory:

### Required Files:

- `OpenDyslexic-Regular.woff2`
- `OpenDyslexic-Bold.woff2`
- `OpenDyslexic-Italic.woff2`

### Download Instructions:

1. **Official Source**: Visit [OpenDyslexic.org](https://opendyslexic.org/)
2. **Download the font package** (free for personal and commercial use)
3. **Convert to WOFF2** format for optimal web performance
4. **Place the files** in this `src/fonts/` directory

### Alternative Sources:

- [Google Fonts](https://fonts.google.com/specimen/OpenDyslexic) (if available)
- [GitHub Repository](https://github.com/antijingoist/open-dyslexic) (source files)

### Font Conversion:

If you only have TTF/OTF files, convert them to WOFF2 using:

- [CloudConvert](https://cloudconvert.com/ttf-to-woff2)
- [Font Squirrel Webfont Generator](https://www.fontsquirrel.com/tools/webfont-generator)

### File Structure:

```
src/fonts/
├── OpenDyslexic-Regular.woff2
├── OpenDyslexic-Bold.woff2
├── OpenDyslexic-Italic.woff2
└── README.md (this file)
```

### Usage:

Once the font files are in place, users can switch to dyslexic-friendly fonts using:

- **CSS Class**: `font-dyslexic`
- **Component**: `<FontToggle />` component
- **Utility**: Toggle button in the UI

### Fallback:

If font files are missing, the system will gracefully fallback to Arial and system sans-serif fonts.
