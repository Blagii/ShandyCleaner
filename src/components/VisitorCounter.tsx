import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

const VisitorCounter = () => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initCounter = async () => {
      try {
        const hasVisited = sessionStorage.getItem('shandy_has_visited_server');
        let data;

        if (!hasVisited) {
          // First visit: Increment counter
          const res = await fetch('/api/stats/visit', { method: 'POST' });
          if (res.ok) {
            data = await res.json();
            sessionStorage.setItem('shandy_has_visited_server', 'true');
          }
        } else {
          // Returning visit: Just get stats
          const res = await fetch('/api/stats');
          if (res.ok) {
            data = await res.json();
          }
        }

        if (data && typeof data.totalVisits === 'number') {
          setCount(data.totalVisits);
        }
      } catch (err) {
        console.error('Failed to fetch visitor count', err);
      } finally {
        setLoading(false);
      }
    };

    initCounter();
  }, []);

  if (loading || count === null) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500 bg-surfaceHighlight/30 px-3 py-1.5 rounded-full border border-white/5 transition-all hover:bg-surfaceHighlight/50 hover:text-zinc-300 cursor-help" title="Total page views">
      <Users className="w-3 h-3" />
      <span>
        <span className="font-mono font-medium text-emerald-400">
          {count.toLocaleString()}
        </span>
        {' '}visits
      </span>
    </div>
  );
};

export default VisitorCounter;
