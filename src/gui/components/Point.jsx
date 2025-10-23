import React, { useEffect, useState } from 'react';

export function Point({
  point,
  pointIndex,
  morpherImage,
  isHighlighted,
  isSelected,
  onDragStop,
  onHighlight,
  onSelect,
}) {
  const [isDragging, setIsDragging] = useState(false);

  const x = morpherImage.getX() + point.x;
  const y = morpherImage.getY() + point.y;

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Left button only

    // Double click to select
    if (e.detail === 2) {
      onSelect();
      return;
    }

    setIsDragging(true);

    const initialX = e.clientX;
    const initialY = e.clientY;
    const pointX = point.x;
    const pointY = point.y;

    const handleMouseMove = (e) => {
      const dx = e.clientX - initialX;
      const dy = e.clientY - initialY;
      point.setX(pointX + dx);
      point.setY(pointY + dy);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setIsDragging(false);
      onDragStop();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseEnter = () => {
    onHighlight(true);
  };

  const handleMouseLeave = () => {
    onHighlight(false);
  };

  const className = [
    'point',
    isHighlighted && 'highlighted',
    isSelected && 'selected',
    isDragging && 'dragging',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        border: '2px solid white',
        backgroundColor: isSelected ? '#667eea' : 'rgba(0,0,0,0.5)',
        boxShadow: '0 0 3px rgba(0,0,0,0.5)',
        cursor: 'move',
        zIndex: 100,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
}
