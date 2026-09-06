import type { ViewId } from '../state/experimentReducer';

export interface NavItem {
  readonly id: ViewId;
  readonly label: string;
  /** The stage of the learning journey this view carries. */
  readonly stage: string;
}

/**
 * Seven views, one per stage of the journey. Each one exists because a stage
 * needs it; there is no view here that is only decorative.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'overview', label: 'Overview', stage: 'The claim' },
  { id: 'workstation', label: 'Workstation', stage: 'Experiment' },
  { id: 'before-after', label: 'Before / after', stage: 'Verify' },
  { id: 'explanation', label: 'Why it changed', stage: 'Explain' },
  { id: 'breaking-point', label: 'Breaking point', stage: 'Break it' },
  { id: 'research', label: 'BDH & research', stage: 'Connect' },
  { id: 'learning-check', label: 'Learning check', stage: 'Check' },
];
