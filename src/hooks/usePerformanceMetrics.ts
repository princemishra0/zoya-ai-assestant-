import { useState, useEffect } from 'react';

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState({ fps: 60, ram: 0 });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;
    let intervalId: NodeJS.Timeout;

    const loop = () => {
      frameCount++;
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    intervalId = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTime;
      const fps = Math.round((frameCount * 1000) / delta);
      
      let ram = 0;
      // @ts-ignore
      if (window.performance && performance.memory) {
        // @ts-ignore
        ram = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
      }

      setMetrics({ fps: Math.min(fps, 60), ram });
      
      frameCount = 0;
      lastTime = now;
    }, 1000);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(intervalId);
    };
  }, []);

  return metrics;
}
