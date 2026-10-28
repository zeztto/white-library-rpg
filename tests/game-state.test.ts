import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { SaveManager } from '../src/lib/save-manager';
import { createElement, act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Progress } from '../src/app/components/ui/progress';
import { createRoot } from 'react-dom/client';
import App from '../src/app/App';
import { useGameStore, type Enemy, type GameState } from '../src/lib/game-store';

class TestStorage implements Storage {
  values = new Map<string,string>(); denyRead=false; denyWrite=false; writes=0; removes=0;
  get length(){return this.values.size;}
  key(index:number){return [...this.values.keys()][index]??null;}
  getItem(key:string){if(this.denyRead)throw new Error('test read denial');return this.values.get(key)??null;}
  setItem(key:string,value:string){this.writes++;if(this.denyWrite)throw new Error('test write denial');this.values.set(key,String(value));}
  removeItem(key:string){this.removes++;if(this.denyWrite)throw new Error('test delete denial');this.values.delete(key);}
  clear(){this.values.clear();}
}
let storage:TestStorage;
const key=(slot:number)=>`white-library-save-${slot}`;
const enemy:Enemy={id:'test-enemy',name:'회귀용 적',hp:90,maxHp:90,attack:20,speed:100};
const snapshot=()=>JSON.parse(JSON.stringify(useGameStore.getState())) as GameState;
beforeEach(()=>{vi.useFakeTimers();storage=new TestStorage();vi.stubGlobal('localStorage',storage);useGameStore.getState().returnToTitle();vi.spyOn(Math,'random').mockReturnValue(.9);});
afterEach(()=>{useGameStore.getState().returnToTitle();vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();});

describe('slot persistence boundaries',()=>{
 it('keeps malformed JSON bytes and refuses to overwrite them',()=>{storage.setItem(key(1),'{broken');expect(()=>SaveManager.saveToSlot(1,snapshot())).not.toThrow();expect(storage.getItem(key(1))).toBe('{broken');});
 it('never treats malformed shapes or foreign slot identity as valid saves',()=>{storage.setItem(key(1),JSON.stringify({slotId:2,gameState:{hp:-5}}));expect(SaveManager.getAllSaves()).toEqual([]);expect(SaveManager.findEmptySlot()).toBe(2);});
 it('survives denied storage reads and does not write a new game over unreadable storage',()=>{storage.denyRead=true;expect(()=>SaveManager.getAllSaves()).not.toThrow();expect(()=>useGameStore.getState().startNewGame(1,'knight')).not.toThrow();expect(useGameStore.getState().isInGame).toBe(true);});
 it('survives quota failures while keeping the game alive',()=>{storage.denyWrite=true;expect(()=>useGameStore.getState().startNewGame(1,'mage')).not.toThrow();expect(useGameStore.getState().characterClass).toBe('mage');});
 it('roundtrips all three classes and three slots without methods in JSON',()=>{(['knight','archer','mage'] as const).forEach((klass,index)=>{useGameStore.getState().startNewGame(index+1,klass);expect(SaveManager.loadFromSlot(index+1)?.characterClass).toBe(klass);});expect(SaveManager.getAllSaves()).toHaveLength(3);});
 it('blocks a slot that becomes corrupt after a successful game start',()=>{useGameStore.getState().startNewGame(1,'knight');storage.setItem(key(1),'later-corruption');useGameStore.getState().saveGame();expect(storage.getItem(key(1))).toBe('later-corruption');});
 it('rejects whitespace words before using a turn',()=>{useGameStore.getState().startNewGame(1,'knight');useGameStore.getState().startCombat({...enemy,speed:1});const hp=useGameStore.getState().currentEnemy?.hp;useGameStore.getState().attack({adjective:{id:'empty',text:'  ',type:'adjective'},verb:{id:'v',text:'베기',type:'verb'}});expect(useGameStore.getState().playerTurn).toBe(true);expect(useGameStore.getState().currentEnemy?.hp).toBe(hp);});
});

