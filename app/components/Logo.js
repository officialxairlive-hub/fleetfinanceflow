import React from 'react';

const Logo = ({ size = 'default', showText = true, inverted = false }) => {
  const isSmall = size === 'small';
  const iconSize = isSmall ? 28 : 40;
  const textSize = isSmall ? '16px' : '20px';
  const gapSize = isSmall ? 8 : 12;

  const cellStyle = {
    fill: '#0F172A',
    rx: 2
  };
  
  const blueCellBg = {
    fill: 'rgba(37, 99, 255, 0.15)',
    rx: 2
  };

  const textStyle = {
    fill: '#FFFFFF',
    fontFamily: 'var(--font-heading), Manrope, sans-serif',
    fontSize: '6px',
    fontWeight: 600,
    textAnchor: 'middle',
    dominantBaseline: 'central'
  };

  // When inverted (on dark backgrounds), flip icon cell bg to white/light
  const invertedCellStyle = {
    fill: 'rgba(255, 255, 255, 0.18)',
    rx: 2
  };

  const invertedBlueCellBg = {
    fill: 'rgba(37, 99, 255, 0.35)',
    rx: 2
  };

  const activeCellStyle = inverted ? invertedCellStyle : cellStyle;
  const activeBlueCellBg = inverted ? invertedBlueCellBg : blueCellBg;
  const strokeColor = inverted ? 'rgba(255,255,255,0.85)' : 'white';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: gapSize, textDecoration: 'none' }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Row 1 */}
        <rect x="0" y="0" width="7" height="7" {...activeCellStyle} />
        <path d="M3.5 1.5V5.5M1.5 3.5H5.5" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" />
        
        <rect x="8.5" y="0" width="7" height="7" {...activeCellStyle} />
        <path d="M10 3.5H14" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" />
        
        <rect x="17" y="0" width="7" height="7" {...activeCellStyle} />
        <path d="M18.5 2.5H22.5M18.5 4.5H22.5" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" />

        {/* Row 2 */}
        <rect x="0" y="8.5" width="7" height="7" {...activeCellStyle} />
        <path d="M2 10.5L5 13.5M5 10.5L2 13.5" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" />
        
        <rect x="8.5" y="8.5" width="7" height="7" {...activeCellStyle} />
        <circle cx="12" cy="10" r="0.5" fill={strokeColor} />
        <path d="M10 12H14" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" />
        <circle cx="12" cy="14" r="0.5" fill={strokeColor} />
        
        <rect x="17" y="8.5" width="7" height="7" {...activeCellStyle} />
        <text x="20.5" y="12" {...textStyle}>F</text>

        {/* Row 3 */}
        <rect x="0" y="17" width="7" height="7" {...activeCellStyle} />
        <text x="3.5" y="20.5" {...textStyle}>F</text>
        
        <rect x="8.5" y="17" width="7" height="7" {...activeCellStyle} />
        <text x="12" y="20.5" {...textStyle}>F</text>
        
        <rect x="17" y="17" width="7" height="7" {...activeBlueCellBg} />
        <path d="M19 19H22V22" stroke="#2563FF" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
      </svg>
      {showText && (
        <span style={{
          fontFamily: 'var(--font-heading), Manrope, sans-serif',
          fontSize: textSize,
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: inverted ? '#FFFFFF' : 'var(--color-text)'
        }}>
          Fleet Finance <span style={{ color: '#2563FF' }}>Flow</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
