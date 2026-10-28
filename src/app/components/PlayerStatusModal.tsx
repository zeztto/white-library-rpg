import { useGameStore } from '@/lib/game-store';
import { CHARACTER_CLASSES, type CharacterClassId } from '@/lib/game-data';
import { Progress } from '@/app/components/ui/progress';
import { Button } from '@/app/components/ui/button';
import { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Heart, Sword, Shield as ShieldIcon, Zap, FlaskConical, BookOpen, Activity, Target, Wand2 } from 'lucide-react';

const CLASS_ICONS: Record<CharacterClassId, React.ReactNode> = {
  knight: <ShieldIcon className="w-5 h-5" />,
  archer: <Target className="w-5 h-5" />,
  mage: <Wand2 className="w-5 h-5" />,
};

export function PlayerStatusModal() {
  const statusModalOpen = useGameStore(state => state.statusModalOpen);
  const toggleStatusModal = useGameStore(state => state.toggleStatusModal);
  
  // Stats
  const playerName = useGameStore(state => state.playerName);
  const characterClass = useGameStore(state => state.characterClass);
  const level = useGameStore(state => state.level);
  const hp = useGameStore(state => state.hp);
  const maxHp = useGameStore(state => state.maxHp);
  const attackPower = useGameStore(state => state.attackPower);
  const defense = useGameStore(state => state.defense);
  const speed = useGameStore(state => state.speed);
  const exp = useGameStore(state => state.exp);
  const expToNext = useGameStore(state => state.expToNext);
  const floor = useGameStore(state => state.floor);
  const eventCount = useGameStore(state => state.eventCount);
  const eventsPerFloor = useGameStore(state => state.eventsPerFloor);
  const potions = useGameStore(state => state.potions);
  const maxPotions = useGameStore(state => state.maxPotions);
  const specialSkillCooldown = useGameStore(state => state.specialSkillCooldown);
  const wordsCount = useGameStore(state => state.words.length);
  
  const classData = CHARACTER_CLASSES[characterClass];
  const critChance = Math.round(speed); // 속도 = 크리티컬 확률 %

  const returnFocus=useRef<HTMLElement|null>(null);
  return <Dialog.Root open={statusModalOpen} onOpenChange={open=>{if(!open&&useGameStore.getState().statusModalOpen)toggleStatusModal();}}>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 bg-black/50 z-50"/>
      <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md max-h-[90dvh] overflow-y-auto bg-background border border-border rounded-xl z-50"
        onOpenAutoFocus={()=>{returnFocus.current=document.activeElement as HTMLElement;}}
        onCloseAutoFocus={event=>{event.preventDefault();if(returnFocus.current?.isConnected)returnFocus.current.focus();}}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
              <Dialog.Title className="text-lg font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                내 상태
              </Dialog.Title>
              <Dialog.Description className="sr-only">현재 직업과 체력, 전투 능력, 보유 포션과 단어를 확인합니다.</Dialog.Description>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={toggleStatusModal}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">닫기</span>
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              
              {/* Row 1: Level & Floor (Profile) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    {CLASS_ICONS[characterClass]}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-0.5">{classData.name}</p>
                    <p className="text-xl font-bold">{playerName}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-right">
                  <div>
                    <p className="text-xs text-muted-foreground">레벨</p>
                    <p className="text-xl font-bold text-primary">Lv.{level}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">현재 층</p>
                    <p className="text-xl font-bold">{floor}F</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Row 2: HP Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                      <Heart className="w-3.5 h-3.5" /> 체력
                    </span>
                    <span className="font-mono text-xs">{hp} / {maxHp}</span>
                  </div>
                  <Progress value={(hp / maxHp) * 100} className="h-2.5 bg-muted" />
                </div>

                {/* Row 3: EXP Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                      <Activity className="w-3.5 h-3.5" /> 경험치
                    </span>
                    <span className="font-mono text-xs">{exp} / {expToNext}</span>
                  </div>
                  <Progress value={(exp / expToNext) * 100} className="h-2.5 bg-muted" />
                </div>
              </div>

              {/* Row 4: Combat Stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2 bg-muted/30 rounded-lg border border-border flex flex-col items-center justify-center gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sword className="w-3 h-3" /> 공격
                  </span>
                  <span className="text-lg font-bold">{attackPower}</span>
                </div>
                <div className="p-2 bg-muted/30 rounded-lg border border-border flex flex-col items-center justify-center gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldIcon className="w-3 h-3" /> 방어
                  </span>
                  <span className="text-lg font-bold">{defense}</span>
                </div>
                <div className="p-2 bg-muted/30 rounded-lg border border-border flex flex-col items-center justify-center gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3" /> 속도
                  </span>
                  <span className="text-lg font-bold">{speed}</span>
                </div>
                <div className="p-2 bg-muted/30 rounded-lg border border-border flex flex-col items-center justify-center gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    치명타
                  </span>
                  <span className="text-lg font-bold">{critChance}%</span>
                </div>
              </div>
              
              {/* Row 4.5: Special Skill */}
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{classData.specialSkill.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {specialSkillCooldown > 0 ? `쿨다운: ${specialSkillCooldown}턴` : '사용 가능'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{classData.specialSkill.description}</p>
              </div>

              {/* Row 5: Event Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-muted-foreground">이벤트 진행도</span>
                  <span className="font-mono text-xs">{eventCount} / {eventsPerFloor}</span>
                </div>
                <div className="flex gap-1 h-2">
                  {Array.from({ length: eventsPerFloor }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-full ${i < eventCount ? 'bg-primary' : 'bg-muted'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Row 6: Inventory Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="p-2 bg-primary/10 rounded-md text-primary">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">보유 포션</p>
                    <p className="font-bold">{potions}/{maxPotions}개</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="p-2 bg-primary/10 rounded-md text-primary">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">수집 단어</p>
                    <p className="font-bold">{wordsCount}개</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/10">
              <Button className="w-full" onClick={toggleStatusModal}>
                닫기
              </Button>
            </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
