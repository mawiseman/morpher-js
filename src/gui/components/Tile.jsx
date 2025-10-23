import React, { forwardRef } from 'react';

/**
 * Base Tile component
 */
export const Tile = forwardRef(function Tile({ position, className = '', children, menu }, ref) {
  const style = {
    position: 'absolute',
    left: `${position.x * 100}%`,
    top: `${position.y * 100}%`,
    width: `${position.width * 100}%`,
    height: `${position.height * 100}%`,
  };

  return (
    <div ref={ref} className={`tile ${className}`} style={style}>
      <div className="pane">
        <div className="artboard">
          {children}
        </div>
      </div>
      {menu}
    </div>
  );
});
