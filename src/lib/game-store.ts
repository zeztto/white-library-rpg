import { create } from 'zustand';
import { SaveManager } from './save-manager';
import { 
  CharacterClassId, 
  CHARACTER_CLASSES, 
  getEnemyForFloor, 
  getEliteEnemy, 
  getMiniBossForFloor,
  getBossForFloor,
  ADJECTIVES,
  VERBS
} from './game-data';

// Types
export type WordType = 'adjective' | 'verb';

export interface Word {
  id: string;
  text: string;
  type: WordType;
  power?: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  equipped: boolean;
  effect?: string;
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  speed: number;
  isBoss?: boolean;
  isMiniBoss?: boolean;
  isElite?: boolean;
}

export interface LogEntry {
  id: string;
  text: string;
  timestamp: number;
  type: 'narrative' | 'combat' | 'system' | 'important';
}

export type RoomType = 'peaceful' | 'broken_shelf' | 'mysterious' | 'boss' | 'safe_house';

export interface GameState {
  storageMessage: string | null;
  // Player stats
  playerName: string;
  characterClass: CharacterClassId;
  level: number;
  exp: number;
  expToNext: number;
  hp: number;
  maxHp: number;
  attackPower: number;
  defense: number;
  speed: number;

  // Class-specific
  maxPotions: number; // 클래스별 포션 보유 한도
  specialSkillCooldown: number; // 특수 스킬 쿨다운 (0이면 사용 가능)
  isDefenseBuffActive: boolean; // 기사 철벽 방어 버프

  // Progress
  floor: number;
  completedFloors: number;
  eventCount: number; // Current event count in this floor (0-9)
  eventsPerFloor: number; // Events needed to advance floor (default: 10)

  // Inventory
  words: Word[];
  items: Item[];
  potions: number; // HP potions (heals 30 HP)
  gold: number;

  // Combat
  inCombat: boolean;
  currentEnemy: Enemy | null;
  playerTurn: boolean;

  // UI
  narrativeLog: LogEntry[];
  inventoryOpen: boolean;
  statusModalOpen: boolean;

  // Game state
  isDead: boolean;
  completedSentences: string[];

  // Save management
  currentSaveSlot: number; // 0 = not saved, 1-3 = slot number
  isInGame: boolean; // false = title screen, true = in game
  isSelectingClass: boolean; // 캐릭터 선택 화면

  // Internal counter for unique IDs
  _logCounter: number;
}

export interface GameActions {
  // Player actions
  takeDamage: (damage: number) => void;
  heal: (amount: number) => void;
  gainExp: (amount: number) => void;
  levelUp: () => void;

  // Combat actions
  startCombat: (enemy: Enemy) => void;
  endCombat: (victory: boolean) => void;
  attack: (skill?: { adjective: Word; verb: Word }) => void;
  enemyAttack: () => void;
  useSpecialSkill: () => void; // 클래스 특수 스킬

  // Exploration
  enterRoom: (roomType: RoomType) => void;
  nextFloor: () => void;
  advanceEvent: () => void; // Increment event count, advance floor if needed
  explore: () => void; // 탐색 액션 (적/이벤트 생성)

  // Inventory
  addWord: (word: Word) => void;
  removeWord: (wordId: string) => void;
  addItem: (item: Item) => void;
  equipItem: (itemId: string) => void;
  toggleInventory: () => void;
  addPotion: (count?: number) => void;
  usePotion: () => void;

  // UI
  toggleStatusModal: () => void;

  // Combat - defend
  defend: () => void;

  // Log
  addLog: (text: string, type?: LogEntry['type']) => void;
  clearLog: () => void;

  // Game state
  resetGame: () => void;
  saveGame: () => void;
  startNewGame: (slotId: number, characterClass: CharacterClassId) => void;
  loadGame: (slotId: number) => void;
  autoSave: () => void;
  returnToTitle: () => void;
  startCharacterSelect: (slotId: number) => void; // 캐릭터 선택 화면으로
  cancelCharacterSelect: () => void; // 캐릭터 선택 취소
}

