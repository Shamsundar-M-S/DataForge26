import { ExperimentProvider } from './providers/ExperimentProvider';
import { AppRoutes } from './AppRoutes';
import { Header } from '../components/layout/Header';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';

export default function App() {
  return (
    <ExperimentProvider>
      <div className="min-h-screen flex flex-col bg-[#f8f9fa] text-[#1a1c1e]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:bg-gray-900 focus:text-white focus:rounded font-mono text-xs"
        >
          Skip to content
        </a>
        <Header />
        <Navigation />
        <main id="main" className="flex-1 px-4 sm:px-8">
          <AppRoutes />
        </main>
        <Footer />
      </div>
    </ExperimentProvider>
  );
}
