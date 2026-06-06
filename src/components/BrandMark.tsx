/**
 * The Signal Seal — brand mark for the Watermark Stress Test.
 * Detection rings (signal degrading outward), a lime survived-core, and a red
 * attack node. Rings inherit `currentColor`; core/node are fixed brand accents.
 */
export default function BrandMark({
  className = 'w-8 h-8',
  core = '#CBF24C',
}: { className?: string; core?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="20" stroke="currentColor" strokeWidth="5" />
      <circle cx="60" cy="60" r="34" stroke="currentColor" strokeWidth="5" strokeDasharray="34 16" strokeLinecap="round" />
      <circle cx="60" cy="60" r="48" stroke="currentColor" strokeWidth="4" strokeDasharray="10 22" strokeLinecap="round" opacity="0.45" />
      <circle cx="84" cy="36" r="4.5" fill="#FF4A2E" />
      <circle cx="60" cy="60" r="7.5" fill={core} />
    </svg>
  );
}
