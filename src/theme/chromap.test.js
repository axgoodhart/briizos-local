import { describe, expect, it } from 'vitest';
import {
  alignOklchToAnchor, contrastRatio, createSeededRandom, generateTheme,
  gamutSafeOklch, hexToOklch, oklabToSrgb, oklchToOklab, srgbToOklab,
} from './chromap';

describe('Chromap color engine', () => {
  it('round-trips sRGB through OKLab within display precision', () => {
    const source = { r: 0.19, g: 0.63, b: 0.44, alpha: 0.42 };
    const result = oklabToSrgb(srgbToOklab(source));
    expect(result.r).toBeCloseTo(source.r, 5);
    expect(result.g).toBeCloseTo(source.g, 5);
    expect(result.b).toBeCloseTo(source.b, 5);
    expect(result.alpha).toBe(source.alpha);
  });

  it('reduces chroma until an OKLCH color is in gamut', () => {
    const result = gamutSafeOklch({ L: 0.72, C: 0.62, h: 152 });
    expect(result.r).toBeGreaterThanOrEqual(0);
    expect(result.r).toBeLessThanOrEqual(1);
    expect(result.g).toBeGreaterThanOrEqual(0);
    expect(result.g).toBeLessThanOrEqual(1);
    expect(result.b).toBeGreaterThanOrEqual(0);
    expect(result.b).toBeLessThanOrEqual(1);
  });

  it('aligns hue and chroma while preserving ordering, lightness, and alpha', () => {
    const colors = [
      { L: 0.2, C: 0.05, h: 25, alpha: 0.25 },
      { L: 0.5, C: 0.1, h: 45, alpha: 0.5 },
      { L: 0.8, C: 0.15, h: 65, alpha: 0.75 },
    ];
    const aligned = alignOklchToAnchor(colors, hexToOklch('#3cae87'));
    expect(aligned.map((color) => color.L)).toEqual(colors.map((color) => color.L));
    expect(aligned.map((color) => color.alpha)).toEqual(colors.map((color) => color.alpha));
    expect(aligned[0].L).toBeLessThan(aligned[1].L);
    expect(aligned[1].L).toBeLessThan(aligned[2].L);
  });

  it('uses deterministic random and generator output for the same settings', () => {
    const a = createSeededRandom(8675309);
    const b = createSeededRandom(8675309);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    const settings = { seed: 4201, primaryAnchor: '#c87b52', harmony: 'triadic', mode: 'dark', material: 'layered' };
    expect(generateTheme(settings)).toEqual(generateTheme(settings));
  });

  it('generates accessible primary text against the canvas', () => {
    const generated = generateTheme({ seed: 22, mode: 'light', saturation: 96, contrast: 20 });
    expect(contrastRatio(generated.globals.textPrimary, generated.globals.canvas)).toBeGreaterThanOrEqual(4.5);
    expect(oklchToOklab(hexToOklch(generated.globals.primary))).toBeTruthy();
  });
});
