import { setState } from '@/lib/store';
import { defaultFitnessSettings } from './fitness-engine';

export const EMPTY_TRAINING: Record<string, any> = Object.freeze({});
export function saveTrainingSettings(id: string, patch: Record<string, unknown>, profile: unknown) {
  setState(s => ({ ...s, trainingSettings: { ...s.trainingSettings, [id]: { ...defaultFitnessSettings(profile), ...s.trainingSettings?.[id], ...patch } } }));
}
export function saveTrainingLog(id: string, patch: Record<string, unknown>) {
  setState(s => ({ ...s, trainingLogs: { ...s.trainingLogs, [id]: { ...s.trainingLogs?.[id], ...patch } } }));
}