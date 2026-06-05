interface TaskInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
}

export function TaskInput({ value, onChange, onSubmit }: TaskInputProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="w-full relative flex items-center group"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add a new task..."
        className="w-full bg-background-main md:bg-background-surface border border-border-subtle rounded-xl md:rounded-2xl py-3 md:py-4 pl-4 md:pl-6 pr-20 md:pr-24 text-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-primary/50 transition-all text-sm md:text-base"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="absolute right-2 md:right-2 bg-accent-primary text-white font-medium py-1.5 md:py-2 px-4 md:px-6 rounded-lg md:rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-2 text-sm md:text-base"
      >
        Add
      </button>
    </form>
  );
}
