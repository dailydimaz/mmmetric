import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Maximize2 } from "lucide-react";

interface SessionPlayerProps {
  events: any[];
}

/**
 * Lightweight rrweb-compatible session player.
 * Replays DOM snapshots and incremental mutations in an iframe sandbox.
 */
export function SessionPlayer({ events }: SessionPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<number | null>(null);
  const eventIndexRef = useRef(0);

  // Calculate total duration from events
  useEffect(() => {
    if (!events?.length) return;
    const first = events[0]?.timestamp || 0;
    const last = events[events.length - 1]?.timestamp || 0;
    setTotalDuration(last - first);
  }, [events]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const applyEvent = useCallback((event: any) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;

    const doc = iframe.contentDocument;

    // Type 2 = full snapshot
    if (event.type === 2 && event.data?.html) {
      doc.open();
      doc.write(event.data.html);
      doc.close();
    }

    // Type 3 = incremental mutation (simplified)
    if (event.type === 3 && event.data) {
      // Mouse move indicator
      if (event.data.source === 1 || event.data.source === 6) {
        const positions = event.data.positions || [event.data];
        const lastPos = positions[positions.length - 1];
        if (lastPos) {
          let cursor = doc.getElementById('__mm_cursor');
          if (!cursor) {
            cursor = doc.createElement('div');
            cursor.id = '__mm_cursor';
            cursor.style.cssText = 'position:fixed;width:20px;height:20px;border-radius:50%;background:rgba(255,0,0,0.5);pointer-events:none;z-index:999999;transform:translate(-50%,-50%);transition:all 0.1s ease';
            doc.body?.appendChild(cursor);
          }
          cursor.style.left = `${lastPos.x}px`;
          cursor.style.top = `${lastPos.y}px`;
        }
      }

      // Click indicator
      if (event.data.source === 2) {
        let click = doc.createElement('div');
        click.style.cssText = `position:fixed;left:${event.data.x}px;top:${event.data.y}px;width:30px;height:30px;border-radius:50%;border:3px solid rgba(255,0,0,0.8);pointer-events:none;z-index:999998;transform:translate(-50%,-50%);animation:__mm_click 0.5s ease-out forwards`;
        
        if (!doc.getElementById('__mm_click_style')) {
          const style = doc.createElement('style');
          style.id = '__mm_click_style';
          style.textContent = '@keyframes __mm_click{0%{opacity:1;transform:translate(-50%,-50%) scale(0.5)}100%{opacity:0;transform:translate(-50%,-50%) scale(2)}}';
          doc.head?.appendChild(style);
        }
        doc.body?.appendChild(click);
        setTimeout(() => click.remove(), 500);
      }

      // Scroll
      if (event.data.source === 3) {
        const { x, y } = event.data;
        iframe.contentWindow?.scrollTo(x || 0, y || 0);
      }
    }
  }, []);

  const startPlayback = useCallback(() => {
    if (!events?.length) return;

    const baseTime = events[0]?.timestamp || 0;
    setPlaying(true);

    const tick = () => {
      setCurrentTime(prev => {
        const next = prev + 50 * speed;

        // Apply all events up to current time
        while (eventIndexRef.current < events.length) {
          const event = events[eventIndexRef.current];
          const eventTime = (event.timestamp || 0) - baseTime;
          if (eventTime <= next) {
            applyEvent(event);
            eventIndexRef.current++;
          } else {
            break;
          }
        }

        if (next >= totalDuration) {
          setPlaying(false);
          return totalDuration;
        }
        return next;
      });

      timerRef.current = requestAnimationFrame(tick);
    };

    timerRef.current = requestAnimationFrame(tick);
  }, [events, totalDuration, speed, applyEvent]);

  const pausePlayback = useCallback(() => {
    setPlaying(false);
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (playing) pausePlayback();
    else startPlayback();
  }, [playing, startPlayback, pausePlayback]);

  const seekTo = useCallback((ms: number) => {
    pausePlayback();
    setCurrentTime(ms);
    eventIndexRef.current = 0;

    // Replay all events up to seek point
    if (!events?.length) return;
    const baseTime = events[0]?.timestamp || 0;
    for (let i = 0; i < events.length; i++) {
      const eventTime = (events[i].timestamp || 0) - baseTime;
      if (eventTime <= ms) {
        applyEvent(events[i]);
        eventIndexRef.current = i + 1;
      } else break;
    }
  }, [events, pausePlayback, applyEvent]);

  const skip = useCallback((delta: number) => {
    seekTo(Math.max(0, Math.min(totalDuration, currentTime + delta)));
  }, [currentTime, totalDuration, seekTo]);

  useEffect(() => {
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, []);

  // Auto-apply first snapshot
  useEffect(() => {
    if (events?.length) {
      const snapshot = events.find(e => e.type === 2);
      if (snapshot) applyEvent(snapshot);
    }
  }, [events, applyEvent]);

  if (!events?.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No recording events available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Player viewport */}
      <div className="flex-1 relative bg-muted rounded-lg overflow-hidden border">
        <iframe
          ref={iframeRef}
          className="w-full h-full bg-white"
          sandbox="allow-same-origin"
          title="Session replay"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-2">
        <Button variant="ghost" size="icon" onClick={() => skip(-5000)} title="Back 5s">
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={togglePlay}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => skip(5000)} title="Forward 5s">
          <SkipForward className="h-4 w-4" />
        </Button>

        <span className="text-xs text-muted-foreground min-w-[70px]">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </span>

        <div className="flex-1">
          <Slider
            value={[currentTime]}
            min={0}
            max={totalDuration || 1}
            step={100}
            onValueChange={([v]) => seekTo(v)}
          />
        </div>

        <select
          className="text-xs bg-muted border rounded px-2 py-1"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
          <option value={8}>8x</option>
        </select>
      </div>
    </div>
  );
}
