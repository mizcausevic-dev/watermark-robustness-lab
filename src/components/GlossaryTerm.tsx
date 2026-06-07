import React from 'react';
import { GLOSSARY_BY_ID } from '../data/glossary';

/**
 * Inline glossary term: a dotted-underlined word that reveals its definition on
 * hover OR keyboard focus. Pulls copy from the single glossary source of truth,
 * so the tooltip and the Glossary reference section never drift apart.
 *
 *   <GlossaryTerm id="psnr">PSNR</GlossaryTerm>
 *   <GlossaryTerm id="c2pa" />            // falls back to the canonical term name
 *
 * If `id` is unknown it renders children as plain text (fail-safe, never throws).
 */
export function GlossaryTerm({
  id,
  children,
  side = 'top',
}: {
  id: string;
  children?: React.ReactNode;
  side?: 'top' | 'bottom';
}) {
  const entry = GLOSSARY_BY_ID[id];
  if (!entry) return <>{children}</>;

  return (
    <span className="relative inline group/gl">
      <span
        tabIndex={0}
        role="button"
        aria-label={`Definition of ${entry.term}: ${entry.short}`}
        className="underline decoration-dotted decoration-cyan-400/45 underline-offset-[3px] cursor-help text-inherit transition-colors hover:decoration-cyan-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/60 rounded-[3px]"
      >
        {children ?? entry.term}
      </span>
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-0 z-50 w-max max-w-[270px] rounded-lg bg-[#0a0d14] border border-white/15 px-3 py-2 text-[11px] font-sans font-normal normal-case tracking-normal leading-snug text-white/75 opacity-0 translate-y-1 shadow-xl transition-all duration-150 group-hover/gl:opacity-100 group-hover/gl:translate-y-0 group-focus-within/gl:opacity-100 group-focus-within/gl:translate-y-0 ${
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
        }`}
      >
        <span className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-cyan-300">
          {entry.term}
          {entry.aka && <span className="text-white/35 normal-case"> · {entry.aka}</span>}
        </span>
        {entry.short}
      </span>
    </span>
  );
}

export default GlossaryTerm;
