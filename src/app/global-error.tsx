"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center font-sans text-slate-900">
        <div className="flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle className="size-7" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="max-w-sm text-sm text-slate-500">
            An unexpected error occurred. Try again, and if the problem
            persists, refresh the page.
          </p>
        </div>
        <button
          onClick={reset}
          className="mt-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
