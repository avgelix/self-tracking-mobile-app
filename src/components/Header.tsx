import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Card } from './ui/card';
import { TrendingUp } from 'lucide-react';

export function Header() {
  const { state } = useApp();

  // Get today's entries count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEntries = state.entries.filter(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });

  // Calculate streak (consecutive days with entries)
  const calculateStreak = () => {
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (true) {
      const hasEntry = state.entries.some(entry => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === currentDate.getTime();
      });

      if (hasEntry) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const streak = calculateStreak();

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 backdrop-blur-xl shadow-lg rounded-b-[32px]">
      <div className="px-6 py-16 pb-[48px] pt-[56px] pr-[21px] pl-[21px]">
        {/* Title */}
        <motion.h1 
          className="text-white mb-4 text-6xl font-black tracking-tight leading-tight"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Whatever
        </motion.h1>
        <motion.p 
          className="text-white/90 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          track whatever you want, because you can.
        </motion.p>

        {/* Avatar and Stats Row */}
        <motion.div
          className="flex items-center gap-4 mb-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-white/90 flex-shrink-0 flex items-center justify-center text-blue-600 text-2xl">
            {state.userProfile?.name?.charAt(0).toUpperCase() || 'W'}
          </div>

          {/* Stats Cards */}
          <div className="flex-1 flex gap-3">
            {/* Today's Entries */}
            <Card className="flex-1 p-3 bg-white/20 backdrop-blur-sm border-white/30">
              <div className="text-center">
                <div className="text-2xl font-medium text-white">{todayEntries.length}</div>
                <div className="text-xs text-white/80">Today's Entries</div>
              </div>
            </Card>

            {/* Day Streak */}
            <Card className="flex-1 p-3 bg-white/20 backdrop-blur-sm border-white/30">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="w-4 h-4 text-white" />
                  <span className="text-2xl font-medium text-white">{streak}</span>
                </div>
                <div className="text-xs text-white/80">Day Streak</div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h2 className="text-white text-xl font-medium mb-1">
            {state.userProfile?.lastLoginDate 
              ? `Welcome back${state.userProfile?.name ? `, ${state.userProfile.name}` : ''}!`
              : `Welcome${state.userProfile?.name ? `, ${state.userProfile.name}` : ''}!`
            }
          </h2>
          <p className="text-white/70 text-sm">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </motion.div>
      </div>
    </header>
  );
}
