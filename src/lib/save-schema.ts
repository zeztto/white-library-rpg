import { z } from 'zod';
import type { GameState } from './game-store';
const integer = z.number().int().min(0).max(1_000_000_000_000);
const positive = integer.min(1);
const timestamp = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const text = z.string().min(1).max(4096).refine(value => value.trim().length > 0);
const word = z.object({id:text,text:text,type:z.enum(['adjective','verb']),power:positive.optional()}).strict();
const enemy = z.object({id:text,name:text,hp:integer,maxHp:positive,attack:integer,speed:integer,
  isBoss:z.boolean().optional(),isMiniBoss:z.boolean().optional(),isElite:z.boolean().optional()}).strict()
  .refine(value=>value.hp<=value.maxHp);
const stateShape = z.object({
  playerName:text,characterClass:z.enum(['knight','archer','mage']),level:positive,exp:integer,expToNext:positive,
  hp:integer,maxHp:positive,attackPower:integer,defense:integer,speed:integer,maxPotions:positive,
  specialSkillCooldown:integer,isDefenseBuffActive:z.boolean(),floor:positive,completedFloors:integer,
  eventCount:integer,eventsPerFloor:z.literal(10),words:z.array(word).max(10_000),
  items:z.array(z.object({id:text,name:text,description:text,equipped:z.boolean(),effect:text.optional()}).strict()).max(1000),
  potions:integer,gold:integer,inCombat:z.boolean(),currentEnemy:enemy.nullable(),playerTurn:z.boolean(),
  narrativeLog:z.array(z.object({id:text,text,timestamp,type:z.enum(['narrative','combat','system','important'])}).strict()).max(100),
  inventoryOpen:z.boolean(),statusModalOpen:z.boolean(),isDead:z.boolean(),completedSentences:z.array(text).max(10_000),
  currentSaveSlot:z.number().int().min(1).max(3),isInGame:z.boolean(),isSelectingClass:z.boolean(),
  _logCounter:integer,storageMessage:z.string().max(4096).nullable().default(null),
}).strict();
export const gameStateSchema = stateShape.refine(value=>value.hp<=value.maxHp && value.potions<=value.maxPotions
  && value.eventCount<value.eventsPerFloor && value.isDead===(value.hp===0)
  && value.inCombat===(value.currentEnemy!==null) && (!value.currentEnemy || value.currentEnemy.hp>0));
export const saveSlotSchema = z.object({schemaVersion:z.literal(1).optional(),slotId:z.number().int().min(1).max(3),
  playerName:text,level:positive,floor:positive,hp:integer,maxHp:positive,lastSaved:timestamp,gameState:gameStateSchema}).strict()
  .refine(value=>value.slotId===value.gameState.currentSaveSlot && value.playerName===value.gameState.playerName
    && value.level===value.gameState.level && value.floor===value.gameState.floor
    && value.hp===value.gameState.hp && value.maxHp===value.gameState.maxHp);

export function stateForSave(state:GameState):GameState {
  const source=state as unknown as Record<string,unknown>;
  const selected=Object.fromEntries(Object.keys(stateShape.shape).map(key=>[key,source[key]]));
  return gameStateSchema.parse({...selected,storageMessage:null,inventoryOpen:false,statusModalOpen:false,isSelectingClass:false});
}
