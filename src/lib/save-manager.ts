import type { GameState } from './game-store';
import { saveSlotSchema, stateForSave } from './save-schema';

export interface SaveSlot {
  schemaVersion?:1; slotId:number; playerName:string; level:number; floor:number; hp:number; maxHp:number;
  lastSaved:number; gameState:GameState;
}
export type SlotRead = {kind:'empty';slotId:number;raw:null}|{kind:'valid';slotId:number;raw:string;save:SaveSlot}
  |{kind:'corrupt';slotId:number;raw:string;message:string}|{kind:'unavailable';slotId:number;message:string};
export interface SaveResult {ok:boolean;message:string|null}
export const SAVE_KEY_PREFIX='white-library-save-';
const validId=(id:number)=>Number.isInteger(id)&&id>=1&&id<=3;
const denied='저장소에 접근할 수 없습니다. 기존 기록은 변경하지 않으며 현재 화면에서만 진행합니다.';
const corrupt='손상되었거나 지원하지 않는 저장입니다. 원문을 보존했으며 직접 지우기 전에는 덮어쓰지 않습니다.';

function hasUnsafeKeys(value:unknown):boolean {
  if (!value||typeof value!=='object') return false;
  return Object.entries(value).some(([key,child])=>['__proto__','constructor','prototype'].includes(key)||hasUnsafeKeys(child));
}
export class SaveManager {
  static readSlot(slotId:number):SlotRead {
    if (!validId(slotId)) return {kind:'unavailable',slotId,message:'유효하지 않은 슬롯입니다.'};
    let raw:string|null;
    try {raw=globalThis.localStorage.getItem(`${SAVE_KEY_PREFIX}${slotId}`);}
    catch {return {kind:'unavailable',slotId,message:denied};}
    if (raw===null) return {kind:'empty',slotId,raw:null};
    try {
      if (raw.length>4*1024*1024) throw new Error('size');
      const value:unknown=JSON.parse(raw);
      if (hasUnsafeKeys(value)) throw new Error('unsafe key');
      const parsed=saveSlotSchema.safeParse(value);
      if (!parsed.success||parsed.data.slotId!==slotId) throw new Error('shape');
      return {kind:'valid',slotId,raw,save:parsed.data};
    } catch {return {kind:'corrupt',slotId,raw,message:corrupt};}
  }
  static getSlots():SlotRead[] {return [1,2,3].map(slot=>this.readSlot(slot));}
  static getAllSaves():SaveSlot[] {
    return this.getSlots().flatMap(slot=>slot.kind==='valid'?[slot.save]:[]).sort((a,b)=>b.lastSaved-a.lastSaved);
  }
  static saveToSlot(slotId:number,state:GameState):SaveResult {
    const current=this.readSlot(slotId);
    if (current.kind==='corrupt'||current.kind==='unavailable') return {ok:false,message:current.message};
    try {
      const gameState=stateForSave(state);
      const slot=saveSlotSchema.parse({schemaVersion:1,slotId,playerName:gameState.playerName,level:gameState.level,
        floor:gameState.floor,hp:gameState.hp,maxHp:gameState.maxHp,lastSaved:Date.now(),gameState});
      if (globalThis.localStorage.getItem(`${SAVE_KEY_PREFIX}${slotId}`)!==current.raw) return {ok:false,message:'다른 화면에서 슬롯이 바뀌어 저장을 멈췄습니다. 타이틀에서 다시 확인해 주세요.'};
      globalThis.localStorage.setItem(`${SAVE_KEY_PREFIX}${slotId}`,JSON.stringify(slot));
      return {ok:true,message:null};
    } catch {return {ok:false,message:'저장하지 못했습니다. 기존 기록을 바꾸지 않았습니다. 브라우저 저장 공간과 권한을 확인해 주세요.'};}
  }
  static loadFromSlot(slotId:number):GameState|null {const slot=this.readSlot(slotId);return slot.kind==='valid'?slot.save.gameState:null;}
  static deleteSlot(slotId:number,expectedRaw:string|null|undefined):SaveResult {
    if (!validId(slotId)||expectedRaw===undefined) return {ok:false,message:'삭제 대상을 다시 확인해 주세요.'};
    try {
      const raw=globalThis.localStorage.getItem(`${SAVE_KEY_PREFIX}${slotId}`);
      if (raw!==expectedRaw) return {ok:false,message:'다른 화면에서 슬롯이 바뀌었습니다. 다시 확인한 후 지워 주세요.'};
      globalThis.localStorage.removeItem(`${SAVE_KEY_PREFIX}${slotId}`);
      return {ok:true,message:null};
    } catch {return {ok:false,message:denied};}
  }
  static findEmptySlot():number|null {return this.getSlots().find(slot=>slot.kind==='empty')?.slotId??null;}
  static isSlotEmpty(slotId:number):boolean {return this.readSlot(slotId).kind==='empty';}
  static autoSave(slotId:number,state:GameState):SaveResult {return this.saveToSlot(slotId,state);}
}
