import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tournament } from '../../types';
import { api } from '../../services/api';
import { TournamentCard } from '../../components/ui/TournamentCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Trophy, Search, Filter, Gamepad2 } from 'lucide-react';

export const Tournaments: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const currentStatus = searchParams.get('status') || 'all';
  const currentMode = searchParams.get('mode') || 'all';
  const currentMap = searchParams.get('map') || 'all';
  const searchQuery = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (currentStatus !== 'all') params.status = currentStatus;
    if (currentMode !== 'all') params.game_mode = currentMode;
    if (currentMap !== 'all') params.map_name = currentMap;
    if (searchQuery) params.search = searchQuery;

    api.tournaments
      .list(params)
      .then((res) => setTournaments(res.tournaments))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [currentStatus, currentMode, currentMap, searchQuery]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all' || !value) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('search', searchInput);
  };

  const hasActiveFilters =
    currentStatus !== 'all' ||
    currentMode !== 'all' ||
    currentMap !== 'all' ||
    !!searchQuery;

  const resetAllFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-neongreen uppercase tracking-widest mb-1">
          <Trophy className="w-4 h-4 text-neongreen" />
          <span>COMPETITIVE CIRCUITS</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold uppercase tracking-wide text-icewhite">
          Tournaments &amp; League Ladders
        </h1>
        <p className="text-sm text-subtext mt-1">
          Explore upcoming, open, and live Free Fire tournaments. Secure your slot early.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-deepteal/50 border border-aroraborder p-4 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 flex-shrink-0">
            <input
              type="text"
              placeholder="Search tournament title or map..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-midnight border border-aroraborder rounded-lg pl-10 pr-4 py-2 text-sm text-icewhite placeholder-subtext focus:outline-none focus:border-neongreen/50 transition-colors"
            />
            <Search className="w-4 h-4 text-subtext absolute left-3.5 top-3" />
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-subtext font-mono">
              <Filter className="w-3.5 h-3.5 text-cyan" />
              <span>Filters:</span>
            </div>

            {/* Status Filter */}
            <select
              value={currentStatus}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan transition-colors cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Registration Open">Registration Open</option>
              <option value="Published">Upcoming (Published)</option>
              <option value="Live">Live In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Game Mode Filter */}
            <select
              value={currentMode}
              onChange={(e) => updateFilter('mode', e.target.value)}
              className="bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan transition-colors cursor-pointer"
            >
              <option value="all">All Game Modes</option>
              <option value="Battle Royale Squad">Battle Royale Squad</option>
              <option value="Battle Royale Duo">Battle Royale Duo</option>
              <option value="Battle Royale Solo">Battle Royale Solo</option>
              <option value="Clash Squad">Clash Squad</option>
              <option value="Lone Wolf">Lone Wolf</option>
            </select>

            {/* Map Filter */}
            <select
              value={currentMap}
              onChange={(e) => updateFilter('map', e.target.value)}
              className="bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan transition-colors cursor-pointer"
            >
              <option value="all">All Maps</option>
              <option value="Bermuda">Bermuda</option>
              <option value="Purgatory">Purgatory</option>
              <option value="Kalahari">Kalahari</option>
              <option value="Alpine">Alpine</option>
              <option value="Nexterra">Nexterra</option>
            </select>

            {/* Reset Button — only visible when any filter is active */}
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="px-3 py-2 text-xs font-mono text-rose-400 border border-rose-500/40 hover:border-rose-400 hover:text-rose-300 rounded-lg transition-colors"
              >
                ✕ Reset
              </button>
            )}
          </div>
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-aroraborder/40">
            {currentStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-[11px] font-mono">
                Status: {currentStatus}
                <button
                  onClick={() => updateFilter('status', 'all')}
                  className="hover:text-white ml-0.5 leading-none"
                  aria-label="Remove status filter"
                >✕</button>
              </span>
            )}
            {currentMode !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neongreen/10 border border-neongreen/30 text-neongreen text-[11px] font-mono">
                <Gamepad2 className="w-3 h-3" />
                {currentMode}
                <button
                  onClick={() => updateFilter('mode', 'all')}
                  className="hover:text-white ml-0.5 leading-none"
                  aria-label="Remove game mode filter"
                >✕</button>
              </span>
            )}
            {currentMap !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-[11px] font-mono">
                Map: {currentMap}
                <button
                  onClick={() => updateFilter('map', 'all')}
                  className="hover:text-white ml-0.5 leading-none"
                  aria-label="Remove map filter"
                >✕</button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-deepteal border border-aroraborder text-subtext text-[11px] font-mono">
                Search: &quot;{searchQuery}&quot;
                <button
                  onClick={() => { setSearchInput(''); updateFilter('search', ''); }}
                  className="hover:text-white ml-0.5 leading-none"
                  aria-label="Remove search filter"
                >✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-subtext font-mono -mt-4">
          {tournaments.length === 0
            ? 'No tournaments found'
            : `Showing ${tournaments.length} tournament${tournaments.length !== 1 ? 's' : ''}`}
          {hasActiveFilters && (
            <span className="text-neongreen/70"> — filtered</span>
          )}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 rounded-xl bg-deepteal/30 border border-aroraborder animate-pulse" />
          ))}
        </div>
      ) : tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Trophy}
          title="No Tournaments Match Your Filter"
          description="Try broadening your search term or resetting the status, mode, or map filters."
          actionText="Reset All Filters"
          onAction={resetAllFilters}
        />
      )}
    </div>
  );
};
