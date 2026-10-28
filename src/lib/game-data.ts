// 게임 데이터 정의

// ============================================
// 캐릭터 클래스 시스템
// ============================================

export type CharacterClassId = 'knight' | 'archer' | 'mage';
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface CharacterClass {
  id: CharacterClassId;
  name: string;
  description: string;
  difficulty: Difficulty;
  baseStats: {
    hp: number;
    attackPower: number;
    defense: number;
    speed: number;
  };
  maxPotions: number;
  specialSkill: {
    name: string;
    description: string;
    cooldown: number; // 턴 수
  };
}

export const CHARACTER_CLASSES: Record<CharacterClassId, CharacterClass> = {
  knight: {
    id: 'knight',
    name: '기사',
    description: '높은 체력과 방어력으로 안정적인 전투를 펼칩니다.',
    difficulty: 'easy',
    baseStats: {
      hp: 120,
      attackPower: 12,
      defense: 8,
      speed: 8,
    },
    maxPotions: 5,
    specialSkill: {
      name: '철벽 방어',
      description: '다음 턴 받는 피해 50% 감소',
      cooldown: 4,
    },
  },
  archer: {
    id: 'archer',
    name: '궁수',
    description: '빠른 속도로 적보다 먼저 행동합니다.',
    difficulty: 'normal',
    baseStats: {
      hp: 100,
      attackPower: 10,
      defense: 5,
      speed: 12,
    },
    maxPotions: 4,
    specialSkill: {
      name: '연속 사격',
      description: '2회 연속 공격',
      cooldown: 3,
    },
  },
  mage: {
    id: 'mage',
    name: '마법사',
    description: '강력한 공격력으로 적을 압도합니다.',
    difficulty: 'hard',
    baseStats: {
      hp: 80,
      attackPower: 15,
      defense: 3,
      speed: 10,
    },
    maxPotions: 3,
    specialSkill: {
      name: '마력 폭발',
      description: '공격력 200%의 강력한 일격',
      cooldown: 5,
    },
  },
};

// 난이도 표시 텍스트
export const DIFFICULTY_TEXT: Record<Difficulty, string> = {
  easy: '쉬움',
  normal: '보통',
  hard: '어려움',
};

// ============================================
// 단어 데이터
// ============================================

export const ADJECTIVES = [
  '날카로운', '무거운', '빠른', '강력한',
  '불타는', '얼어붙은', '번개치는', '독이 묻은',
  '축복받은', '저주받은', '투명한', '거대한',
  '정밀한', '관통하는'
];

export const VERBS = [
  '베기', '찌르기', '내려치기', '후려치기',
  '휘두르기', '쏘기', '던지기', '돌진하기',
  '회전베기', '연타하기'
];

// 층별 적 데이터
export const ENEMIES_BY_FLOOR = {
  tier1: [ // 1-3층
    { name: '그림자 생쥐', maxHp: 30, attack: 8 },
    { name: '잊혀진 페이지', maxHp: 40, attack: 10 },
    { name: '지워진 글자', maxHp: 35, attack: 9 }
  ],
  tier2: [ // 4-6층
    { name: '무너진 문장', maxHp: 60, attack: 12 },
    { name: '뒤틀린 단락', maxHp: 70, attack: 14 },
    { name: '혼돈의 챕터', maxHp: 65, attack: 13 }
  ],
  tier3: [ // 7-9층
    { name: '잃어버린 에피소드', maxHp: 90, attack: 16 },
    { name: '삭제된 원고', maxHp: 100, attack: 18 },
    { name: '사라진 목차', maxHp: 85, attack: 17 }
  ]
};

// 보스 데이터 (5층마다 등장)
export const BOSSES = {
  floor5: {
    name: '도서관의 수호자',
    maxHp: 200,
    attack: 20,
    isBoss: true
  },
  floor10: {
    name: '망각의 서기관',
    maxHp: 350,
    attack: 25,
    isBoss: true
  },
  floor15: {
    name: '침묵의 편집자',
    maxHp: 500,
    attack: 30,
    isBoss: true
  }
};

// 중간보스 데이터 (각 층 마지막 이벤트에 등장)
export const MINI_BOSSES_BY_FLOOR = {
  tier1: [ // 1-3층
    { name: '잉크 덩어리', maxHp: 60, attack: 12, isBoss: false, isMiniBoss: true },
    { name: '흐릿한 문단', maxHp: 55, attack: 14, isBoss: false, isMiniBoss: true },
  ],
  tier2: [ // 4-6층
    { name: '뒤틀린 색인', maxHp: 100, attack: 18, isBoss: false, isMiniBoss: true },
    { name: '변질된 주석', maxHp: 95, attack: 20, isBoss: false, isMiniBoss: true },
  ],
  tier3: [ // 7-9층
    { name: '삭제된 저자', maxHp: 150, attack: 24, isBoss: false, isMiniBoss: true },
    { name: '잊혀진 서문', maxHp: 140, attack: 26, isBoss: false, isMiniBoss: true },
  ]
};

// 적 스케일링 함수
export function getScaledEnemy(baseEnemy: { name: string; maxHp: number; attack: number }, floor: number) {
  const scaleFactor = 1 + (floor - 1) * 0.15;
  return {
    ...baseEnemy,
    maxHp: Math.floor(baseEnemy.maxHp * scaleFactor),
    attack: Math.floor(baseEnemy.attack * scaleFactor),
  };
}

// 층에 따른 티어 결정
function getTierForFloor(floor: number): 'tier1' | 'tier2' | 'tier3' {
  if (floor <= 3) return 'tier1';
  if (floor <= 6) return 'tier2';
  return 'tier3';
}

// 층에 맞는 적 선택
export function getEnemyForFloor(floor: number) {
  const tier = getTierForFloor(floor);
  const enemyPool = ENEMIES_BY_FLOOR[tier];

  const baseEnemy = enemyPool[Math.floor(Math.random() * enemyPool.length)];
  return getScaledEnemy(baseEnemy, floor);
}

// 엘리트 몬스터 생성 (20% 확률, 스탯 1.5배, 보상 2배)
export function getEliteEnemy(floor: number) {
  const baseEnemy = getEnemyForFloor(floor);
  return {
    ...baseEnemy,
    name: `★ ${baseEnemy.name}`,
    maxHp: Math.floor(baseEnemy.maxHp * 1.5),
    attack: Math.floor(baseEnemy.attack * 1.3),
    isElite: true,
  };
}

// 중간보스 선택 (층 마지막 이벤트)
export function getMiniBossForFloor(floor: number) {
  const tier = getTierForFloor(floor);
  const bossPool = MINI_BOSSES_BY_FLOOR[tier];
  const baseBoss = bossPool[Math.floor(Math.random() * bossPool.length)];
  return getScaledEnemy(baseBoss, floor);
}

// 보스 선택
export function getBossForFloor(floor: number) {
  if (floor === 5) return BOSSES.floor5;
  if (floor === 10) return BOSSES.floor10;
  if (floor === 15) return BOSSES.floor15;

  // 15층 이후는 15층 보스를 스케일링
  return getScaledEnemy(BOSSES.floor15, floor);
}
