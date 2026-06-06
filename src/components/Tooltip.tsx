import React from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Lightweight CSS hover tooltip. Wraps any trigger; shows a styled bubble.
 * Uses a named group so it never collides with other `group` usage on the page.
 */
export function Tooltip({
  label,
  children,
  side = 'top',
  className = '',
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}) {
  return (
    <span className={`relative inline-flex items-center group/tip ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 w-max max-w-[240px] rounded-lg bg-[#0a0d14] border border-white/15 px-2.5 py-1.5 text-[10px] font-sans font-normal normal-case tracking-normal leading-snug text-white/80 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 shadow-xl ${
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
        }`}
      >
        {label}
      </span>
    </span>
  );
}

/** A small "?" info icon with a hover tooltip — for explaining jargon inline. */
export function InfoTip({
  label,
  side = 'top',
  className = 'ml-1',
}: {
  label: React.ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}) {
  return (
    <Tooltip label={label} side={side} className={className}>
      <HelpCircle className="w-3 h-3 text-white/30 hover:text-white/70 cursor-help shrink-0" />
    </Tooltip>
  );
}
