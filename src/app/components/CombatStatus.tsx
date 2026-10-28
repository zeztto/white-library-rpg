import { useGameStore } from '@/lib/game-store';
import { Progress } from '@/app/components/ui/progress';
import { motion } from 'motion/react';
import { Skull, Swords, Clock } from 'lucide-react';

export function CombatStatus() {
  const inCombat = useGameStore(state => state.inCombat);
  const currentEnemy = useGameStore(state => state.currentEnemy);
  const playerTurn = useGameStore(state => state.playerTurn);
  
  if (!inCombat || !currentEnemy) return null;
  
  const hpPercentage = (currentEnemy.hp / currentEnemy.maxHp) * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative shrink-0 px-4 pt-3 z-10"
    >
      <div className="p-4 bg-card/95  border-2 border-destructive/20 rounded-lg">
        {/* Turn indicator */}
        <div className="flex items-center justify-center mb-3">
          {playerTurn ? (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full"
            >
              <Swords className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">당신의 차례</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 px-3 py-1 bg-destructive/10 rounded-full"
            >
              <Clock className="h-4 w-4 text-destructive " />
              <span className="text-sm font-bold text-destructive">적의 차례...</span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
            <Skull className="h-5 w-5 text-destructive" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">{currentEnemy.name}</h3>
              <span className="text-xs font-mono opacity-60">
                {currentEnemy.hp} / {currentEnemy.maxHp}
              </span>
            </div>
            <Progress
              value={hpPercentage}
              className="h-2 bg-destructive/20"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}