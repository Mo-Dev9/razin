export function LoadingSpinner({ text = 'جاري التحميل...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 rounded-full border-[3px] border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin"></div>
      <p className="text-sm text-[var(--color-text-secondary)]">{text}</p>
    </div>
  );
}
