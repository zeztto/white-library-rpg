import { useGameStore } from '@/lib/game-store';
import { 
  CHARACTER_CLASSES, 
  DIFFICULTY_TEXT, 
  CharacterClassId,
  type CharacterClass 
} from '@/lib/game-data';
import { Button } from '@/app/components/ui/button';
import { motion } from 'motion/react';
import { Shield, Target, Wand2, ArrowLeft, Heart, Sword, ShieldCheck, Zap } from 'lucide-react';

const CLASS_ICONS: Record<CharacterClassId, React.ReactNode> = {
  knight: <Shield className="h-8 w-8" />,
  archer: <Target className="h-8 w-8" />,
  mage: <Wand2 className="h-8 w-8" />,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-green-700',
  normal: 'text-amber-800',
  hard: 'text-red-700',
};

interface CharacterCardProps {
  classData: CharacterClass;
  onSelect: () => void;
  delay: number;
}

function CharacterCard({ classData, onSelect, delay }: CharacterCardProps) {
  const { baseStats, specialSkill, difficulty, maxPotions } = classData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-muted/50 rounded-lg p-4 border border-border/50 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-background/50">
          {CLASS_ICONS[classData.id]}
        </div>
        <div>
          <h3 className="text-lg font-bold">{classData.name}</h3>
          <span className={`text-xs ${DIFFICULTY_COLORS[difficulty]}`}>
            {DIFFICULTY_TEXT[difficulty]}
          </span>
        </div>
      </div>

      <p className="text-sm opacity-70 mb-4">{classData.description}</p>

      {/* 스탯 */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-4">
        <div className="flex items-center gap-1">
          <Heart className="h-3 w-3 text-red-400" />
          <span>체력 {baseStats.hp}</span>
        </div>
        <div className="flex items-center gap-1">
          <Sword className="h-3 w-3 text-orange-400" />
          <span>공격 {baseStats.attackPower}</span>
        </div>
        <div className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-blue-400" />
          <span>방어 {baseStats.defense}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-yellow-400" />
          <span>속도 {baseStats.speed}</span>
        </div>
      </div>

      {/* 특수 스킬 */}
      <div className="bg-background/30 rounded p-2 mb-4">
        <div className="text-xs font-semibold mb-1">{specialSkill.name}</div>
        <div className="text-xs opacity-60">{specialSkill.description}</div>
        <div className="text-xs text-muted-foreground mt-1">쿨다운: {specialSkill.cooldown}턴</div>
      </div>

      {/* 포션 한도 */}
      <div className="text-xs text-muted-foreground mb-4">
        포션 보유 한도: {maxPotions}개
      </div>

      <Button onClick={onSelect} className="w-full" size="sm">
        {classData.name} 선택
      </Button>
    </motion.div>
  );
}

export function CharacterSelectScreen() {
  const currentSaveSlot = useGameStore(state => state.currentSaveSlot);
  const startNewGame = useGameStore(state => state.startNewGame);
  const cancelCharacterSelect = useGameStore(state => state.cancelCharacterSelect);

  const handleSelectClass = (classId: CharacterClassId) => {
    startNewGame(currentSaveSlot, classId);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold mb-2"
          >
            직업 선택
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm opacity-60"
          >
            백색 서고를 탐험할 기록자의 직업을 선택하세요
          </motion.p>
        </div>

        {/* Character Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.values(CHARACTER_CLASSES).map((classData, index) => (
            <CharacterCard
              key={classData.id}
              classData={classData}
              onSelect={() => handleSelectClass(classData.id)}
              delay={0.3 + index * 0.1}
            />
          ))}
        </div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Button
            variant="ghost"
            onClick={cancelCharacterSelect}
            className="opacity-60 hover:opacity-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            타이틀로 돌아가기
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
