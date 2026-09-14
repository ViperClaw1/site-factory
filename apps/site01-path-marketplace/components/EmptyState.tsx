export interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-black/50">
      <i className="fa-solid fa-box-open text-3xl text-black/20" aria-hidden="true" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
