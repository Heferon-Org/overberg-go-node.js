"use client";

export function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-[7px] rounded-full text-xs font-heading font-semibold whitespace-nowrap transition-all border-[1.5px] shrink-0 ${
        active
          ? "bg-primary border-primary text-white"
          : "bg-dark3 border-bd2 text-t2"
      }`}
    >
      {children}
    </button>
  );
}
