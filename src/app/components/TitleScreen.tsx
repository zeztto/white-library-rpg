import { useState } from 'react';
import { useGameStore } from '@/lib/game-store';
import { SaveManager } from '@/lib/save-manager';
import { Button } from '@/app/components/ui/button';
import { motion } from 'motion/react';
import { BookOpen, Play, FolderOpen } from 'lucide-react';
import { SaveSlotModal } from './SaveSlotModal';

export function TitleScreen() {
  const startCharacterSelect = useGameStore(state => state.startCharacterSelect);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showNewGameModal, setShowNewGameModal] = useState(false);

  const handleNewGame = () => {
    // 빈 슬롯 찾기
    const emptySlot = SaveManager.findEmptySlot();
    if (emptySlot) {
      // 캐릭터 선택 화면으로 이동
      startCharacterSelect(emptySlot);
    } else {
      // 모든 슬롯이 차있으면 선택 모달 표시
      setShowNewGameModal(true);
    }
  };

  const handleLoadGame = () => {
    setShowLoadModal(true);
  };

  const slots = SaveManager.getSlots();
  const hasSaveData = slots.some(slot=>slot.kind!=='empty');
  const hasStorageProblem = slots.some(slot=>slot.kind==='corrupt'||slot.kind==='unavailable');

  return (
    <>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md text-center space-y-8"
        >
          {/* Title */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex items-center justify-center mb-4"
            >
              <BookOpen className="h-16 w-16 opacity-80" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-5xl font-bold tracking-tight"
            >
              백색 서고
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-sm opacity-60 leading-relaxed"
            >
              세상의 모든 색과 글자가 증발한 날,
              <br />
              당신은 백색의 서고 앞에 섰습니다.
            </motion.p>
          </div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="space-y-3"
          >
            <Button
              onClick={handleNewGame}
              className="w-full h-14 text-lg"
              size="lg"
            >
              <Play className="mr-2 h-5 w-5" />
              새로운 여정
            </Button>

            <Button
              onClick={handleLoadGame}
              disabled={!hasSaveData}
              className="w-full h-14 text-lg"
              variant="outline"
              size="lg"
            >
              <FolderOpen className="mr-2 h-5 w-5" />
              이어하기
            </Button>
          </motion.div>

          {hasStorageProblem && <p role="alert" className="text-sm text-destructive">일부 저장을 읽을 수 없습니다. 이어하기에서 상태를 확인하세요. 기존 기록은 보존합니다.</p>}

          {/* Version */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.8 }}
            className="text-xs text-muted-foreground pt-8"
          >
            v1.0.0
          </motion.p>
        </motion.div>
      </div>

      {/* Load Game Modal */}
      {showLoadModal && (
        <SaveSlotModal
          mode="load"
          onClose={() => setShowLoadModal(false)}
        />
      )}

      {/* New Game Modal (when all slots are full) */}
      {showNewGameModal && (
        <SaveSlotModal
          mode="new"
          onClose={() => setShowNewGameModal(false)}
        />
      )}
    </>
  );
}