const initialState: GameState = {
  storageMessage: null,
  playerName: '기록자',
  characterClass: 'knight',
  level: 1,
  exp: 0,
  expToNext: 100,
  hp: 100,
  maxHp: 100,
  attackPower: 10,
  defense: 5,
  speed: 10,

  maxPotions: 5,
  specialSkillCooldown: 0,
  isDefenseBuffActive: false,

  floor: 1,
  completedFloors: 0,
  eventCount: 0,
  eventsPerFloor: 10,

  words: [],
  items: [],
  potions: 2, // Start with 2 potions
  gold: 0,

  inCombat: false,
  currentEnemy: null,
  playerTurn: true,

  narrativeLog: [
    {
      id: 'init-0',
      text: '세상의 모든 색과 글자가 증발한 날, 당신은 백색의 서고 앞에 섰습니다.',
      timestamp: Date.now(),
      type: 'narrative'
    },
    {
      id: 'init-1',
      text: '빈 책을 든 기록자로서, 지워진 단어들을 되찾아야 합니다.',
      timestamp: Date.now() + 1,
      type: 'narrative'
    }
  ],
  inventoryOpen: false,
  statusModalOpen: false,

  isDead: false,
  completedSentences: [],

  currentSaveSlot: 0,
  isInGame: false,
  isSelectingClass: false,

  _logCounter: 2
};

let sessionGeneration = 0;
// A memory-only session never gains a slot lease merely because reads recover.
let sessionWriteBlocked = true;
const sessionWriteMessage = '이 여정은 저장하지 않는 모드입니다. 슬롯 접근이 회복돼도 덮어쓰지 않습니다. 타이틀에서 저장을 다시 확인해 주세요.';
let selectedSlotRevision: {id:number;raw:string|null|undefined}|null = null;
const pendingTimers = new Set<ReturnType<typeof setTimeout>>();
function invalidateDelayedActions() {
  sessionGeneration++;
  for (const timer of pendingTimers) clearTimeout(timer);
  pendingTimers.clear();
}
function schedule(callback: () => void, delay: number) {
  const generation = sessionGeneration;
  const timer = setTimeout(() => {
    pendingTimers.delete(timer);
    if (generation === sessionGeneration) callback();
  }, delay);
  pendingTimers.add(timer);
}

