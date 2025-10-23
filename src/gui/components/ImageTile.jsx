import React, { useRef, useEffect, useState } from 'react';
import { Tile } from './Tile.jsx';
import { Point } from './Point.jsx';
import { Midpoint } from './Midpoint.jsx';

export function ImageTile({
  image,
  imageIndex,
  project,
  position,
  onDelete,
  onUpdate,
  onFileChange,
  onWeightChange,
  onPointHighlight,
  onPointSelect,
  highlightedPoint,
  selectedPoints,
  onSave,
}) {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [moveMode, setMoveMode] = useState(false);
  const [img, setImg] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const morpherImage = image.morpherImage;

  // Load image when file data changes
  useEffect(() => {
    if (!image.file) return;

    const imgElement = new window.Image();
    imgElement.onload = () => {
      setImg(imgElement);
    };
    imgElement.src = image.file;
  }, [image.file]);

  // Listen to morpher image events
  useEffect(() => {
    if (!morpherImage) return;

    const handleChange = () => {
      drawCanvas();
    };

    morpherImage.on('change', handleChange);
    morpherImage.on('triangle:add', handleChange);
    morpherImage.on('triangle:remove', handleChange);

    return () => {
      morpherImage.off('change', handleChange);
      morpherImage.off('triangle:add', handleChange);
      morpherImage.off('triangle:remove', handleChange);
    };
  }, [morpherImage]);

  // Draw canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const x0 = morpherImage.getX();
    const y0 = morpherImage.getY();

    // Draw image
    if (img && img.width > 0) {
      ctx.drawImage(img, x0, y0);
    }

    // Draw triangles
    const pattern = buildPattern(10, 10);
    for (const triangle of morpherImage.mesh.triangles) {
      ctx.beginPath();
      ctx.moveTo(x0 + triangle.p1.x, y0 + triangle.p1.y);
      ctx.lineTo(x0 + triangle.p2.x, y0 + triangle.p2.y);
      ctx.lineTo(x0 + triangle.p3.x, y0 + triangle.p3.y);
      ctx.closePath();

      ctx.fillStyle = pattern;
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.stroke();

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.stroke();
    }
  };

  // Redraw when image or morpherImage changes
  useEffect(() => {
    drawCanvas();
  }, [img, morpherImage]);

  // Update canvas size when project morpher resizes
  useEffect(() => {
    if (!project || !project.morpher) return;

    const handleResize = (morpher, canvas) => {
      if (canvasRef.current) {
        canvasRef.current.width = canvas.width;
        canvasRef.current.height = canvas.height;
        setCanvasSize({ width: canvas.width, height: canvas.height });
        drawCanvas();
      }
    };

    const handleLoad = (morpher, canvas) => {
      handleResize(morpher, canvas);
    };

    project.morpher.on('resize', handleResize);
    project.morpher.on('load', handleLoad);

    // Set initial size
    if (project.morpher.canvas) {
      handleResize(project.morpher, project.morpher.canvas);
    }

    return () => {
      project.morpher.off('resize', handleResize);
      project.morpher.off('load', handleLoad);
    };
  }, [project]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileChange(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDelete = () => {
    onDelete();
  };

  const handleMoveToggle = () => {
    setMoveMode(!moveMode);
  };

  const handleCanvasClick = (e) => {
    if (moveMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - morpherImage.getX();
    const y = e.clientY - rect.top - morpherImage.getY();

    morpherImage.addPoint({ x, y });
    onSave();
  };

  const handleCanvasMouseDown = (e) => {
    if (!moveMode) return;

    const initialX = e.clientX;
    const initialY = e.clientY;
    const imageX = morpherImage.getX();
    const imageY = morpherImage.getY();

    const handleMouseMove = (e) => {
      const dx = e.clientX - initialX;
      const dy = e.clientY - initialY;
      morpherImage.moveTo(imageX + dx, imageY + dy);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      onSave();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handlePointDragStop = () => {
    onSave();
  };

  const handleEdgeSplit = (p1, p2) => {
    morpherImage.splitEdge(p1, p2);
    onSave();
  };

  return (
    <Tile position={position} className="image">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        style={{ cursor: moveMode ? 'move' : 'crosshair' }}
      />

      {/* Render points */}
      {morpherImage.mesh.points.map((point, index) => (
        <Point
          key={index}
          point={point}
          pointIndex={index}
          morpherImage={morpherImage}
          isHighlighted={highlightedPoint?.index === index && !highlightedPoint?.isMidpoint}
          isSelected={selectedPoints.includes(index)}
          onDragStop={handlePointDragStop}
          onHighlight={(state) => onPointHighlight(index, state, false)}
          onSelect={() => onPointSelect(index)}
        />
      ))}

      {/* Render midpoints */}
      {morpherImage.mesh.triangles.flatMap((triangle) => [
        <Midpoint
          key={`mid-${triangle.p1.id}-${triangle.p2.id}`}
          p1={triangle.p1}
          p2={triangle.p2}
          triangle={triangle}
          morpherImage={morpherImage}
          onSplit={() => handleEdgeSplit(triangle.p1, triangle.p2)}
        />,
        <Midpoint
          key={`mid-${triangle.p2.id}-${triangle.p3.id}`}
          p1={triangle.p2}
          p2={triangle.p3}
          triangle={triangle}
          morpherImage={morpherImage}
          onSplit={() => handleEdgeSplit(triangle.p2, triangle.p3)}
        />,
        <Midpoint
          key={`mid-${triangle.p3.id}-${triangle.p1.id}`}
          p1={triangle.p3}
          p2={triangle.p1}
          triangle={triangle}
          morpherImage={morpherImage}
          onSplit={() => handleEdgeSplit(triangle.p3, triangle.p1)}
        />,
      ])}

      {/* Menu */}
      <div className="menu">
        <button title="Load image" data-action="openFile" onClick={handleFileClick}>
          <div className="icon replace">📁</div>
        </button>
        <button
          title="Move image"
          data-action="move"
          className={moveMode ? 'selected' : ''}
          onClick={handleMoveToggle}
        >
          <div className="icon move">✋</div>
        </button>
        <button title="Delete" data-action="delete" onClick={handleDelete}>
          <div className="icon delete">×</div>
        </button>
        <input
          type="range"
          name="targetWeight"
          min="0"
          max="1"
          step="0.01"
          value={image.targetWeight}
          onChange={(e) => onWeightChange(e.target.value)}
        />
        <input
          type="file"
          name="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept="image/*"
          style={{ display: 'none' }}
        />
        <input
          type="text"
          name="url"
          value={image.url}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="Image URL or name"
        />
      </div>
    </Tile>
  );
}

// Build pattern for triangle fill
function buildPattern(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  ctx.lineCap = 'square';

  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w / 2, h);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, h);
  ctx.stroke();

  return ctx.createPattern(canvas, 'repeat');
}
