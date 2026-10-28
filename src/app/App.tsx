import { MotionConfig } from 'motion/react';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { TitleScreen } from '@/app/components/TitleScreen';
import { CharacterSelectScreen } from '@/app/components/CharacterSelectScreen';
import { GameHeader } from '@/app/components/GameHeader';
import { NarrativeLog } from '@/app/components/NarrativeLog';
import { ActionPanel } from '@/app/components/ActionPanel';
import { CombatStatus } from '@/app/components/CombatStatus';
import { InventoryDrawer } from '@/app/components/InventoryDrawer';
import { PlayerStatusModal } from '@/app/components/PlayerStatusModal';
import { useGameStore } from '@/lib/game-store';

export default function App() {
  const isInGame=useGameStore(state=>state.isInGame);
  const isSelectingClass=useGameStore(state=>state.isSelectingClass);
  const storageMessage=useGameStore(state=>state.storageMessage);
  return <ErrorBoundary><MotionConfig reducedMotion="user">
    {storageMessage&&<p role="alert" className="storage-notice">{storageMessage}</p>}
    {isSelectingClass?<CharacterSelectScreen/>:!isInGame?<TitleScreen/>:
      <div className="game-shell"><GameHeader/><CombatStatus/>
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden" aria-label="탐험 기록"><NarrativeLog/></main>
        <ActionPanel/><InventoryDrawer/><PlayerStatusModal/>
      </div>}
  </MotionConfig></ErrorBoundary>;
}