describe('delayed combat and transitions',()=>{
 it('does not apply an old enemy callback to another save slot',()=>{useGameStore.getState().startNewGame(1,'knight');useGameStore.getState().startCombat(enemy);vi.advanceTimersByTime(500);useGameStore.getState().startNewGame(2,'mage');useGameStore.getState().startCombat({...enemy,id:'slot-two'});const hp=useGameStore.getState().hp;vi.advanceTimersByTime(500);expect(useGameStore.getState().hp).toBe(hp);vi.advanceTimersByTime(500);expect(useGameStore.getState().hp).toBeLessThan(hp);});
 it('invalidates an older player-turn callback after starting another combat',()=>{useGameStore.getState().startNewGame(1,'knight');useGameStore.getState().startCombat(enemy);vi.advanceTimersByTime(1000);useGameStore.getState().startCombat({...enemy,id:'new-combat'});vi.advanceTimersByTime(200);expect(useGameStore.getState().playerTurn).toBe(false);});
 it('saves victory after ending combat and advancing the floor',()=>{useGameStore.getState().startNewGame(1,'knight');useGameStore.setState({eventCount:9});useGameStore.getState().startCombat({...enemy,hp:1,maxHp:1,speed:1});useGameStore.getState().attack();const saved=SaveManager.loadFromSlot(1);expect(saved?.inCombat).toBe(false);expect(saved?.currentEnemy).toBeNull();expect(saved?.floor).toBe(2);expect(saved?.eventCount).toBe(0);});
 it('does not re-enter combat or mutate title state after leaving',()=>{useGameStore.getState().startNewGame(1,'knight');useGameStore.getState().startCombat(enemy);useGameStore.getState().returnToTitle();const before=snapshot();vi.runAllTimers();expect(snapshot()).toEqual(before);});
 it('resuming a saved enemy turn restarts only that session callback',()=>{useGameStore.getState().startNewGame(1,'knight');useGameStore.getState().startCombat(enemy);useGameStore.getState().saveGame();useGameStore.getState().returnToTitle();useGameStore.getState().loadGame(1);const hp=useGameStore.getState().hp;vi.advanceTimersByTime(1000);expect(useGameStore.getState().hp).toBeLessThan(hp);});
});


describe('explicit recovery and actual React flows',()=>{
 it('read-denied with writable backing storage performs zero writes/removes',()=>{
   storage.values.set(key(1),'opaque-existing');storage.denyRead=true;
   useGameStore.getState().startNewGame(1,'knight');useGameStore.getState().explore();useGameStore.getState().saveGame();
   expect(storage.writes).toBe(0);expect(storage.removes).toBe(0);expect(storage.values.get(key(1))).toBe('opaque-existing');
   expect(useGameStore.getState().storageMessage).toMatch(/접근/);
 });
 it.each(['malformed','wrong-shape','unsupported','unsafe-key'])('preserves %s raw with zero implicit writes/removes',kind=>{
   useGameStore.getState().startNewGame(1,'knight');
   const valid=JSON.parse(storage.getItem(key(1))!);
   const raw=kind==='malformed'?'{bad':kind==='wrong-shape'?JSON.stringify({...valid,gameState:{...valid.gameState,hp:-1}})
     :kind==='unsupported'?JSON.stringify({...valid,schemaVersion:2}):JSON.stringify({...valid,constructor:{unsafe:true}});
   storage.values.set(key(1),raw);storage.writes=0;storage.removes=0;
   expect(SaveManager.readSlot(1).kind).toBe('corrupt');SaveManager.getAllSaves();SaveManager.loadFromSlot(1);
   SaveManager.saveToSlot(1,snapshot());SaveManager.autoSave(1,snapshot());
   expect(storage.values.get(key(1))).toBe(raw);expect(storage.writes).toBe(0);expect(storage.removes).toBe(0);
 });
 it('explicit recovery deletes only the confirmed bytes and rejects a changed revision',()=>{
   storage.values.set(key(1),'{bad');storage.values.set('unrelated','keep');
   expect(SaveManager.deleteSlot(1,'other').ok).toBe(false);expect(storage.removes).toBe(0);
   expect(SaveManager.deleteSlot(1,'{bad').ok).toBe(true);expect(storage.removes).toBe(1);expect(storage.values.get('unrelated')).toBe('keep');
 });
 it('cancels all pending work on selection/cancel/reset and persists ordinary exploration',()=>{
   useGameStore.getState().startNewGame(1,'knight');useGameStore.getState().startCombat(enemy);
   useGameStore.getState().startCharacterSelect(2);expect(vi.getTimerCount()).toBe(0);
   useGameStore.getState().cancelCharacterSelect();useGameStore.getState().resetGame();expect(vi.getTimerCount()).toBe(0);
   useGameStore.getState().startNewGame(2,'archer');vi.mocked(Math.random).mockReturnValue(.1);useGameStore.getState().explore();
   expect(SaveManager.loadFromSlot(2)?.eventCount).toBe(1);
 });
 it('preserves the 5th-floor boss and word attack rules',()=>{
   useGameStore.getState().startNewGame(1,'mage');useGameStore.setState({floor:5,eventCount:9});useGameStore.getState().explore();
   expect(useGameStore.getState().currentEnemy?.isBoss).toBe(true);
   const before=useGameStore.getState().currentEnemy!.hp;
   useGameStore.getState().attack({adjective:{id:'adj',text:'빠른',type:'adjective',power:10},verb:{id:'verb',text:'베기',type:'verb',power:10}});
   expect(useGameStore.getState().currentEnemy!.hp).toBeLessThan(before-15);
 });
 it('actual title-to-class-to-game flow creates a usable slot',async()=>{
   const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
   await act(async()=>root.render(createElement(App)));
   const button=(label:string)=>[...document.querySelectorAll('button')].find(b=>b.textContent?.trim()===label)!;
   await act(async()=>button('새로운 여정').click());await act(async()=>button('기사 선택').click());
   expect(useGameStore.getState().isInGame).toBe(true);expect(SaveManager.loadFromSlot(1)?.characterClass).toBe('knight');
   vi.mocked(Math.random).mockReturnValue(.5);await act(async()=>button('탐색하기').click());
   expect(useGameStore.getState().words.length).toBe(1);expect(SaveManager.loadFromSlot(1)?.words.length).toBe(1);
   await act(async()=>root.unmount());host.remove();
 });
 it('actual damaged-slot dialog preserves raw until explicit confirmation',async()=>{
   storage.values.set(key(1),'{original-damaged');storage.values.set('unrelated','keep');
   const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);
   const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
   await act(async()=>root.render(createElement(App)));
   const load=[...host.querySelectorAll('button')].find(b=>b.textContent?.trim()==='이어하기')!;
   await act(async()=>load.click());expect(document.querySelector('[role="dialog"]')).not.toBeNull();
   const clear=document.querySelector<HTMLButtonElement>('[aria-label="슬롯 1 기록 지우기"]')!;
   await act(async()=>clear.click());expect(storage.values.get(key(1))).toBe('{original-damaged');expect(storage.removes).toBe(0);
   confirm.mockReturnValue(true);await act(async()=>clear.click());
   expect(storage.values.has(key(1))).toBe(false);expect(storage.values.get('unrelated')).toBe('keep');
   await act(async()=>root.unmount());host.remove();
 });
});


