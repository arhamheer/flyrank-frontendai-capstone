import type { GeneratedBrief } from "@/lib/types";

interface HistoryPanelProps {
  items: GeneratedBrief[];
  activeId?: string;
  onSelect: (entry: GeneratedBrief) => void;
  onClear: () => void;
}

export default function HistoryPanel({ items, activeId, onSelect, onClear }: HistoryPanelProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-black/65 dark:text-white/65">
        Briefs you generate in this browser will appear here.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
          History
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-black/65 dark:text-white/65 hover:text-black dark:hover:text-white underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 rounded"
        >
          Clear
        </button>
      </div>
      <ul className="space-y-1">
        {items.map((entry) => {
          const isActive = entry.id === activeId;
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onSelect(entry)}
                aria-current={isActive ? "true" : undefined}
                className={`w-full text-left rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <span className="block truncate font-medium">{entry.brief.primaryKeyword}</span>
                <span
                  className={`block text-xs ${
                    isActive ? "text-blue-50" : "text-black/65 dark:text-white/65"
                  }`}
                >
                  {new Date(entry.createdAt).toLocaleString()}
                  {entry.source === "fallback" ? " · template" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
