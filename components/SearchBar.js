'use client';
import { useState, useRef, useCallback } from 'react';

export default function SearchBar({ onSelectLocation, onClear }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback((q) => {
    if (!q.trim() || q.length < 3) { setResults([]); return; }
    setLoading(true);
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=ph`,
      { headers: { 'Accept-Language': 'en' } }
    )
      .then(r => r.json())
      .then(data => { setResults(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 450);
    if (!val) { setResults([]); onClear(); }
  };

  const handleSelect = (item) => {
    const shortName = item.display_name.split(',')[0];
    setQuery(shortName);
    setResults([]);
    onSelectLocation({
      lat:  parseFloat(item.lat),
      lng:  parseFloat(item.lon),
      name: item.display_name,
    });
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    onClear();
  };

  return (
    <div className="search-bar-container" id="search-bar-container">
      <div className="search-bar">
        <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input
          id="search-input"
          type="text"
          placeholder="Search destination..."
          value={query}
          onChange={handleInput}
          className="search-input"
          autoComplete="off"
        />
        {loading && <div className="search-spinner" />}
        {query && !loading && (
          <button className="search-clear" id="search-clear" onClick={handleClear} title="Clear">✕</button>
        )}
      </div>

      {results.length > 0 && (
        <ul className="search-results" id="search-results">
          {results.map((item) => (
            <li
              key={item.place_id}
              className="search-result-item"
              onClick={() => handleSelect(item)}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              </svg>
              <span>{item.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
