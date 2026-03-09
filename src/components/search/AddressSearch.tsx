"use client";

/**
 * AddressSearch — Mapbox-powered address search with autocomplete.
 *
 * As the user types, debounces 280ms then hits Mapbox Geocoding directly
 * from the browser (NEXT_PUBLIC_MAPBOX_TOKEN).  Falls back to the
 * /api/geocode backend proxy if no suggestions have loaded yet.
 */

import { useState, useEffect, useRef, useCallback } from "react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type Suggestion = {
  place_name: string;
  center: [number, number];
};

type SearchResult = { address: string; lat: number; lng: number };

type Props = {
  onResult: (result: SearchResult) => void;
};

export default function AddressSearch({ onResult }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch autocomplete suggestions on every keystroke (debounced)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      if (!MAPBOX_TOKEN) return;
      try {
        const url =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
          `?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const features = (data.features as Suggestion[]) ?? [];
        setSuggestions(features);
        setOpen(features.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = useCallback(
    (s: Suggestion) => {
      onResult({ address: s.place_name, lat: s.center[1], lng: s.center[0] });
      setQuery("");
      setSuggestions([]);
      setOpen(false);
      setError(null);
    },
    [onResult]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Pick top suggestion if available
    if (suggestions.length > 0) {
      handleSelect(suggestions[0]);
      return;
    }
    // Fallback: backend proxy
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) { setError("Not found"); return; }
      const data = await res.json();
      if (data.error) { setError("Not found"); return; }
      onResult(data);
      setQuery("");
    } catch {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="flex-1 min-w-0 relative">
      <form onSubmit={handleSubmit} className="flex gap-1.5">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError(null); }}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="Search address…"
            className="w-full h-9 pl-3 pr-3 text-sm border border-gray-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {error && (
            <p className="absolute top-full mt-1 left-0 text-xs text-red-500 bg-white px-2 py-1 rounded-lg shadow z-10">
              {error}
            </p>
          )}

          {/* Autocomplete dropdown */}
          {open && suggestions.length > 0 && (
            <ul className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(s)}
                    className="w-full text-left px-3 py-2.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors leading-snug border-b border-gray-50 last:border-0"
                  >
                    {s.place_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 font-medium shrink-0 transition-colors"
        >
          {loading ? "…" : "Go"}
        </button>
      </form>
    </div>
  );
}
