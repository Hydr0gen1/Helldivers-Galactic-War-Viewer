import { useSnapshot, useRecommendation } from './api/hooks.js';
import { WarStatusBanner } from './components/WarStatusBanner.js';
import { CriticalAlerts } from './components/CriticalAlerts.js';
import { MajorOrderPanel } from './components/MajorOrderPanel.js';
import { PriorityList } from './components/PriorityList.js';
import { GambitPanel } from './components/GambitPanel.js';
import { SiegeMap } from './components/SiegeMap.js';
import { RefreshControls } from './components/RefreshControls.js';
import { LoadingSkeleton } from './components/LoadingSkeleton.js';
import { WarArchivePanel } from './components/archive/WarArchivePanel.js';
import { useState } from 'react';
import type { WarSnapshot, Recommendation } from './api/types.js';

function WarmingUp({ eta }: { eta?: number }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        <div className="text-yellow-400 text-4xl mb-4 animate-pulse">⚡</div>
        <h1 className="text-xl font-bold text-gray-100 mb-2">
          Spinning up the Strategic Operations Center…
        </h1>
        <p className="text-gray-400 text-sm">
          First data expected in {eta ? `~${Math.ceil(eta / 1000)}s` : '~60s'}.
          Hang tight, Helldiver.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<'live' | 'archive'>('live');
  const snapshotQuery = useSnapshot();
  const recommendationQuery = useRecommendation();

  const isWarmingUp =
    snapshotQuery.error instanceof Error &&
    snapshotQuery.error.message.startsWith('503');

  if (isWarmingUp) {
    return <WarmingUp />;
  }

  if (snapshotQuery.isLoading && !snapshotQuery.data) {
    return <LoadingSkeleton />;
  }

  const snapshot = snapshotQuery.data as WarSnapshot | undefined;
  const recommendation = recommendationQuery.data as Recommendation | undefined;

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        Failed to load war data.
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="inline-flex bg-gray-900 border border-gray-800 rounded overflow-hidden">
          <button onClick={() => setView('live')} className={`px-3 py-2 text-sm ${view === 'live' ? 'bg-cyan-700 text-white' : 'text-gray-300'}`}>Live Intel</button>
          <button onClick={() => setView('archive')} className={`px-3 py-2 text-sm ${view === 'archive' ? 'bg-cyan-700 text-white' : 'text-gray-300'}`}>War Archive</button>
        </div>
      </div>
      {view === 'archive' ? <WarArchivePanel /> : <>
      <WarStatusBanner snapshot={snapshot} recommendation={recommendation} />

      <CriticalAlerts alerts={recommendation?.critical_alerts ?? []} />

      {recommendation && (
        <MajorOrderPanel
          majorOrders={snapshot.majorOrders}
          moStatus={recommendation.major_order_status}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PriorityList
              priorities={recommendation?.priority_planets ?? []}
              campaigns={snapshot.campaigns}
            />
          </div>
          <div className="space-y-6">
            <GambitPanel gambits={recommendation?.gambit_opportunities ?? []} />
            <SiegeMap siegeCandidates={snapshot.derived.siegeCandidates} />
          </div>
        </div>
      </div>

      {recommendation?.player_distribution_warning && (
        <div className="max-w-7xl mx-auto px-4 pb-4">
          <div className="bg-orange-950/40 border border-orange-500/50 rounded p-3 text-sm text-orange-300">
            <span className="font-bold">Spread Warning: </span>
            {recommendation.player_distribution_warning}
          </div>
        </div>
      )}

      <footer className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600 text-xs">
        <p>
          Data from the community Helldivers 2 API. For Liberty!{' '}
          <a
            href="https://helldivers.wiki.gg/wiki/Galactic_War"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-400"
          >
            How to actually help →
          </a>
        </p>
      </footer>

      <RefreshControls
        onRefresh={() => {
          snapshotQuery.refetch();
          recommendationQuery.refetch();
        }}
        isFetching={snapshotQuery.isFetching || recommendationQuery.isFetching}
        lastUpdated={snapshot.generatedAt}
      />
      </>}
    </div>
  );
}
