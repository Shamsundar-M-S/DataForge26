import type { VRPProblem, VRPSolution } from '../models/types';
import { solveVrpExactly } from './exactVrpSolver';

/**
 * The seam between the application and whatever solves the problem.
 *
 * The UI and the state layer only ever call `solveVrp`. Swapping the in-browser
 * exact solver for an HTTP call to a backend (OR-Tools, say) means providing a
 * different `VrpSolver` here; nothing above this line changes.
 */
export interface VrpSolver {
  readonly name: string;
  solve(problem: VRPProblem): VRPSolution;
}

export const exactSolver: VrpSolver = {
  name: 'In-browser exact enumeration',
  solve: solveVrpExactly,
};

let activeSolver: VrpSolver = exactSolver;

export function setSolver(solver: VrpSolver): void {
  activeSolver = solver;
}

export function getSolver(): VrpSolver {
  return activeSolver;
}

export function solveVrp(problem: VRPProblem): VRPSolution {
  return activeSolver.solve(problem);
}

export { solveVrpExactly };
export * from './distance';