it('cancelling selection revokes replacement permission for an existing slot',()=>{
 useGameStore.getState().startNewGame(1,'knight');const before=storage.getItem(key(1));
 useGameStore.getState().startCharacterSelect(1);useGameStore.getState().cancelCharacterSelect();
 useGameStore.getState().startNewGame(1,'mage');expect(storage.getItem(key(1))).toBe(before);
 expect(useGameStore.getState().isInGame).toBe(false);
});


it('actual combat toolbar exits with a resumable slot and cancels its enemy callback',async()=>{
 useGameStore.getState().startNewGame(1,'knight');useGameStore.getState().startCombat({...enemy,speed:1});
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 await act(async()=>root.render(createElement(App)));
 const button=(label:string)=>[...host.querySelectorAll('button')].find(b=>b.textContent?.trim()===label)!;
 await act(async()=>button('공격').click());expect(useGameStore.getState().playerTurn).toBe(false);
 await act(async()=>button('타이틀').click());expect(useGameStore.getState().isInGame).toBe(false);
 expect(SaveManager.loadFromSlot(1)?.playerTurn).toBe(false);
 const before=snapshot();await act(async()=>vi.advanceTimersByTime(1500));expect(snapshot()).toEqual(before);
 await act(async()=>root.unmount());host.remove();
});


it('inventory and status dialogs expose names, trap Tab, close on Escape and restore focus',async()=>{
 useGameStore.getState().startNewGame(1,'knight');
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 await act(async()=>root.render(createElement(App)));
 try {
  for(const kind of ['inventory','status']) {
   const trigger=kind==='inventory'?[...host.querySelectorAll('button')].find(b=>b.textContent?.trim()==='소지품')!:host.querySelector<HTMLButtonElement>('header button')!;
   trigger.focus();await act(async()=>trigger.click());
   const dialog=document.querySelector<HTMLElement>('[role="dialog"]')!;expect(dialog).not.toBeNull();
   const label=document.getElementById(dialog.getAttribute('aria-labelledby')!);expect(label?.textContent).toContain(kind==='inventory'?'소지품':'내 상태');
   const buttons=[...dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];const first=buttons[0],last=buttons.at(-1)!;
   last.focus();const tab=new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true});await act(async()=>last.dispatchEvent(tab));
   expect(tab.defaultPrevented).toBe(true);expect(document.activeElement).toBe(first);
   await act(async()=>document.activeElement?.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
   await act(async()=>vi.advanceTimersByTime(0));expect(document.querySelector('[role="dialog"]')).toBeNull();expect(document.activeElement).toBe(trigger);
  }
 }finally{await act(async()=>root.unmount());host.remove();}
});


