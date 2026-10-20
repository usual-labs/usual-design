import type { CSSProperties } from 'react';
import type { PreviewValues } from '../../src/onboarding-types';
import { safeColor, safeLength } from './model';

/** No project CSS, external fonts, resources, or components enter the reference UI. */
export function previewStyles(values: PreviewValues): {
  style: CSSProperties;
  unavailable: string[];
} {
  const style: Record<string, string> = {};
  const unavailable: string[] = [];
  for (const [slot, value] of Object.entries(values)) {
    let safe: string | null = null;
    if (['primary', 'onPrimary', 'surface', 'onSurface', 'muted', 'border', 'focus'].includes(slot))
      safe = safeColor(value);
    else if (slot === 'fontFamily')
      safe = ['system-ui', 'sans-serif', 'serif', 'monospace'].includes(value) ? value : null;
    else if (slot === 'lineHeight')
      safe = /^(?:1(?:\.\d{1,2})?|2(?:\.0{1,2})?)$/.test(value) ? value : null;
    else safe = safeLength(value, slot === 'headingSize' ? 64 : 48);
    if (safe !== null) style[`--sample-${slot}`] = safe;
    else unavailable.push(`${slot}: ${value}`);
  }
  return { style: style as CSSProperties, unavailable };
}
