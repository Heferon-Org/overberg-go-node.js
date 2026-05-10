"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">😔</p>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-6">
            We&apos;ve been notified and are looking into it.
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#1E9E5A] text-white rounded-xl font-semibold"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