describe('actual Progress SSR contract',()=>{
 it.each([0,50,100])('exposes determinate value %s to accessibility APIs',value=>{
  const html=renderToStaticMarkup(createElement(Progress,{value}));
  expect(html).toContain(`aria-valuenow="${value}"`);expect(html).toContain('aria-valuemax="100"');
  expect(html).not.toContain('data-state="indeterminate"');
 });
 it.each([-10,150])('bounds display and accessible value %s without changing game numbers',value=>{
  const bounded=Math.min(100,Math.max(0,value));const html=renderToStaticMarkup(createElement(Progress,{value}));
  expect(html).toContain(`aria-valuenow="${bounded}"`);expect(html).toContain(`translateX(-${100-bounded}%)`);
  expect(html).not.toContain('translateX(--');
 });
 it('respects a custom positive maximum and keeps unknown progress indeterminate',()=>{
  const html=renderToStaticMarkup(createElement(Progress,{value:125,max:250}));
  expect(html).toContain('aria-valuenow="125"');expect(html).toContain('aria-valuemax="250"');expect(html).toContain('translateX(-50%)');
  expect(renderToStaticMarkup(createElement(Progress,{value:null}))).toContain('data-state="indeterminate"');
 });
});


describe('read-only session never silently gains a slot write lease',()=>{
 function prepareProtectedSlot(){
  useGameStore.getState().startNewGame(1,'mage');useGameStore.setState({level:7,gold:1234});useGameStore.getState().saveGame();
  useGameStore.getState().returnToTitle();const original=storage.getItem(key(1))!;
  storage.denyRead=true;storage.writes=0;storage.removes=0;
  useGameStore.getState().startCharacterSelect(1);useGameStore.getState().startNewGame(1,'knight');
  expect(storage.writes).toBe(0);expect(storage.values.get(key(1))).toBe(original);
  return original;
 }
 it.each(['autoSave','saveGame'] as const)('read recovery alone cannot enable %s',action=>{
  const original=prepareProtectedSlot();storage.denyRead=false;
  useGameStore.getState()[action]();useGameStore.getState().returnToTitle();
  expect(storage.writes).toBe(0);expect(storage.removes).toBe(0);expect(storage.getItem(key(1))).toBe(original);
  expect(JSON.parse(storage.getItem(key(1))!).gameState.characterClass).toBe('mage');
 });
 it('an explicit valid load grants normal saving to that saved character only',()=>{
  prepareProtectedSlot();storage.denyRead=false;useGameStore.getState().returnToTitle();storage.writes=0;
  useGameStore.getState().loadGame(1);useGameStore.getState().gainExp(1);useGameStore.getState().autoSave();
  expect(storage.writes).toBe(1);const saved=SaveManager.loadFromSlot(1)!;
  expect(saved.characterClass).toBe('mage');expect(saved.level).toBe(7);expect(saved.gold).toBe(1234);
 });
 it('only explicit re-read and selected new journey may replace the old record',()=>{
  const original=prepareProtectedSlot();storage.denyRead=false;useGameStore.getState().returnToTitle();
  expect(storage.getItem(key(1))).toBe(original);storage.writes=0;
  useGameStore.getState().startCharacterSelect(1);useGameStore.getState().startNewGame(1,'knight');
  expect(storage.writes).toBe(1);expect(SaveManager.loadFromSlot(1)?.characterClass).toBe('knight');
 });
});


it.each([1_000_000_000_000,5])('rejects unsupported eventsPerFloor %s before entering the game or overwriting raw',eventsPerFloor=>{
 useGameStore.getState().startNewGame(1,'knight');useGameStore.getState().returnToTitle();
 const slot=JSON.parse(storage.getItem(key(1))!);slot.gameState.eventsPerFloor=eventsPerFloor;
 const raw=JSON.stringify(slot);storage.values.set(key(1),raw);storage.writes=0;storage.removes=0;
 useGameStore.getState().loadGame(1);useGameStore.getState().autoSave();useGameStore.getState().saveGame();
 expect(SaveManager.readSlot(1).kind).toBe('corrupt');expect(useGameStore.getState().isInGame).toBe(false);
 expect(useGameStore.getState().eventsPerFloor).toBe(10);expect(storage.getItem(key(1))).toBe(raw);
 expect(storage.writes).toBe(0);expect(storage.removes).toBe(0);
});
