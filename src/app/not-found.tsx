export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center">
      <div className="mx-auto max-w-app p-6 text-center">
        <h1 className="text-6xl font-extrabold text-primary">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We couldn&rsquo;t find the page you were looking for.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          If you entered a URL, please check it and try again.
        </p>
      </div>
    </main>
  );
}
