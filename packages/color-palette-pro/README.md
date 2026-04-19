# Color Palette Pro

Mathematical color palette generation logic relying heavily on OKLCH capabilities provided by `colorjs.io`.

## Overview
This library provides programmatic color palette generation functions—analogous, triadic, tetradic, complementary, split complementary, and complex tints & shades manipulations. It relies on mathematically precise adjustments within the strictly perceptual OKLCH color space, circumventing the commonly known "muddy" or desaturated zones created by basic HSL interpolations.

## Usage

```typescript
import { createPalettes, generateAnalogous } from 'color-palette-pro';

// Unified orchestration
const palettes = createPalettes('#3498db', 'ana', 'square', { space: 'oklch', format: 'hex' });

// Or access internal harmonic generators individually
const baseAnalogous = generateAnalogous('#3498db', { style: 'square', colorSpace: { space: 'oklch', format: 'hex' } });
```
