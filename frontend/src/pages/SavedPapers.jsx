// src/pages/SavedPapers.jsx
import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchResources } from '../api/resources.js';
import { useApi } from '../hooks/useApi.js';
import ResourceCard from '../components/ResourceCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { FullPageLoader } from '../components/ui/Loader.jsx';

const SavedPapers = () => {
  const { user } = useAuth();

  // Fetch all bookmarked resources by their IDs
  const bookmarkIds = useMemo(() => user?.bookmarks ?? [], [user?.bookmarks]);

  const { data, loading, error, refetch } = useApi(
    () => {
      if (!bookmarkIds.length) return Promise.resolve({ resources: [], total: 0 });
      // Fetch resources that are bookmarked (we use the full list and filter client-side
      // since the backend /resources endpoint doesn't support bookmark filter yet)
      return fetchResources({ limit: 100 });
    },
    [bookmarkIds.length],
    { skip: false }
  );

  const savedResources = useMemo(() => {
    if (!data?.resources) return [];
    const ids = new Set(bookmarkIds.map(String));
    return data.resources.filter((r) => ids.has(String(r._id)));
  }, [data, bookmarkIds]);

  if (loading) return <FullPageLoader label="Loading saved papers…" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Saved Papers</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {savedResources.length} saved resource{savedResources.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</div>
      )}

      {!loading && savedResources.length === 0 ? (
        <EmptyState
          icon="🔖"
          title="No saved papers yet"
          description="Bookmark resources on any subject page to save them here."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {savedResources.map((r) => (
            <ResourceCard
              key={r._id}
              resource={r}
              showSubject
              onUpvoted={refetch}
              onBookmarkToggled={refetch}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPapers;
