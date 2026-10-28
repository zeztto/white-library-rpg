import { useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/game-store';
import { motion, AnimatePresence } from 'motion/react';

export function NarrativeLog() {
  const narrativeLog = useGameStore((state) => state.narrativeLog);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Auto-scroll to bottom when new log entries are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [narrativeLog]);
  
  const getLogStyle = (type: string) => {
    switch (type) {
      case 'combat':
        return 'text-foreground/90';
      case 'system':
        return 'text-muted-foreground text-sm';
      case 'important':
        return 'font-bold';
      default:
        return '';
    }
  };
  
  const renderText = (text: string) => {
    // Replace **text** with bold
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };
  
  return (
    <div 
      className="flex-1 overflow-y-auto px-4" 
      ref={scrollRef}
    >
      <div className="max-w-md mx-auto py-4 pb-8 space-y-3">
        <AnimatePresence mode="popLayout">
          {narrativeLog.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`leading-relaxed ${getLogStyle(log.type)} ${
                index < narrativeLog.length - 5 ? 'opacity-60' : ''
              }`}
            >
              {renderText(log.text)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}