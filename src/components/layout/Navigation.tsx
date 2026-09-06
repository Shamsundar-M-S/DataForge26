import { NAV_ITEMS } from '../../app/navigation';
import { useExperiment } from '../../state/ExperimentContext';

export function Navigation() {
  const { state, actions } = useExperiment();

  return (
    <nav aria-label="Stages" className="border-b border-gray-300 bg-[#f8f9fa]">
      <ul className="max-w-7xl mx-auto px-4 sm:px-8 flex items-stretch gap-1 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const active = state.activeView === item.id;
          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => actions.setView(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`px-3.5 py-3 text-left border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900 ${
                  active
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="block text-xs font-mono font-semibold">
                  {item.label}
                </span>
                <span className="block text-[10px] text-gray-500">{item.stage}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
