export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-3xl font-bold text-pub-cream">You&apos;re offline</h1>
      <p className="max-w-sm text-pub-muted">
        Looks like there&apos;s no connection right now. Reconnect and try again — anything you&apos;ve
        already visited should still work.
      </p>
    </main>
  );
}
