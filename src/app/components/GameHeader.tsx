import { useGameStore } from '@/lib/game-store';
import { CHARACTER_CLASSES, type CharacterClassId } from '@/lib/game-data';
import { Progress } from '@/app/components/ui/progress';
import { FlaskConical, Shield, Target, Wand2 } from 'lucide-react';

const CLASS_ICONS: Record<CharacterClassId, React.ReactNode> = {
  knight: <Shield className="w-4 h-4" />,
  archer: <Target className="w-4 h-4" />,
  mage: <Wand2 className="w-4 h-4" />,
};

export function GameHeader() {
  const characterClass = useGameStore(state => state.characterClass);
  const level = useGameStore(state => state.level);
  const hp = useGameStore(state => state.hp);
  const maxHp = useGameStore(state => state.maxHp);
  const floor = useGameStore(state => state.floor);
  const eventCount = useGameStore(state => state.eventCount);
  const eventsPerFloor = useGameStore(state => state.eventsPerFloor);
  const potions = useGameStore(state => state.potions);
  const maxPotions = useGameStore(state => state.maxPotions);
  const toggleStatusModal = useGameStore(state => state.toggleStatusModal);
  
  const classData = CHARACTER_CLASSES[characterClass];
  
  const hpPercentage = (hp / maxHp) * 100;
  const isLowHealth = hpPercentage < 20;
  
  return (
    <header className="relative shrink-0 bg-background border-b border-border z-50">
      <div className="px-4 py-3">
        {/* Top row: Name & Floor */}
        <div className="flex items-center justify-between mb-3">
          <button 
            onClick={toggleStatusModal}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              {CLASS_ICONS[characterClass]}
            </div>
            <div className="text-left">
              <span className="font-bold text-lg tracking-tight">Lv.{level}</span>
              <span className="text-sm opacity-60 ml-2">{classData.name}</span>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {/* Potions indicator */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-background">
              <FlaskConical className="w-3 h-3 text-primary" />
              <span className="font-mono text-xs">{potions}/{maxPotions}</span>
            </div>
            {/* Floor indicator */}
            <span className="font-mono text-xs px-2 py-1 rounded-md border border-border bg-background">
              {floor}F
            </span>
          </div>
        </div>
        
        {/* HP Bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs opacity-60">HP</span>
            <span className={`text-xs font-mono ${isLowHealth ? 'text-destructive ' : ''}`}>
              {hp} / {maxHp}
            </span>
          </div>
          <Progress 
            value={hpPercentage} 
            className={`h-2 ${isLowHealth ? 'bg-destructive/20' : ''}`}
          />
        </div>
        
        {/* Event Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs opacity-60">진행도</span>
            <span className="text-xs font-mono opacity-60">
              {eventCount} / {eventsPerFloor}
            </span>
          </div>
          <div className="flex gap-0.5 h-1">
            {Array.from({ length: eventsPerFloor }).map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-full transition-colors ${i < eventCount ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}