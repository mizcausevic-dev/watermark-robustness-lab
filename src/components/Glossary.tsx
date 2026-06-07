import { useMemo, useState } from 'react';
import { BookMarked, Search } from 'lucide-react';
import { GLOSSARY, GLOSSARY_GROUPS, GlossaryGroup } from '../data/glossary';

/**
 * Full glossary reference, rendered in the Briefing tab. Searchable and grouped.
 * Shares the single glossary source of truth with the inline <GlossaryTerm>
 * tooltips, so a definition is written once and surfaces in both places.
 */
export default function Glossary() {
  const [q, setQ] = useState('');

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const match = (s?: string) => !!s && s.toLowerCase().includes(needle);
    const filtered = needle
      ? GLOSSARY.filter((e) => match(e.term) || match(e.aka) || match(e.short) || match(e.long))
      : GLOSSARY;
    return GLOSSARY_GROUPS.map((g) => ({
      group: g as GlossaryGroup,
      entries: filtered.filter((e) => e.group === g),
    })).filter((b) => b.entries.length > 0);
  }, [q]);

  const total = groups.reduce((n, b) => n + b.entries.length, 0);

  return (
    <section
      id="glossary"
      aria-label="Glossary of terms"
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-xl scroll-mt-24"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">
            <BookMarked className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-bold text-white/95 leading-tight">Glossary</h3>
            <p className="text-[11px] text-white/45">
              Hover any <span className="underline decoration-dotted decoration-cyan-400/50 underline-offset-2">dotted term</span> in the labs to see these inline.
            </p>
          </div>
        </div>

        <label className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-white/35 pointer-events-none" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search terms…"
            aria-label="Search glossary terms"
            className="w-full sm:w-60 bg-black/40 border border-white/10 focus:border-cyan-500/40 rounded-lg pl-9 pr-3 py-2 text-xs text-white/80 placeholder:text-white/30 outline-none transition"
          />
        </label>
      </div>

      {total === 0 ? (
        <p className="text-xs text-white/40 py-6 text-center">
          No terms match “{q}”.
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map(({ group, entries }) => (
            <div key={group}>
              <div className="text-[10px] uppercase font-bold text-cyan-300/70 font-mono tracking-wider mb-2.5">
                {group}
              </div>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {entries.map((e) => (
                  <div
                    key={e.id}
                    id={`g-${e.id}`}
                    className="bg-black/30 border border-white/10 rounded-lg p-3.5 scroll-mt-24 hover:border-white/20 transition"
                  >
                    <dt className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-xs font-bold text-white/90">{e.term}</span>
                      {e.aka && (
                        <span className="text-[10px] font-mono text-white/35">· {e.aka}</span>
                      )}
                    </dt>
                    <dd className="mt-1 text-[11px] leading-relaxed text-white/55 font-sans">
                      {e.long}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
