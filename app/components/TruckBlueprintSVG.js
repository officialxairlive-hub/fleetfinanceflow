export default function TruckBlueprintSVG({ activeHotspot, onHotspotClick }) {
  // Hotspot coordinates (relative to viewBox 800 400)
  const hotspots = {
    brakes: { cx: 200, cy: 310 },
    engine: { cx: 260, cy: 220 },
    cab: { cx: 420, cy: 150 },
    axle: { cx: 620, cy: 310 },
    trailer: { cx: 750, cy: 260 }
  };

  return (
    <svg viewBox="0 0 800 400" className="w-full h-auto drop-shadow-2xl" style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.05))' }}>
      <defs>
        <linearGradient id="truckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="windowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
      </defs>

      {/* Basic Silhouette of a Heavy Duty Truck */}
      <g stroke="#334155" strokeWidth="2" fill="url(#truckGrad)" strokeLinejoin="round">
        {/* Main Cab & Sleeper */}
        <path d="M 320 80 L 480 80 Q 500 80 500 100 L 500 320 L 320 320 Z" />
        {/* Hood */}
        <path d="M 320 180 L 150 200 Q 120 205 120 240 L 120 320 L 320 320 Z" />
        {/* Aerodynamic Roof Deflector */}
        <path d="M 320 80 L 480 80 L 480 40 Q 320 40 320 80 Z" fill="#0F172A" />
        {/* Chassis / Frame */}
        <rect x="100" y="300" width="680" height="20" rx="4" fill="#0F172A" />
        {/* Fifth Wheel / Hitch */}
        <path d="M 580 290 L 640 290 L 660 300 L 560 300 Z" fill="#334155" />
      </g>

      {/* Window */}
      <path d="M 320 100 L 400 100 L 400 180 L 330 180 Z" fill="url(#windowGrad)" stroke="#475569" strokeWidth="2" />
      <path d="M 410 100 L 460 100 L 460 180 L 410 180 Z" fill="url(#windowGrad)" stroke="#475569" strokeWidth="2" />

      {/* Wheels */}
      <g fill="#0F172A" stroke="#475569" strokeWidth="4">
        {/* Steer */}
        <circle cx="200" cy="320" r="45" />
        {/* Drives */}
        <circle cx="560" cy="320" r="45" />
        <circle cx="680" cy="320" r="45" />
      </g>

      {/* Wheel Hubs */}
      <g fill="#94A3B8">
        <circle cx="200" cy="320" r="15" />
        <circle cx="560" cy="320" r="15" />
        <circle cx="680" cy="320" r="15" />
      </g>

      {/* Hotspots */}
      {Object.entries(hotspots).map(([key, pos]) => {
        const isActive = activeHotspot === key;
        return (
          <g key={key} transform={`translate(${pos.cx}, ${pos.cy})`} style={{ cursor: 'pointer' }} onClick={() => onHotspotClick(key)}>
            <circle r={isActive ? "24" : "16"} fill={isActive ? "rgba(37, 99, 255, 0.2)" : "rgba(15, 23, 42, 0.1)"} className="transition-all duration-300" />
            <circle r={isActive ? "10" : "6"} fill={isActive ? "#2563FF" : "#64748B"} stroke="#FFFFFF" strokeWidth="2" className="transition-all duration-300" />
            
            {isActive && (
              <circle r="30" fill="none" stroke="#2563FF" strokeWidth="1" strokeDasharray="4 4">
                <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}
