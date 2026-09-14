export const comparators = ['<', '>', '<=', '>=', '==', '!='] as const;

export type Comparator = (typeof comparators)[number];
