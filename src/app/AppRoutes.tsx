import { useExperiment } from '../state/ExperimentContext';
import { OverviewPage } from '../pages/OverviewPage';
import { WorkstationPage } from '../pages/WorkstationPage';
import { BeforeAfterPage } from '../pages/BeforeAfterPage';
import { ExplanationPage } from '../pages/ExplanationPage';
import { BreakingPointPage } from '../pages/BreakingPointPage';
import { ResearchPage } from '../pages/ResearchPage';
import { LearningCheckPage } from '../pages/LearningCheckPage';
import type { ReactElement } from 'react';
import type { ViewId } from '../state/experimentReducer';

const PAGES: Record<ViewId, () => ReactElement> = {
  overview: OverviewPage,
  workstation: WorkstationPage,
  'before-after': BeforeAfterPage,
  explanation: ExplanationPage,
  'breaking-point': BreakingPointPage,
  research: ResearchPage,
  'learning-check': LearningCheckPage,
};

export function AppRoutes() {
  const { state } = useExperiment();
  const Page = PAGES[state.activeView] ?? OverviewPage;
  return <Page />;
}
