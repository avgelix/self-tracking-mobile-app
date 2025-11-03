import { Cloud, CloudOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export function SyncIndicator() {
  const { isSyncing } = useApp();

  return (
    <div className="fixed top-4 right-4 z-50">
      {isSyncing && (
        <div className="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-white/30 rounded-full shadow-lg">
          <Cloud className="w-4 h-4 text-blue-500 animate-pulse" />
          <span className="text-sm text-gray-600">Syncing...</span>
        </div>
      )}
    </div>
  );
}
