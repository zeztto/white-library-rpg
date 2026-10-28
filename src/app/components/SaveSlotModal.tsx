import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useGameStore } from '@/lib/game-store';
import { SaveManager, type SlotRead } from '@/lib/save-manager';
import { Button } from '@/app/components/ui/button';

interface SaveSlotModalProps {mode:'load'|'new';onClose:()=>void}
export function SaveSlotModal({mode,onClose}:SaveSlotModalProps) {
  const [slots,setSlots]=useState(()=>SaveManager.getSlots());
  const [message,setMessage]=useState<string|null>(null);
  const refresh=()=>setSlots(SaveManager.getSlots());
  function select(slot:SlotRead) {
    if (slot.kind==='corrupt') return;
    if (mode==='load') {
      if(slot.kind!=='valid')return;
      useGameStore.getState().loadGame(slot.slotId);
    } else {
      if(slot.kind==='valid'&&!window.confirm(`슬롯 ${slot.slotId}의 기록을 새 여정으로 바꿀까요? 직업을 선택하면 기존 기록을 덮어씁니다.`))return;
      useGameStore.getState().startCharacterSelect(slot.slotId);
    }
    onClose();
  }
  function remove(slot:SlotRead) {
    if(slot.kind==='unavailable'||slot.kind==='empty')return;
    if(!window.confirm(`슬롯 ${slot.slotId}의 저장 기록을 지울까요? 손상된 기록의 원문도 삭제됩니다.`))return;
    const result=SaveManager.deleteSlot(slot.slotId,slot.raw);
    setMessage(result.message);refresh();
  }
  return <Dialog.Root open onOpenChange={open=>{if(!open)onClose();}}>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 bg-black/50 z-50"/>
      <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md max-h-[90dvh] overflow-y-auto bg-background border border-border rounded-xl p-5 z-50">
        <div className="flex items-center justify-between gap-3 mb-3"><Dialog.Title className="text-lg font-semibold">{mode==='load'?'저장된 여정':'새 여정 슬롯'}</Dialog.Title>
          <Dialog.Close asChild><Button variant="ghost" size="sm">닫기</Button></Dialog.Close></div>
        <Dialog.Description className="text-sm text-muted-foreground mb-4">이 브라우저의 세 슬롯입니다. 읽을 수 없는 기록은 직접 지우기 전까지 보존합니다.</Dialog.Description>
        {message&&<p role="alert" className="text-sm text-destructive mb-3">{message}</p>}
        <div className="space-y-3">{slots.map(slot=><section key={slot.slotId} className="border border-border rounded-lg p-4 space-y-2" aria-label={`슬롯 ${slot.slotId}`}>
          <h3 className="font-semibold">슬롯 {slot.slotId}</h3>
          {slot.kind==='valid'?<p className="text-sm">{slot.save.playerName} · 레벨 {slot.save.level} · {slot.save.floor}층 · 체력 {slot.save.hp}/{slot.save.maxHp}</p>
            :<p className="text-sm">{slot.kind==='empty'?'비어 있음':slot.message}</p>}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={()=>select(slot)} disabled={slot.kind==='corrupt'||(mode==='load'&&slot.kind!=='valid')}>
              {mode==='load'?`슬롯 ${slot.slotId} 이어하기`:slot.kind==='unavailable'?`저장 없이 시작`: `슬롯 ${slot.slotId} 새 여정`}</Button>
            {(slot.kind==='valid'||slot.kind==='corrupt')&&<Button size="sm" variant="outline" onClick={()=>remove(slot)} aria-label={`슬롯 ${slot.slotId} 기록 지우기`}>기록 지우기</Button>}
          </div>
        </section>)}</div>
        <Button variant="ghost" className="mt-3" onClick={refresh}>다시 읽기</Button>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
