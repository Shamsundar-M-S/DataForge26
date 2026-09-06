import { useState } from 'react';
import { Check, X, Info } from 'lucide-react';

interface CellState {
  val: number | null;
  fixed: boolean;
}

/** Initial 4x4 Mini Sudoku Grid for educational constraint demonstration */
const INITIAL_GRID: CellState[][] = [
  [{ val: 1, fixed: true }, { val: 2, fixed: true }, { val: 3, fixed: true }, { val: 4, fixed: true }],
  [{ val: 3, fixed: true }, { val: 4, fixed: true }, { val: 1, fixed: true }, { val: 2, fixed: true }],
  [{ val: 2, fixed: true }, { val: 1, fixed: true }, { val: 4, fixed: true }, { val: 3, fixed: true }],
  [{ val: 4, fixed: true }, { val: 3, fixed: true }, { val: null, fixed: false }, { val: 1, fixed: false }],
];

export function validateSudokuCandidate(testVal: number | null): {
  rowValid: boolean;
  colValid: boolean;
  boxValid: boolean;
  isValid: boolean;
} {
  if (testVal === null) {
    return { rowValid: false, colValid: false, boxValid: false, isValid: false };
  }
  const rowHasConflict = testVal === 4 || testVal === 3 || testVal === 1;
  const colHasConflict = testVal === 3 || testVal === 1 || testVal === 4;
  const boxHasConflict = testVal === 4 || testVal === 3 || testVal === 1;

  const rowValid = !rowHasConflict;
  const colValid = !colHasConflict;
  const boxValid = !boxHasConflict;

  return {
    rowValid,
    colValid,
    boxValid,
    isValid: rowValid && colValid && boxValid,
  };
}

/**
 * Educational Sudoku Micro-Demo.
 * Demonstrates local constraint satisfaction / violation in a 4x4 Sudoku grid.
 * Explicitly disclaimed as NOT BDH.
 */
export function SudokuMicroDemo() {
  const [cellValue, setCellValue] = useState<number | null>(4);

  const { rowValid, colValid, boxValid } = validateSudokuCandidate(cellValue);

  return (
    <div className="rounded-lg border border-slate-300 bg-white p-5 space-y-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
        <div>
          <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
            EDUCATIONAL CONSTRAINT DEMO · NOT BDH · Built by ConstraintRoute
          </span>
          <h3 className="text-base font-serif font-semibold text-gray-900 mt-1">
            Interactive Sudoku Constraint Micro-Demo
          </h3>
        </div>
        <p className="text-xs font-mono text-gray-500">4×4 Mini Grid</p>
      </div>

      <p className="text-xs text-gray-700 leading-relaxed">
        Select a candidate value for the open cell <strong>[Row 4, Col 3]</strong> below. Watch how a single choice is checked against multiple simultaneous constraints.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* 4x4 Grid representation */}
        <div className="md:col-span-5 flex justify-center">
          <div className="grid grid-cols-4 gap-1 p-2 bg-slate-900 rounded-lg shadow-md">
            {INITIAL_GRID.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const isActiveTarget = rIdx === 3 && cIdx === 2;
                const displayVal = isActiveTarget ? (cellValue ?? '?') : cell.val;

                const borderRight = cIdx === 1 ? 'border-r-2 border-r-amber-500' : '';
                const borderBottom = rIdx === 1 ? 'border-b-2 border-b-amber-500' : '';

                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className={`w-10 h-10 flex items-center justify-center font-mono text-sm font-bold rounded ${
                      isActiveTarget
                        ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 ring-offset-1 ring-offset-slate-900'
                        : cell.fixed
                          ? 'bg-slate-800 text-slate-200'
                          : 'bg-slate-700 text-slate-100'
                    } ${borderRight} ${borderBottom}`}
                  >
                    {displayVal}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {/* Controls & Constraint Feedback */}
        <div className="md:col-span-7 space-y-4 font-mono text-xs">
          <div>
            <label className="block text-gray-900 font-semibold mb-1.5">
              Select candidate for [Row 4, Col 3]:
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCellValue(num)}
                  className={`w-10 h-9 rounded font-bold text-xs border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 ${
                    cellValue === num
                      ? 'bg-slate-900 text-amber-400 border-slate-900'
                      : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
            <p className="font-semibold text-gray-900 text-[11px]">
              Constraint Verification (Candidate: {cellValue ?? 'None'}):
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div
                className={`p-2 rounded border ${
                  rowValid
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-rose-300 bg-rose-50 text-rose-900 font-bold'
                }`}
              >
                <div className="flex justify-center mb-0.5">
                  {rowValid ? (
                    <Check className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  ) : (
                    <X className="w-4 h-4 text-rose-700" aria-hidden="true" />
                  )}
                </div>
                <span>ROW {rowValid ? '✓' : '✕'}</span>
              </div>

              <div
                className={`p-2 rounded border ${
                  colValid
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-rose-300 bg-rose-50 text-rose-900 font-bold'
                }`}
              >
                <div className="flex justify-center mb-0.5">
                  {colValid ? (
                    <Check className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  ) : (
                    <X className="w-4 h-4 text-rose-700" aria-hidden="true" />
                  )}
                </div>
                <span>COLUMN {colValid ? '✓' : '✕'}</span>
              </div>

              <div
                className={`p-2 rounded border ${
                  boxValid
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-rose-300 bg-rose-50 text-rose-900 font-bold'
                }`}
              >
                <div className="flex justify-center mb-0.5">
                  {boxValid ? (
                    <Check className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  ) : (
                    <X className="w-4 h-4 text-rose-700" aria-hidden="true" />
                  )}
                </div>
                <span>BOX {boxValid ? '✓' : '✕'}</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-700 leading-snug pt-1">
              {cellValue === 2 ? (
                <span className="text-emerald-800 font-semibold">
                  Local choice 2 satisfies Row, Column, and Box constraints simultaneously!
                </span>
              ) : (
                <span className="text-rose-800 font-semibold">
                  Local choice {cellValue} creates a global constraint conflict with existing row/column entries.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-[11px] font-mono text-gray-500 bg-slate-50 border border-slate-200 rounded p-2.5">
        <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          <strong>Teaching Note:</strong> This mini-demo illustrates the core logic of constraint satisfaction: a locally plausible choice (e.g. putting a 4) causes global conflicts across interacting row/col/box rules. BDH models evaluate these interactions in high-dimensional latent space.
        </p>
      </div>
    </div>
  );
}
