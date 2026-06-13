export function KxMark({ size = 36 }: { size?: number }) {
  return (
    <span
      className="grid place-items-center shadow-stamp"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "linear-gradient(135deg, #003ACE 0%, #316BFF 100%)",
        boxShadow: "0 4px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18)",
      }}
      aria-hidden="true"
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 18 18" fill="none">
        <path d="M3 2.5L3 15.5M3 9.5L9.5 3.5M3 9.5L10.5 15.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 6L15.5 9.5L12 13" stroke="#8FAFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
