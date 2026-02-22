import { useState, useEffect, useRef } from 'react';

export default function VoiceOrb({ isActive, isSpeaking }) {
  const [scale, setScale] = useState(1);
  const [ripples, setRipples] = useState([]);
  const rippleIdRef = useRef(0);

  useEffect(() => {
    if (!isActive) {
      setScale(1);
      return;
    }

    const interval = setInterval(() => {
      setScale(isSpeaking ? 1 + Math.random() * 0.25 : 1 + Math.random() * 0.08);
    }, 120);

    return () => clearInterval(interval);
  }, [isActive, isSpeaking]);

  // Emit ripple waves when speaking
  useEffect(() => {
    if (!isSpeaking) return;

    const interval = setInterval(() => {
      const id = ++rippleIdRef.current;
      setRipples((prev) => [...prev.slice(-3), id]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r !== id));
      }, 1500);
    }, 600);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div className="flex items-center justify-center py-4">
      <div className="relative" style={{ width: 180, height: 180 }}>

        {/* Ripple waves when speaking */}
        {ripples.map((id) => (
          <div
            key={id}
            className="absolute inset-0 rounded-full"
            style={{
              border: '1px solid rgba(129, 140, 248, 0.3)',
              animation: 'orbRing 1.5s ease-out forwards',
            }}
          />
        ))}

        {/* Outermost rotating ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            animation: isActive ? 'orbRotate 15s linear infinite' : 'none',
            opacity: isActive ? 0.5 : 0,
            transition: 'opacity 0.6s ease',
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent, rgba(99, 102, 241, 0.3), transparent, rgba(139, 92, 246, 0.2), transparent)',
              padding: 1,
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
            }}
          />
        </div>

        {/* Outer ambient glow */}
        <div
          className="absolute rounded-full transition-all duration-700 ease-out"
          style={{
            inset: -20,
            transform: `scale(${isActive ? scale * 1.1 : 1})`,
            background: isActive
              ? 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 70%)'
              : 'transparent',
          }}
        />

        {/* Middle pulsing ring */}
        <div
          className="absolute rounded-full transition-all duration-500"
          style={{
            inset: 5,
            transform: `scale(${isActive ? scale * 1.08 : 1})`,
            background: isActive
              ? 'radial-gradient(circle, rgba(129, 140, 248, 0.12) 0%, transparent 70%)'
              : 'transparent',
          }}
        />

        {/* Breathing ring */}
        <div
          className="absolute rounded-full"
          style={{
            inset: 15,
            border: `1px solid ${isActive ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.08)'}`,
            animation: isActive ? 'breathe 3s ease-in-out infinite' : 'none',
            transition: 'border-color 0.5s ease',
          }}
        />

        {/* Inner gradient ring */}
        <div
          className="absolute rounded-full transition-all duration-500"
          style={{
            inset: 25,
            background: isActive
              ? `linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.08))`
              : 'transparent',
            transform: `scale(${isActive ? scale * 1.03 : 1})`,
          }}
        />

        {/* Core orb */}
        <div
          className="absolute rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            inset: 35,
            transform: `scale(${scale})`,
            background: isActive
              ? 'radial-gradient(circle at 35% 35%, #818cf8, #6366f1 40%, #4f46e5 70%, #3730a3)'
              : 'radial-gradient(circle at 35% 35%, #4b5563, #374151 50%, #1f2937)',
            boxShadow: isActive
              ? '0 0 50px rgba(99, 102, 241, 0.4), 0 0 100px rgba(99, 102, 241, 0.15), inset 0 -5px 20px rgba(0,0,0,0.3), inset 0 5px 15px rgba(255,255,255,0.05)'
              : '0 0 25px rgba(0, 0, 0, 0.4), inset 0 -5px 15px rgba(0,0,0,0.3)',
          }}
        >
          {/* Inner highlight */}
          <div
            className="absolute rounded-full"
            style={{
              top: '15%',
              left: '20%',
              width: '30%',
              height: '25%',
              background: isActive
                ? 'radial-gradient(ellipse, rgba(255,255,255,0.15) 0%, transparent 70%)'
                : 'radial-gradient(ellipse, rgba(255,255,255,0.08) 0%, transparent 70%)',
            }}
          />

          {/* Mic icon when idle */}
          {!isActive && (
            <svg className="w-8 h-8 text-gray-400/70" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
        </div>

        {/* Floating particles when active */}
        {isActive && (
          <>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 3 + Math.random() * 3,
                  height: 3 + Math.random() * 3,
                  background: i % 2 === 0 ? 'rgba(129, 140, 248, 0.6)' : 'rgba(167, 139, 250, 0.5)',
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                  animation: `floatUp ${2 + Math.random() * 2}s ease-out infinite`,
                  animationDelay: `${i * 0.4}s`,
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
