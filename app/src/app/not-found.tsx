import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-8">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">🌊</div>
        <h1 className="font-heading font-black text-2xl mb-2">Page not found</h1>
        <p className="text-sm text-t2 mb-6 leading-relaxed">
          Looks like this page drifted out to sea. Let&apos;s get you back to shore.
        </p>
        <Link
          href="/"
          className="inline-block bg-primary text-white font-heading font-bold text-sm px-6 py-3 rounded-2xl active:scale-[0.98] transition-transform"
        >
          Back to Home
        </Link>
        <div className="mt-8 text-[11px] text-t3 font-heading">
          OverBerg Go · Cape Agulhas
        </div>
      </div>
    </div>
  );
}
