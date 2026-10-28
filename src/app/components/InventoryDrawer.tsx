import { useGameStore } from '@/lib/game-store';
import { Separator } from '@/app/components/ui/separator';
import { Button } from '@/app/components/ui/button';
import { Type, Book, Package, X } from 'lucide-react';
import { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

export function InventoryDrawer() {
  const inventoryOpen = useGameStore(state => state.inventoryOpen);
  const toggleInventory = useGameStore(state => state.toggleInventory);
  const words = useGameStore(state => state.words);
  const items = useGameStore(state => state.items);
  const equipItem = useGameStore(state => state.equipItem);

  const returnFocus=useRef<HTMLElement|null>(null);

  return <Dialog.Root open={inventoryOpen} onOpenChange={open=>{if(!open&&useGameStore.getState().inventoryOpen)toggleInventory();}}>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 bg-black/50 z-50"/>
      <Dialog.Content className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[640px] bg-background border-t border-border rounded-t-xl h-[70dvh] max-h-[600px] overflow-y-auto z-50"
        onOpenAutoFocus={()=>{returnFocus.current=document.activeElement as HTMLElement;}}
        onCloseAutoFocus={event=>{event.preventDefault();if(returnFocus.current?.isConnected)returnFocus.current.focus();}}>
          {/* Header */}
          <div className="flex flex-col gap-1.5 p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <Dialog.Title className="text-lg font-semibold">소지품</Dialog.Title>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={toggleInventory}
                aria-label="소지품 닫기"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Dialog.Description className="text-sm text-muted-foreground">
              수집한 단어와 보유 항목을 확인합니다.
            </Dialog.Description>
          </div>

          {/* Content */}
          <div className="h-[calc(70vh-140px)] max-h-[460px] overflow-y-auto p-4">
          <div className="space-y-6 pb-8">
            {/* Words Section */}
            <div>
              <h3 className="flex items-center gap-2 mb-3 font-bold text-sm opacity-60">
                <Type className="h-4 w-4" />
                수집한 단어
              </h3>
              
              {words.length === 0 ? (
                <p className="text-sm opacity-60 text-center py-8">
                  아직 수집한 단어가 없습니다.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {words.map((word) => (
                    <div
                      key={word.id}
                      className="p-3 border border-border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs px-2 py-0.5 rounded border border-border bg-background">
                          {word.type === 'adjective' ? '형용사' : '동사'}
                        </span>
                        {word.power && (
                          <span className="text-xs font-mono opacity-60">
                            +{word.power}
                          </span>
                        )}
                      </div>
                      <p className="font-bold">{word.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Items Section */}
            <div>
              <h3 className="flex items-center gap-2 mb-3 font-bold text-sm opacity-60">
                <Book className="h-4 w-4" />
                보유 유물
              </h3>
              
              {items.length === 0 ? (
                <p className="text-sm opacity-60 text-center py-8">
                  아직 획득한 유물이 없습니다.
                </p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        item.equipped
                          ? 'border-foreground bg-foreground/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold">{item.name}</h4>
                          {item.equipped && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-foreground text-background">
                              장착 중
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={item.equipped ? 'default' : 'outline'}
                          onClick={() => equipItem(item.id)}
                        >
                          {item.equipped ? '해제' : '장착'}
                        </Button>
                      </div>
                      <p className="text-sm opacity-60 leading-relaxed">
                        {item.description}
                      </p>
                      {item.effect && (
                        <p className="text-sm mt-2 font-mono opacity-80">
                          효과: {item.effect}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
