/** Fixed bottom-right status banner for save confirmations. */
export function TransientBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-24 right-4 z-[var(--z-overlay)] rounded-[var(--radius-md)] border border-[var(--accent-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm font-medium text-[var(--text-heading)] shadow-[var(--shadow-md)]"
    >
      {message}
    </div>
  );
}
