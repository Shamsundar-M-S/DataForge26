export function Footer() {
  return (
    <footer className="border-t border-gray-300 bg-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 text-xs text-gray-600 space-y-1.5">
        <p className="font-mono text-gray-800">
          ConstraintRoute — an interactive explainer for reasoning under complex
          constraints.
        </p>
        <p className="max-w-prose leading-relaxed">
          The routing solver runs in this browser tab and is exact for the six-customer
          instance shown. It is not BDH, and no language model is involved anywhere in
          the experiment or its explanations. The routing data is invented for teaching.
        </p>
      </div>
    </footer>
  );
}
