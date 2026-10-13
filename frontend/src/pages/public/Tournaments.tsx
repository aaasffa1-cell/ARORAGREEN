import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tournament } from '../../types';
import { api } from '../../services/api';
import { TournamentCard } from '../../components/ui/TournamentCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Trophy, Search, Filter } from 'lucide-react';

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
      <div className="bg-deepteal/50 border border-aroraborder p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
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
            className="bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan"
          >
            <option value="all">All Statuses</option>
            <option value="Registration Open">Registration Open</option>
            <option value="Published">Upcoming (Published)</option>
            <option value="Live">Live In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Map Filter */}
          <select
            value={currentMap}
            onChange={(e) => updateFilter('map', e.target.value)}
            className="bg-midnight border border-aroraborder rounded-lg px-3 py-2 text-xs text-icewhite focus:outline-none focus:border-cyan"
          >
            <option value="all">All Maps</option>
            <option value="Bermuda">Bermuda</option>
            <option value="Purgatory">Purgatory</option>
            <option value="Kalahari">Kalahari</option>
            <option value="Alpine">Alpine</option>
            <option value="Nexterra">Nexterra</option>
          </select>
        </div>
      </div>

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
          description="Try broadening your search term or resetting the status/map filters."
          actionText="Reset All Filters"
          onAction={() => setSearchParams({})}
        />
      )}
    </div>
  );
};
