export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 p-4 animate-pulse">
      <div className="h-20 bg-gray-800 rounded mb-4" />
      <div className="h-32 bg-gray-800 rounded mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-800 rounded" />)}
        </div>
        <div className="space-y-4">
          <div className="h-48 bg-gray-800 rounded" />
          <div className="h-48 bg-gray-800 rounded" />
        </div>
      </div>
    </div>
  );
}
