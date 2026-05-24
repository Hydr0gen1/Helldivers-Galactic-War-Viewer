interface Props {
  onRefresh: () => void;
  isFetching: boolean;
  lastUpdated?: string;
}

export function RefreshControls({ onRefresh, isFetching, lastUpdated }: Props) {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={onRefresh}
        disabled={isFetching}
        title={`Auto-refreshes every 60s${lastUpdated ? `. Last: ${new Date(lastUpdated).toLocaleTimeString()}` : ''}`}
        className={`
          flex items-center gap-2 px-4 py-2 rounded
          bg-gray-800 border border-gray-600 text-gray-300
          hover:bg-gray-700 hover:text-white transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          text-sm font-mono
        `}
      >
        <span className={isFetching ? 'animate-spin' : ''}>⟳</span>
        {isFetching ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
}
