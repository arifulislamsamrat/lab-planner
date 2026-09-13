import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../../hooks/useSearch';
import { useDebounce } from '../../hooks/useDebounce';
import StatusBadge from '../common/StatusBadge';

const MAX_RESULTS_PER_GROUP = 8;

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Only run the query hook once we actually have a non-empty debounced query
  // (the hook is also guarded internally by `enabled`).
  const debouncedQuery = useDebounce(query, 250);
  const trimmed = debouncedQuery.trim();
  const { data, isFetching } = useSearch(trimmed, MAX_RESULTS_PER_GROUP);

  const totalCount = useMemo(() => {
    if (!data) return 0;
    return data.labs.length + data.milestones.length + data.modules.length;
  }, [data]);

  // Open the dropdown whenever there is a query and we're showing something.
  useEffect(() => {
    if (trimmed.length > 0) setOpen(true);
    else setOpen(false);
  }, [trimmed, totalCount]);

  // Close on click outside, Escape, or after selecting a result.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function go(path: string) {
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
    navigate(path);
  }

  return (
    <div className="header-search" ref={containerRef}>
      <div className="search-input-wrapper">
        <svg
          className="search-input-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          className="search-input"
          placeholder="Search labs, milestones, modules…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (trimmed.length > 0 && totalCount > 0) setOpen(true);
          }}
          aria-label="Search labs, milestones, and modules"
          aria-expanded={open}
          aria-controls="global-search-results"
          autoComplete="off"
          spellCheck={false}
        />
        {isFetching && (
          <span className="search-input-spinner" aria-hidden="true">
            <span className="spinner" />
          </span>
        )}
      </div>

      {open && trimmed.length > 0 && (
        <div
          id="global-search-results"
          className="search-results"
          role="listbox"
          aria-label="Search results"
        >
          {isFetching && !data && (
            <div className="search-empty">Searching…</div>
          )}

          {data && totalCount === 0 && !isFetching && (
            <div className="search-empty">
              No matches for <strong>{trimmed}</strong>
            </div>
          )}

          {data && data.labs.length > 0 && (
            <SearchGroup label="Labs">
              {data.labs.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className="search-result"
                  onClick={() => go(`/labs/${l.id}`)}
                  role="option"
                >
                  <span className="search-result-title">{l.title}</span>
                  <StatusBadge status={l.status} />
                </button>
              ))}
            </SearchGroup>
          )}

          {data && data.milestones.length > 0 && (
            <SearchGroup label="Milestones">
              {data.milestones.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="search-result"
                  onClick={() =>
                    go(
                      m.courseId
                        ? `/courses/${m.courseId}/lab-planning`
                        : '/courses',
                    )
                  }
                  role="option"
                >
                  <span className="search-result-title">{m.title}</span>
                  <span className="search-result-tag">Milestone</span>
                </button>
              ))}
            </SearchGroup>
          )}

          {data && data.modules.length > 0 && (
            <SearchGroup label="Modules">
              {data.modules.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="search-result"
                  onClick={() =>
                    go(
                      m.courseId
                        ? `/courses/${m.courseId}/lab-planning`
                        : '/courses',
                    )
                  }
                  role="option"
                >
                  <span className="search-result-title">{m.title}</span>
                  <span className="search-result-tag">Module</span>
                </button>
              ))}
            </SearchGroup>
          )}
        </div>
      )}
    </div>
  );
}

function SearchGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="search-group">
      <div className="search-group-label">{label}</div>
      <div className="search-group-items">{children}</div>
    </div>
  );
}
