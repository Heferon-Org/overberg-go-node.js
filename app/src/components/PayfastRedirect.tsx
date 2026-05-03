"use client";

import { useEffect, useRef } from "react";

interface Props {
  url: string;
  fields: Record<string, string>;
  onSubmitted?: () => void;
}

/**
 * Auto-submitting hidden form that POSTs to PayFast's process URL.
 * PayFast requires a real POST (not a redirect) so signature is preserved.
 */
export function PayfastRedirect({ url, fields, onSubmitted }: Props) {
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.submit();
      onSubmitted?.();
    }
  }, [onSubmitted]);

  return (
    <form ref={ref} action={url} method="post" className="hidden">
      {Object.entries(fields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
    </form>
  );
}
