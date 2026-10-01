interface SegmentedProps<T extends string | number> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function Segmented<T extends string | number>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="py-2">
      <span className="mb-2 block font-semibold">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            onClick={() => onChange(o.value)}
            className={`min-h-11 rounded-xl px-4 font-bold transition-colors ${
              o.value === value
                ? 'bg-accent text-white'
                : 'bg-[color-mix(in_oklab,var(--ink)_8%,transparent)] text-ink hover:bg-[color-mix(in_oklab,var(--ink)_14%,transparent)]'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
