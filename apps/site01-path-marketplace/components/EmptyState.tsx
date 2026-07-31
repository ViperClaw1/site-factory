export interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center text-black/50">
      <p className="text-sm">{message}</p>
    </div>
  );
}
