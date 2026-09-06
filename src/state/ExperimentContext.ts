import { createContext, useContext } from 'react';
import type { PredictionChoice } from '../domain/models/types';
import type { ExperimentState, ViewId } from './experimentReducer';
import type { DerivedExperiment } from './selectors';

export interface ExperimentActions {
  setVehicleCapacity: (vehicleId: string, capacity: number) => void;
  setCustomerDemand: (customerId: string, demand: number) => void;
  applyScenario: (scenarioId: string) => void;
  recalculate: () => void;
  discardDraft: () => void;
  submitPrediction: (choice: PredictionChoice) => void;
  clearPrediction: () => void;
  reset: () => void;
  selectCustomer: (customerId: string | null) => void;
  setView: (view: ViewId) => void;
}

export interface ExperimentContextValue {
  readonly state: ExperimentState;
  readonly derived: DerivedExperiment;
  readonly actions: ExperimentActions;
}

export const ExperimentContext = createContext<ExperimentContextValue | null>(null);

export function useExperiment(): ExperimentContextValue {
  const value = useContext(ExperimentContext);
  if (!value) {
    throw new Error('useExperiment must be used inside <ExperimentProvider>.');
  }
  return value;
}
