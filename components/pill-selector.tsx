interface PillSelectorProps {
  label: string;
  options: readonly string[];
  selected: string;
  onChange: (value: string) => void;
}

export function PillSelector({
  label,
  options,
  selected,
  onChange,
}: PillSelectorProps) {
  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = selected === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`border px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
