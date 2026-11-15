type A = any;
export function isMinor(p: A): boolean; export function bmi(p: A): A; export function adultBmiLabel(p: A): A; export function canUseAdultBmi(p: A): boolean;
export function targetsFor(p: A, l?: string): A; export function referenceValues(p: A): A; export function saltGrams(n: number): number;
export function nutritionBadges(r: A): { id: string; label: string; tone: string }[]; export function scaledIngredients(r: A, p: A, l?: string, portion?: number): { ing: A; food: A; g: number }[];
export function mealMacros(r: A, p: A, l?: string, portion?: number): A; export function dayMacros(d: A, p: A, l?: string, log?: A, byId?: (id: string) => A): A;
export function rotationEnergy(p: A, l: string, plan: A[], byId: (id: string) => A): number; export function plateScale(p: A, kcal: number, l?: string): number;
export function planCoverage(p: A, l: string, totals: A, targets: A, pool?: A[]): A; export function weightTrend(m: A[]): A;
export function buildShoppingList(o: A): A[]; export function contextualGuidance(o: A): string[]; export function kcalFromMacros(m: A): number;
export function portionProfile(p: A, l?: string): A;
