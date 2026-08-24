import React from 'react';

export const SyncBadge: React.FC = () => (
  <div className="fixed bottom-4 right-4 bg-foreground text-background px-3 py-1 rounded-md shadow-md animate-pulse">
    Syncing…
  </div>
);
