import { classCategory, propertyCategory, splitClass } from './classes.js';
import type { Declaration } from './analysis.js';
import type { ElementEvidence, Inventory, ObservedValue } from './types.js';

/** Observations support visual decisions; they never approve policy automatically. */
export function collectObserved(
  inventory: Inventory,
  elements: ElementEvidence[],
  declarations: Declaration[],
) {
  const observed = new Map<string, ObservedValue>();
  const tokenNames = new Set(inventory.tokens.map((t) => t.name));
  function add(candidate: ObservedValue) {
    const key = JSON.stringify([
      candidate.category,
      candidate.kind,
      candidate.name,
      candidate.value,
    ]);
    const existing = observed.get(key);
    if (existing) existing.count++;
    else observed.set(key, candidate);
  }
  for (const el of elements)
    for (const className of new Set(el.classes.flat())) {
      const category = classCategory(className, tokenNames);
      if (!category) continue;
      const base = splitClass(className).base;
      let value = base;
      const arbitrary = base.match(/^[\w-]+-\[(.*)\]$/) || base.match(/^\[(.*)\]$/);
      if (arbitrary) value = arbitrary[1].replace(/^[a-zA-Z-]+:/, '').replaceAll('_', ' ');
      else {
        const namespace = base.startsWith('rounded-')
          ? 'radius'
          : category === 'colors'
            ? 'color'
            : base.startsWith('text-')
              ? 'text'
              : base.startsWith('font-')
                ? 'font'
                : undefined;
        const suffix = base.replace(/^[^-]+-/, '');
        const token =
          namespace && inventory.tokens.find((t) => t.name === `--${namespace}-${suffix}`);
        if (token) value = token.value;
      }
      if (base.startsWith('-') && arbitrary) value = '-' + value;
      add({
        category,
        kind: 'class',
        name: className,
        className,
        value,
        file: el.file,
        line: el.line,
        count: 1,
      });
    }
  for (const declaration of declarations) {
    const category = propertyCategory(declaration.property);
    if (!category || declaration.unknown) continue;
    add({
      category,
      kind: 'declaration',
      name: declaration.property,
      property: declaration.property,
      value: declaration.value,
      file: declaration.file,
      line: declaration.line,
      count: 1,
    });
  }
  inventory.candidates = [...observed.values()].sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      a.name.localeCompare(b.name) ||
      a.value.localeCompare(b.value),
  );
  const components = new Map<string, Inventory['components'][number]>();
  for (const el of elements) {
    if (!el.identity && !/^[A-Z]/.test(el.name) && !el.name.includes('.')) continue;
    const key = JSON.stringify([el.identity?.from ?? el.file, el.identity?.name ?? el.name]);
    const existing = components.get(key);
    if (existing) {
      existing.count = (existing.count ?? 0) + 1;
      existing.locations?.push({ file: el.file, line: el.line });
    } else
      components.set(key, {
        name: el.name,
        file: el.file,
        from: el.identity?.from,
        exportName: el.identity?.name,
        count: 1,
        locations: [{ file: el.file, line: el.line }],
      });
  }
  inventory.components = [...components.values()];
}
