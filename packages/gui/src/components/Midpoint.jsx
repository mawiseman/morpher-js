import React, { useState } from 'react';

export function Midpoint({ p1, p2, triangle, morpherImage, onSplit }) {
  const [isHighlighted, setIsHighlighted] = useState(false);

  const x0 = morpherImage.getX();
  const y0 = morpherImage.getY();

  const midX = x0 + (p1.x + p2.x) / 2;
  const midY = y0 + (p1.y + p2.y) / 2;

  const handleClick = (e) => {
    onSplit();
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseEnter = () => {
    setIsHighlighted(true);
  };

  const handleMouseLeave = () => {
    setIsHighlighted(false);
  };

  return (
    <div
      className={`midpoint ${isHighlighted ? 'highlighted' : ''}`}
      style={{
        position: 'absolute',
        left: `${midX}px`,
        top: `${midY}px`,
        transform: 'translate(-50%, -50%)',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        border: '2px solid white',
        backgroundColor: isHighlighted ? '#ff6b6b' : 'rgba(255,107,107,0.5)',
        boxShadow: '0 0 3px rgba(0,0,0,0.5)',
        cursor: 'pointer',
        zIndex: 99,
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title="Click to split edge"
    />
  );
}
