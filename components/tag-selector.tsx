interface TagSelectorProps {
  label?: string;
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function TagSelector({
  label,
  options,
  selected,
  onChange,
}: TagSelectorProps) {
  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  return (
    <div>
      {label ? (
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted">
          {label}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {options.map((tag) => {
          const isActive = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={`border px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
