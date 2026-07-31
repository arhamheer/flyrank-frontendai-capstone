export default function LoadingState() {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 py-8 text-black/70 dark:text-white/70">
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
      <span>Generating your content brief. This usually takes a few seconds…</span>
    </div>
  );
}
