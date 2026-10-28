import { useGameStore } from '@/lib/game-store';
import { Button } from '@/app/components/ui/button';
import { motion } from 'motion/react';
import {
  Swords,
  BookOpen,
  Shield,
  ArrowRight,
  Package,
  Sparkles,
  FlaskConical,
  Zap,
  Home
} from 'lucide-react';

export function ActionPanel() {
  const inCombat = useGameStore(state => state.inCombat);
  const playerTurn = useGameStore(state => state.playerTurn);
  const words = useGameStore(state => state.words);
  const isDead = useGameStore(state => state.isDead);
  const potions = useGameStore(state => state.potions);
  const hp = useGameStore(state => state.hp);
  const maxHp = useGameStore(state => state.maxHp);
  const hasAdjective = words.some(word=>word.type==='adjective'&&word.text.trim());
  const specialSkillCooldown = useGameStore(state => state.specialSkillCooldown);
  
  const handleExplore = () => {
    useGameStore.getState().explore();
  };
  
  const handleAttack = () => {
    // Simple attack without skill
    useGameStore.getState().attack();
    // 자동 저장 (전투 종료 시에도 저장되므로 중복이지만 안전을 위해)
  };
  
  const handleSkillAttack = () => {
    // Use word combination if available
    const adjectives = words.filter(w => w.type === 'adjective');
    const verbs = words.filter(w => w.type === 'verb');

    if (adjectives.length > 0 && verbs.length > 0) {
      const adj = adjectives[0];
      const verb = verbs[0];
      useGameStore.getState().attack({ adjective: adj, verb });
    } else if (adjectives.length > 0) {
      // 형용사만 있으면 기본 동사 사용
      const adj = adjectives[0];
      const verb = { id: 'default', text: '베기', type: 'verb' as const };
      useGameStore.getState().attack({ adjective: adj, verb });
    } else {
      // 단어가 없으면 일반 공격
      handleAttack();
    }
    // 자동 저장
  };
  
  if (isDead) {
    const state = useGameStore.getState();
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative shrink-0 bg-background border-t border-border"
      >
        <div className="px-4 py-6 space-y-4">
          {/* Game Over Title */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-destructive">여정 종료</h2>
            <p className="text-sm text-muted-foreground">모든 것이 백색으로 물들어갑니다...</p>
          </div>
          
          {/* Final Stats */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-bold opacity-60 mb-3">최종 기록</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="opacity-60">도달 층:</span>
                <span className="font-mono font-bold">{state.floor}F</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">레벨:</span>
                <span className="font-mono font-bold">Lv.{state.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">수집 단어:</span>
                <span className="font-mono font-bold">{state.words.length}개</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">완료 층:</span>
                <span className="font-mono font-bold">{state.completedFloors}층</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-2">
            <Button 
              onClick={() => {
                const currentSlot = state.currentSaveSlot || 1;
                if (window.confirm('같은 슬롯에서 새 여정을 시작할까요? 직업을 선택하면 기존 기록을 덮어씁니다.')) useGameStore.getState().startCharacterSelect(currentSlot);
              }}
              className="w-full"
              size="lg"
            >
              새로운 여정 시작하기
            </Button>
            <Button 
              onClick={() => useGameStore.getState().returnToTitle()}
              className="w-full"
              variant="outline"
              size="lg"
            >
              타이틀로 돌아가기
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }
  
  if (inCombat) {
    const canUsePotion = potions > 0 && hp < maxHp;
    const canUseSpecialSkill = specialSkillCooldown === 0;
    
    return (
      <div className="relative shrink-0 bg-background border-t border-border">
        <div className="px-4 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={handleAttack}
                disabled={!playerTurn}
                className="w-full h-12"
                variant="outline"
              >
                <Swords className="mr-1 h-4 w-4" />
                공격
              </Button>
            </motion.div>
            
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={handleSkillAttack}
                disabled={!playerTurn || !hasAdjective}
                className="w-full h-12"
              >
                <Sparkles className="mr-1 h-4 w-4" />
                단어 공격
              </Button>
            </motion.div>
            
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => useGameStore.getState().useSpecialSkill()}
                disabled={!playerTurn || !canUseSpecialSkill}
                className="w-full h-12 relative"
                variant={canUseSpecialSkill ? 'default' : 'outline'}
              >
                <Zap className="mr-1 h-4 w-4" />
                {canUseSpecialSkill ? '필살' : specialSkillCooldown}
              </Button>
            </motion.div>
            
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => useGameStore.getState().defend()}
                disabled={!playerTurn}
                className="w-full h-12"
                variant="outline"
              >
                <Shield className="mr-1 h-4 w-4" />
                방어
              </Button>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => useGameStore.getState().usePotion()}
                disabled={!playerTurn || !canUsePotion}
                className="w-full h-10"
                variant="outline"
              >
                <FlaskConical className="mr-1 h-4 w-4" />
                포션 ({potions})
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => useGameStore.getState().toggleInventory()}
                className="w-full h-10"
                variant="outline"
              >
                <Package className="mr-1 h-4 w-4" />
                소지품
              </Button>
            </motion.div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button variant="outline" onClick={()=>useGameStore.getState().saveGame()}>저장</Button>
            <Button variant="ghost" onClick={()=>useGameStore.getState().returnToTitle()}>타이틀</Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Exploration mode
  const canUsePotion = potions > 0 && hp < maxHp;
  
  return (
    <div className="relative shrink-0 bg-background border-t border-border">
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <motion.div whileTap={{ scale: 0.95 }} className="col-span-2">
            <Button 
              onClick={handleExplore}
              className="w-full h-14"
              size="lg"
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              탐색하기
            </Button>
          </motion.div>
          
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => useGameStore.getState().usePotion()}
              disabled={!canUsePotion}
              className="w-full h-12"
              variant="outline"
            >
              <FlaskConical className="mr-2 h-4 w-4" />
              포션 ({potions})
            </Button>
          </motion.div>
          
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => useGameStore.getState().toggleInventory()}
              className="w-full h-12"
              variant="outline"
            >
              <Package className="mr-2 h-4 w-4" />
              소지품
            </Button>
          </motion.div>
          
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={() => useGameStore.getState().saveGame()}
              className="w-full h-10"
              variant="outline"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              저장
            </Button>
          </motion.div>
          
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={() => useGameStore.getState().returnToTitle()}
              className="w-full h-10"
              variant="ghost"
            >
              <Home className="mr-2 h-4 w-4" />
              타이틀
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}