export const useGameStore = create<GameState & GameActions>()(
  (set, get) => ({
      ...initialState,
      
      takeDamage: (damage) => set((state) => {
        const newHp = Math.max(0, state.hp - damage);
        const isDead = newHp === 0;
        return { 
          hp: newHp,
          isDead
        };
      }),
      
      heal: (amount) => set((state) => ({
        hp: Math.min(state.maxHp, state.hp + amount)
      })),
      
      gainExp: (amount) => set((state) => {
        const newExp = state.exp + amount;
        if (newExp >= state.expToNext) {
          const newLevel = state.level + 1;
          get().addLog(`**레벨 업!** Lv.${newLevel}에 도달했습니다!`, 'important');
          return {
            exp: newExp - state.expToNext,
            level: newLevel,
            expToNext: Math.floor(state.expToNext * 1.5),
            maxHp: state.maxHp + 20,
            hp: state.hp + 20, // 레벨업 시 체력도 20 증가
            attackPower: state.attackPower + 3,
            defense: state.defense + 2,
            speed: state.speed + 1
          };
        }
        return { exp: newExp };
      }),
      
      levelUp: () => set((state) => ({
        level: state.level + 1,
        maxHp: state.maxHp + 20,
        hp: state.maxHp + 20,
        attackPower: state.attackPower + 3,
        defense: state.defense + 2,
        speed: state.speed + 1
      })),
      
      startCombat: (enemy) => {
        invalidateDelayedActions();
        const playerSpeed = get().speed;
        const playerTurn = playerSpeed >= enemy.speed;

        set({
          inCombat: true,
          currentEnemy: enemy,
          playerTurn
        });
        get().addLog(`**${enemy.name}**가 나타났습니다!`, 'combat');

        // 적이 선공이면 1초 후 적 공격 시작
        if (!playerTurn) {
          schedule(() => {
            get().enemyAttack();
          }, 1000);
        }
      },
      
      endCombat: (victory) => {
        invalidateDelayedActions();
        const state = get();
        if (victory && state.currentEnemy) {
          // 엘리트/보스/중간보스 보상 배율
          let rewardMultiplier = 1;
          if (state.currentEnemy.isElite) rewardMultiplier = 2;
          if (state.currentEnemy.isMiniBoss) rewardMultiplier = 1.5;
          if (state.currentEnemy.isBoss) rewardMultiplier = 3;

          const expGain = Math.floor(state.currentEnemy.maxHp * 2 * rewardMultiplier);
          get().gainExp(expGain);
          get().addLog(`전투에서 승리했습니다! 경험치 ${expGain}를 획득했습니다.`, 'system');
          
          // 포션 드롭 확률: 일반 20%, 엘리트 50%, 보스류 100%
          let potionDropChance = 0.2;
          if (state.currentEnemy.isElite) potionDropChance = 0.5;
          if (state.currentEnemy.isMiniBoss || state.currentEnemy.isBoss) potionDropChance = 1.0;

          if (Math.random() < potionDropChance) {
            get().addPotion(1);
            get().addLog('적이 **포션**을 떨어뜨렸습니다!', 'important');
          }
          
          // 전투 승리 후 이벤트 진행
          get().advanceEvent();
        } else if (!victory) {
          get().addLog('전투에서 패배했습니다...', 'system');
        }
        set({
          inCombat: false,
          currentEnemy: null,
          playerTurn: true,
          isDefenseBuffActive: false, // 전투 종료 시 버프 해제
        });
        if (victory) get().autoSave();
      },
      
      attack: (skill) => {
        const state = get();

        // 전투 상태 확인
        if (!state.inCombat || !state.currentEnemy) {
          return;
        }

        if (!state.playerTurn) {
          return;
        }

        if (skill && (!skill.adjective.text.trim() || !skill.verb.text.trim()
          || skill.adjective.type !== 'adjective' || skill.verb.type !== 'verb')) return;
        // 플레이어 턴을 먼저 false로 설정하여 중복 클릭 방지
        set({ playerTurn: false });

        // 쿨다운 감소
        if (state.specialSkillCooldown > 0) {
          set({ specialSkillCooldown: state.specialSkillCooldown - 1 });
        }

        let damage = state.attackPower;
        let skillText = '공격';

        if (skill) {
          // 단어 파워를 사용한 데미지 계산
          // 기본 1.5배 + 단어 파워에 따른 추가 배율
          const adjPower = skill.adjective.power || 10;
          const verbPower = skill.verb.power || 10;
          const powerBonus = (adjPower + verbPower) / 50; // 20 power = 0.4 bonus
          damage = Math.floor(state.attackPower * (1.5 + powerBonus));
          skillText = `**[${skill.adjective.text} ${skill.verb.text}]**`;
          const bonusPercent = Math.round(powerBonus * 100);
          get().addLog(`당신은 ${skillText}을(를) 시전했습니다! (+${bonusPercent}% 파워)`, 'combat');
        }

        // 크리티컬 시스템: 속도/100 = 크리티컬 확률
        const critChance = state.speed / 100;
        const isCritical = Math.random() < critChance;
        if (isCritical) {
          damage = Math.floor(damage * 1.5);
          get().addLog('**치명타!**', 'important');
        }

        const enemy = state.currentEnemy;
        const newEnemyHp = Math.max(0, enemy.hp - damage);

        get().addLog(`${enemy.name}에게 ${damage}의 피해를 입혔습니다.`, 'combat');

        if (newEnemyHp === 0) {
          set({ currentEnemy: { ...enemy, hp: newEnemyHp } });
          get().endCombat(true);
        } else {
          set({
            currentEnemy: { ...enemy, hp: newEnemyHp }
          });

          // Enemy attacks after a delay
          schedule(() => {
            const currentState = get();
            if (currentState.inCombat && currentState.currentEnemy && !currentState.isDead) {
              get().enemyAttack();
            }
          }, 1000);
        }
        get().autoSave();
      },
      
      enemyAttack: () => {
        const state = get();

        // 전투 상태가 아니거나 사망 상태면 종료
        if (!state.inCombat || !state.currentEnemy || state.isDead) {
          return;
        }

        // 이미 플레이어 턴이면 종료 (중복 호출 방지)
        if (state.playerTurn) {
          return;
        }

        let damage = Math.max(1, state.currentEnemy.attack - state.defense);
        
        // 기사 철벽 방어 버프 적용
        if (state.isDefenseBuffActive) {
          damage = Math.floor(damage * 0.5);
          get().addLog('철벽 방어로 피해가 감소했습니다!', 'combat');
          set({ isDefenseBuffActive: false }); // 버프 소모
        }

        get().takeDamage(damage);
        get().addLog(`${state.currentEnemy.name}의 공격! ${damage}의 피해를 받았습니다.`, 'combat');

        // 피해를 받은 후 사망 여부 체크
        const newState = get();
        if (newState.isDead) {
          get().addLog('**당신은 쓰러졌습니다...** 모든 것이 백색으로 물들어갑니다.', 'important');
          set({ inCombat: false, currentEnemy: null, playerTurn: true });
          get().autoSave();
          return;
        }

        set({ playerTurn: true });
        get().autoSave();
      },

      defend: () => {
        const state = get();

        // 전투 상태 확인
        if (!state.inCombat || !state.currentEnemy) {
          return;
        }

        if (!state.playerTurn) {
          return;
        }

        // 플레이어 턴을 먼저 false로 설정하여 중복 클릭 방지
        set({ playerTurn: false });

        // 방어 자세: 15 HP 회복
        const healAmount = 15;
        get().heal(healAmount);
        get().addLog(`방어 자세를 취하며 ${healAmount}의 체력을 회복했습니다.`, 'combat');

        // 쿨다운 감소
        if (state.specialSkillCooldown > 0) {
          set((s) => ({ specialSkillCooldown: s.specialSkillCooldown - 1 }));
        }

        // 적 공격 1초 후 실행
        schedule(() => {
          const currentState = get();
          if (currentState.inCombat && currentState.currentEnemy && !currentState.isDead) {
            get().enemyAttack();
          }
        }, 1000);
        get().autoSave();
      },

      useSpecialSkill: () => {
        const state = get();

        // 전투 상태 확인
        if (!state.inCombat || !state.currentEnemy) {
          return;
        }

        if (!state.playerTurn) {
          return;
        }

        if (state.specialSkillCooldown > 0) {
          get().addLog(`스킬 쿨다운 중입니다. (${state.specialSkillCooldown}턴 남음)`, 'system');
          return;
        }

        const classData = CHARACTER_CLASSES[state.characterClass];

        // 플레이어 턴을 먼저 false로 설정하여 중복 클릭 방지
        set({ playerTurn: false });

        // 쿨다운 설정
        set({ specialSkillCooldown: classData.specialSkill.cooldown });

        get().addLog(`**[${classData.specialSkill.name}]** 발동!`, 'important');

        switch (state.characterClass) {
          case 'knight': {
            // 철벽 방어: 다음 턴 받는 피해 50% 감소
            set({ isDefenseBuffActive: true });
            get().addLog('다음 적의 공격 피해가 50% 감소합니다.', 'combat');
            // 적 공격으로 턴 넘김
            schedule(() => {
              const currentState = get();
              if (currentState.inCombat && currentState.currentEnemy && !currentState.isDead) {
                get().enemyAttack();
              }
            }, 1000);
            break;
          }
          case 'archer': {
            // 연속 사격: 2회 연속 공격
            const enemy = state.currentEnemy;
            const damage1 = state.attackPower;
            const damage2 = state.attackPower;
            let totalDamage = damage1 + damage2;

            // 크리티컬 체크 (각 타격마다)
            const critChance = state.speed / 100;
            let critCount = 0;
            if (Math.random() < critChance) { totalDamage += Math.floor(damage1 * 0.5); critCount++; }
            if (Math.random() < critChance) { totalDamage += Math.floor(damage2 * 0.5); critCount++; }
            
            if (critCount > 0) {
              get().addLog(`**치명타 ${critCount}회!**`, 'important');
            }

            const newEnemyHp = Math.max(0, enemy.hp - totalDamage);
            get().addLog(`${enemy.name}에게 ${totalDamage}의 피해를 입혔습니다. (2연타)`, 'combat');

            if (newEnemyHp === 0) {
              set({ currentEnemy: { ...enemy, hp: newEnemyHp } });
              get().endCombat(true);
            } else {
              set({ currentEnemy: { ...enemy, hp: newEnemyHp } });
              schedule(() => {
                const currentState = get();
                if (currentState.inCombat && currentState.currentEnemy && !currentState.isDead) {
                  get().enemyAttack();
                }
              }, 1000);
            }
            break;
          }
          case 'mage': {
            // 마력 폭발: 공격력 200%의 강력한 일격
            const enemy = state.currentEnemy;
            let damage = Math.floor(state.attackPower * 2);

            // 크리티컬 체크
            const critChance = state.speed / 100;
            if (Math.random() < critChance) {
              damage = Math.floor(damage * 1.5);
              get().addLog('**치명타!**', 'important');
            }

            const newEnemyHp = Math.max(0, enemy.hp - damage);
            get().addLog(`${enemy.name}에게 ${damage}의 피해를 입혔습니다.`, 'combat');

            if (newEnemyHp === 0) {
              set({ currentEnemy: { ...enemy, hp: newEnemyHp } });
              get().endCombat(true);
            } else {
              set({ currentEnemy: { ...enemy, hp: newEnemyHp } });
              schedule(() => {
                const currentState = get();
                if (currentState.inCombat && currentState.currentEnemy && !currentState.isDead) {
                  get().enemyAttack();
                }
              }, 1000);
            }
            break;
          }
        }
        get().autoSave();
      },

      explore: () => {
        const state = get();
        if (!state.isInGame || state.isDead || state.inCombat) return;
        const { floor, eventCount, eventsPerFloor } = state;

        // 마지막 이벤트 체크 (9번째 = 인덱스 9 = 10번째 이벤트)
        const isLastEvent = eventCount === eventsPerFloor - 1;
        // 5층마다 보스
        const isBossFloor = floor % 5 === 0 && isLastEvent;

        if (isBossFloor) {
          // 보스 등장
          const bossData = getBossForFloor(floor);
          const boss: Enemy = {
            id: `boss-${Date.now()}`,
            name: bossData.name,
            hp: bossData.maxHp,
            maxHp: bossData.maxHp,
            attack: bossData.attack,
            speed: 5,
            isBoss: true,
          };
          get().addLog(`**[보스]** ${boss.name}가 앞을 가로막습니다!`, 'important');
          get().startCombat(boss);
          get().autoSave();
          return;
        }

        if (isLastEvent) {
          // 중간보스 등장
          const miniBossData = getMiniBossForFloor(floor);
          const miniBoss: Enemy = {
            id: `miniboss-${Date.now()}`,
            name: miniBossData.name,
            hp: miniBossData.maxHp,
            maxHp: miniBossData.maxHp,
            attack: miniBossData.attack,
            speed: 7,
            isMiniBoss: true,
          };
          get().addLog(`**[중간보스]** ${miniBoss.name}가 나타났습니다!`, 'important');
          get().startCombat(miniBoss);
          get().autoSave();
          return;
        }

        // 일반 탐색 - 확률 기반 이벤트
        const roll = Math.random();
        
        if (roll < 0.25) {
          // 평온 (25%) - 휴식
          get().enterRoom('peaceful');
          const healAmount = Math.floor(state.maxHp * 0.1);
          get().heal(healAmount);
          get().addLog(`잠시 휴식을 취해 ${healAmount}의 체력을 회복했습니다.`, 'system');
          get().advanceEvent();
        } else if (roll < 0.40) {
          // 안전가옥 (15%) - 50% 체력 회복 + 포션
          get().enterRoom('safe_house');
          const healAmount = Math.floor(state.maxHp * 0.5);
          get().heal(healAmount);
          get().addPotion(1);
          get().addLog(`안전 가옥에서 ${healAmount}의 체력을 회복하고 포션을 얻었습니다.`, 'important');
          get().advanceEvent();
        } else if (roll < 0.60) {
          // 단어 발견 (20%)
          get().enterRoom('broken_shelf');
          
          // 형용사 60%, 동사 40% 확률
          const isAdjective = Math.random() < 0.6;
          const wordText = isAdjective
            ? ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
            : VERBS[Math.floor(Math.random() * VERBS.length)];

          const newWord: Word = {
            id: `word-${Date.now()}-${get()._logCounter}`,
            text: wordText,
            type: isAdjective ? 'adjective' : 'verb',
            power: Math.floor(Math.random() * 10) + 5
          };
          get().addWord(newWord);
          get().addLog(`**[${newWord.text}]** 단어를 발견했습니다!`, 'important');
          get().advanceEvent();
          get().autoSave();
        } else {
          // 적 조우 (40%)
          const isElite = Math.random() < 0.2; // 20% 엘리트
          
          let enemyData;
          if (isElite) {
            enemyData = getEliteEnemy(floor);
            get().addLog('**[엘리트]** 강력한 적이 나타났습니다!', 'important');
          } else {
            enemyData = getEnemyForFloor(floor);
          }

          const enemy: Enemy = {
            id: `enemy-${Date.now()}`,
            name: enemyData.name,
            hp: enemyData.maxHp,
            maxHp: enemyData.maxHp,
            attack: enemyData.attack,
            speed: 8,
            isElite: isElite,
          };
          get().startCombat(enemy);
        }
        get().autoSave();
      },
      
      enterRoom: (roomType) => {
        const messages = {
          peaceful: '평온한 복도에 들어섰습니다. 잠시 휴식을 취할 수 있습니다.',
          broken_shelf: '무너진 서가를 발견했습니다. 유실된 단어의 흔적이 보입니다.',
          mysterious: '미지의 구역... 무언가 당신을 지켜보고 있습니다.',
          boss: '심연의 문장이 당신을 기다리고 있습니다.',
          safe_house: '안전 가옥을 발견했습니다. 휴식하며 다음 탐색을 준비합니다.'
        };
        
        get().addLog(messages[roomType] || '새로운 구역에 진입했습니다.', 'narrative');
      },
      
      nextFloor: () => {
        const state = get();
        get().addLog(`**${state.floor + 1}층**으로 이동합니다.`, 'important');
        set({
          floor: state.floor + 1,
          completedFloors: state.completedFloors + 1,
          eventCount: 0
        });
      },

      advanceEvent: () => {
        const state = get();
        const newEventCount = state.eventCount + 1;
        
        if (newEventCount >= state.eventsPerFloor) {
          // Floor complete - advance to next floor
          get().nextFloor();
        } else {
          set({ eventCount: newEventCount });
        }
      },
      
      addWord: (word) => {
        if (!word.text.trim()) return;
        set((state) => ({ words: [...state.words, word] }));
      },
      
      removeWord: (wordId) => set((state) => ({
        words: state.words.filter(w => w.id !== wordId)
      })),
      
      addItem: (item) => set((state) => ({
        items: [...state.items, item]
      })),
      
      equipItem: (itemId) => set((state) => ({
        items: state.items.map(item => 
          item.id === itemId 
            ? { ...item, equipped: !item.equipped }
            : { ...item, equipped: false }
        )
      })),
      
      toggleInventory: () => set((state) => ({
        inventoryOpen: !state.inventoryOpen
      })),

      addPotion: (count = 1) => set((state) => {
        const newPotions = Math.min(state.potions + count, state.maxPotions);
        if (newPotions === state.maxPotions && state.potions + count > state.maxPotions) {
          // 포션이 넘치면 알림
          get().addLog(`포션 보유 한도(${state.maxPotions}개)에 도달했습니다.`, 'system');
        }
        return { potions: newPotions };
      }),

      usePotion: () => {
        const state = get();
        if (state.potions <= 0) {
          get().addLog('포션이 없습니다!', 'system');
          return;
        }
        if (state.hp >= state.maxHp) {
          get().addLog('이미 체력이 가득 찼습니다.', 'system');
          return;
        }
        
        const healAmount = 30;
        const actualHeal = Math.min(healAmount, state.maxHp - state.hp);
        
        set({ potions: state.potions - 1 });
        get().heal(actualHeal);
        get().addLog(`포션을 사용하여 ${actualHeal}의 체력을 회복했습니다. (남은 포션: ${state.potions - 1}개)`, 'system');
        get().autoSave();
      },

      toggleStatusModal: () => set((state) => ({
        statusModalOpen: !state.statusModalOpen
      })),
      
      addLog: (text, type = 'narrative') => set((state) => {
        const newEntry = {
          id: `log-${state._logCounter}`,
          text,
          timestamp: Date.now(),
          type
        };

        // 최근 100개 엔트리만 유지 (로그 회전)
        const updatedLog = [...state.narrativeLog, newEntry];
        const trimmedLog = updatedLog.slice(-100);

        return {
          narrativeLog: trimmedLog,
          _logCounter: state._logCounter + 1
        };
      }),
      
      clearLog: () => set({
        narrativeLog: []
      }),
      
      resetGame: () => {
        invalidateDelayedActions();
        selectedSlotRevision = null;
        set({...initialState, narrativeLog: [...initialState.narrativeLog]});
      },
      
      saveGame: () => {
        const state = get();
        if (!state.isInGame) return;
        if (sessionWriteBlocked) { set({storageMessage: sessionWriteMessage}); return; }
        if (state.currentSaveSlot > 0) {
          const result = SaveManager.saveToSlot(state.currentSaveSlot, state);
          set({storageMessage: result.message});
          get().addLog(result.ok ? '게임이 저장되었습니다.' : result.message ?? '저장하지 못했습니다.', 'system');
        }
      },
      autoSave: () => {
        const state = get();
        if (!state.isInGame) return;
        if (sessionWriteBlocked) { set({storageMessage: sessionWriteMessage}); return; }
        if (state.currentSaveSlot > 0) {
          const result = SaveManager.autoSave(state.currentSaveSlot, state);
          set({storageMessage: result.message});
        }
      },

      startCharacterSelect: (slotId) => {
        invalidateDelayedActions();
        selectedSlotRevision = null;
        const slot = SaveManager.readSlot(slotId);
        if (slot.kind === 'corrupt') { set({storageMessage:slot.message}); return; }
        selectedSlotRevision = {id:slotId,raw:slot.kind==='unavailable'?undefined:slot.raw};
        set({
          ...initialState,
          currentSaveSlot: slotId,
          isSelectingClass: true,
          isInGame: false,
        });
      },

      cancelCharacterSelect: () => {
        invalidateDelayedActions();
        selectedSlotRevision = null;
        set({
          ...initialState,
          currentSaveSlot: 0,
          isSelectingClass: false,
          isInGame: false,
        });
      },

      startNewGame: (slotId, characterClass) => {
        invalidateDelayedActions();
        const existing = SaveManager.readSlot(slotId);
        if (existing.kind === 'corrupt') { set({storageMessage: existing.message}); return; }
        if (existing.kind === 'valid' && (selectedSlotRevision?.id!==slotId || selectedSlotRevision.raw!==existing.raw)) {
          set({storageMessage:'슬롯이 바뀌었습니다. 타이틀에서 다시 선택해 주세요.'}); return;
        }
        if (!Number.isInteger(slotId) || slotId < 1 || slotId > 3 || !CHARACTER_CLASSES[characterClass]) return;
        sessionWriteBlocked = existing.kind === 'unavailable';
        selectedSlotRevision = null;
        const classData = CHARACTER_CLASSES[characterClass];
        const { hp, attackPower, defense, speed } = classData.baseStats;
        
        set({
          ...initialState,
          characterClass,
          currentSaveSlot: slotId,
          isInGame: true,
          isSelectingClass: false,
          // 클래스별 스탯 적용
          hp,
          maxHp: hp,
          attackPower,
          defense,
          speed,
          maxPotions: classData.maxPotions,
          potions: 2, // 모든 클래스 2개로 시작
          specialSkillCooldown: 0,
          narrativeLog: [
            {
              id: 'init-0',
              text: '세상의 모든 색과 글자가 증발한 날, 당신은 백색의 서고 앞에 섰습니다.',
              timestamp: Date.now(),
              type: 'narrative'
            },
            {
              id: 'init-1',
              text: `${classData.name}로서의 여정이 시작됩니다. 지워진 단어들을 되찾아야 합니다.`,
              timestamp: Date.now() + 1,
              type: 'narrative'
            }
          ],
          _logCounter: 2
        });
        // 새 게임 시작 시 즉시 저장
        get().autoSave();
      },

      loadGame: (slotId) => {
        invalidateDelayedActions();
        selectedSlotRevision = null;
        const slot = SaveManager.readSlot(slotId);
        if (slot.kind !== 'valid') {
          set({storageMessage: slot.kind === 'empty' ? '빈 슬롯입니다.' : slot.message});
          return;
        }
        sessionWriteBlocked = false;
        const savedState = slot.save.gameState;
        set({...savedState,currentSaveSlot:slotId,isInGame:true,isSelectingClass:false,
          inventoryOpen:false,statusModalOpen:false,storageMessage:null});
        if (savedState.inCombat && !savedState.playerTurn && !savedState.isDead) {
          schedule(() => get().enemyAttack(), 1000);
        }
      },

      returnToTitle: () => {
        if (get().isInGame && get().currentSaveSlot > 0) get().autoSave();
        const storageMessage = get().storageMessage;
        invalidateDelayedActions();
        selectedSlotRevision = null;
        set({
          ...initialState,
          currentSaveSlot: 0,
          isInGame: false,
          storageMessage
        });
      }
    })
);
