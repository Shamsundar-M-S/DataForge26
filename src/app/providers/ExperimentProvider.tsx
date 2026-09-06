import { useMemo, useReducer, type ReactNode } from 'react';
import type { PredictionChoice } from '../../domain/models/types';
import {
  createInitialState,
  experimentReducer,
  type ViewId,
} from '../../state/experimentReducer';
import { deriveExperiment } from '../../state/selectors';
import {
  ExperimentContext,
  type ExperimentActions,
  type ExperimentContextValue,
} from '../../state/ExperimentContext';

interface Props {
  readonly children: ReactNode;
}

/**
 * The single source of truth. Every component reads from here; none of them
 * keeps its own copy of a capacity, a demand, or a route.
 */
export function ExperimentProvider({ children }: Props) {
  const [state, dispatch] = useReducer(experimentReducer, undefined, createInitialState);

  const derived = useMemo(() => deriveExperiment(state), [state]);

  const actions = useMemo<ExperimentActions>(
    () => ({
      setVehicleCapacity: (vehicleId: string, capacity: number) =>
        dispatch({ type: 'SET_VEHICLE_CAPACITY', vehicleId, capacity }),
      setCustomerDemand: (customerId: string, demand: number) =>
        dispatch({ type: 'SET_CUSTOMER_DEMAND', customerId, demand }),
      applyScenario: (scenarioId: string) =>
        dispatch({ type: 'APPLY_SCENARIO', scenarioId }),
      recalculate: () => dispatch({ type: 'RECALCULATE' }),
      discardDraft: () => dispatch({ type: 'DISCARD_DRAFT' }),
      submitPrediction: (choice: PredictionChoice) =>
        dispatch({ type: 'SUBMIT_PREDICTION', choice }),
      clearPrediction: () => dispatch({ type: 'CLEAR_PREDICTION' }),
      reset: () => dispatch({ type: 'RESET' }),
      selectCustomer: (customerId: string | null) =>
        dispatch({ type: 'SELECT_CUSTOMER', customerId }),
      setView: (view: ViewId) => dispatch({ type: 'SET_VIEW', view }),
    }),
    [],
  );

  const value = useMemo<ExperimentContextValue>(
    () => ({ state, derived, actions }),
    [state, derived, actions],
  );

  return (
    <ExperimentContext.Provider value={value}>{children}</ExperimentContext.Provider>
  );
}
