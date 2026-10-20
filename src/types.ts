export const categories = ['colors', 'typography', 'spacing', 'shape', 'components'] as const;
export type Category = (typeof categories)[number];
export type StyleCategory = Exclude<Category, 'components'>;
export type Props = Record<string, string | boolean>;
export interface Target {
  element?: string;
  component?: { name: string; from: string };
  props?: Props;
  classes?: string[];
}
/** Zero-based UTF-16 offsets. The end is exclusive, matching JavaScript string.slice. */
export interface SourceSpan {
  start: number;
  end: number;
}
export interface SourceContext extends SourceSpan {
  text: string;
  truncated: boolean;
}
export interface SemanticRule {
  id: string;
  target: Target;
  requireClasses?: string[];
  forbidClasses?: string[];
  requireProps?: Props;
  ignore?: string[];
}
export interface ComponentRule {
  id: string;
  element: string;
  replacement: { name: string; from: string };
  ignore?: string[];
}
export interface Manifest {
  version: 1;
  include: string[];
  ignore?: string[];
  active: Category[];
  tokens?: string[];
  allowed?: Partial<
    Record<StyleCategory, { classes?: string[]; variables?: string[]; values?: string[] }>
  >;
  semantics?: SemanticRule[];
  components?: ComponentRule[];
  imports?: {
    id: string;
    from: string;
    names?: string[];
    replacement?: { name: string; from: string };
    ignore?: string[];
  }[];
  exceptions?: { ruleId: string; file: string; reason: string }[];
  preview?: string;
}
export interface Finding {
  id: string;
  ruleId: string;
  category: Category | 'coverage';
  affectedCategories?: Category[];
  file: string;
  line: number;
  column: number;
  message: string;
  expected?: string;
  actual?: string;
  kind: 'violation' | 'coverage' | 'decision';
  span?: SourceSpan;
  context?: SourceContext;
}
export interface Token {
  name: string;
  value: string;
  file: string;
  line: number;
}
export interface ObservedValue {
  category: StyleCategory;
  kind: 'class' | 'declaration';
  name: string;
  value: string;
  file: string;
  line: number;
  count: number;
  className?: string;
  property?: string;
}
export interface Inventory {
  files: string[];
  tokens: Token[];
  components: {
    name: string;
    file: string;
    from?: string;
    exportName?: string;
    count?: number;
    locations?: { file: string; line: number }[];
  }[];
  candidates?: ObservedValue[];
  excluded?: { path: string; reason: 'standard' | 'configured' | 'outside-include' }[];
  warnings: string[];
  tailwindVersion?: string;
}
export interface AuditResult {
  version: 1;
  mode: 'audit' | 'check';
  snapshot: string;
  manifestHash: string;
  policyHash?: string;
  findings: Finding[];
  active: Category[];
  inactive: Category[];
  files: string[];
  errors: string[];
  coverage?: {
    include: string[];
    ignore: string[];
    exceptionsUsed: { ruleId: string; file: string; reason: string }[];
    exceptionsUnused?: { ruleId: string; file: string; reason: string }[];
  };
  inventory: Inventory;
}
export interface ElementEvidence {
  name: string;
  identity?: { name: string; from: string };
  identityBlocked?: boolean;
  props: Props;
  classes: string[][];
  classesUnknown?: boolean;
  unknown: boolean;
  unknownProps: string[];
  unknownCategories: Category[];
  file: string;
  line: number;
  column: number;
  span?: SourceSpan;
}
