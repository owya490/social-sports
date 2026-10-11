type EntityRowStatusesProps = {
  labels: string[];
};

export function EntityRowStatuses({ labels }: EntityRowStatusesProps) {
  if (labels.length === 0) return null;

  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <li
          key={label}
          className="rounded-lg bg-surface px-2 py-0.5 text-xs font-medium text-foreground-secondary font-sans"
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
