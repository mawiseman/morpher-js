import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useImages } from '../hooks/useImages.js';
import { ImageTile } from './ImageTile.jsx';
import { Tile } from './Tile.jsx';
import { Popup } from './Popup.jsx';

export function Project({ project, projectIndex, isActive, updateProject, saveProject }) {
  const { images, addImage, deleteImage, updateImage, setImageFile, setImageWeight } =
    useImages(project, projectIndex, updateProject, saveProject);

  const [selectedPoints, setSelectedPoints] = useState([]);
  const [highlightedPoint, setHighlightedPoint] = useState(null);
  const [showCodePopup, setShowCodePopup] = useState(false);
  const [showBlendPopup, setShowBlendPopup] = useState(false);
  const [showFinalTouchPopup, setShowFinalTouchPopup] = useState(false);

  const previewCanvasRef = useRef(null);
  const [menuContainer, setMenuContainer] = useState(null);

  // Get menu container on mount
  useEffect(() => {
    const container = document.getElementById('project-menus');
    if (container) {
      setMenuContainer(container);
    }
  }, []);

  // Handler functions
  const handleAddImage = () => {
    console.log('Project.handleAddImage called');
    addImage();
  };

  const handleExport = () => {
    setShowCodePopup(true);
  };

  const handleEditBlend = () => {
    setShowBlendPopup(true);
  };

  const handleEditFinalTouch = () => {
    setShowFinalTouchPopup(true);
  };

  // Update canvas size when morpher resizes
  useEffect(() => {
    if (!project || !project.morpher) return;

    const handleResize = (morpher, canvas) => {
      // Canvas size is already set by morpher
    };

    const handleLoad = (morpher, canvas) => {
      // Initial load
    };

    project.morpher.on('resize', handleResize);
    project.morpher.on('load', handleLoad);

    return () => {
      project.morpher.off('resize', handleResize);
      project.morpher.off('load', handleLoad);
    };
  }, [project]);

  // Attach morpher canvas to preview when active
  useEffect(() => {
    if (!isActive || !project || !previewCanvasRef.current) return;

    const artboard = previewCanvasRef.current.querySelector('.artboard');
    if (artboard && project.morpher.canvas) {
      // Clear existing canvas
      while (artboard.firstChild) {
        artboard.removeChild(artboard.firstChild);
      }
      artboard.appendChild(project.morpher.canvas);
    }
  }, [isActive, project]);

  const getExportCode = () => {
    const json = project.morpher.toJSON();
    // Replace with actual URLs
    for (let i = 0; i < json.images.length; i++) {
      if (images[i]) {
        json.images[i].src = images[i].url;
      }
    }
    return JSON.stringify(json, null, 2);
  };

  const handlePointHighlight = (index, state, isMidpoint = false) => {
    setHighlightedPoint(state ? { index, isMidpoint } : null);
  };

  const handlePointSelect = (index) => {
    setSelectedPoints(prev => {
      const i = prev.indexOf(index);
      let newSelected;

      if (i !== -1) {
        // Deselect
        newSelected = prev.filter(p => p !== index);
      } else {
        // Select
        newSelected = [...prev, index];
      }

      // If 3 points selected, create triangle
      if (newSelected.length === 3) {
        project.morpher.addTriangle(newSelected[0], newSelected[1], newSelected[2]);
        saveProject(projectIndex);
        return [];
      }

      return newSelected;
    });
  };

  const handleUpdateBlendFunction = (code) => {
    try {
      const fn = new Function('destination', 'source', 'weight', code);
      project.morpher.blendFunction = fn;
      project.morpher.draw();
      updateProject(projectIndex, { blendFunction: code });
      saveProject(projectIndex);
    } catch (err) {
      alert(`Error in blend function: ${err.message}`);
    }
  };

  const handleUpdateFinalTouchFunction = (code) => {
    try {
      const fn = new Function('canvas', code);
      project.morpher.finalTouchFunction = fn;
      project.morpher.draw();
      updateProject(projectIndex, { finalTouchFunction: code });
      saveProject(projectIndex);
    } catch (err) {
      alert(`Error in final touch function: ${err.message}`);
    }
  };

  const tiles = [...images];
  const middleIndex = Math.floor(tiles.length / 2);

  // Render project menu using portal
  const projectMenu = menuContainer && isActive ? createPortal(
    <div className="project-menu visible" style={{ backgroundColor: project.color }}>
      <button data-action="addImage" onClick={handleAddImage}>
        <div className="icon image">📷</div>
        Add image
      </button>
      <button data-action="editBlendFunction" onClick={handleEditBlend}>
        <div className="icon editFunction">ƒ</div>
        Blend function
      </button>
      <button data-action="editFinalTouchFunction" onClick={handleEditFinalTouch}>
        <div className="icon editFunction">ƒ</div>
        Final touch function
      </button>
      <button data-action="export" onClick={handleExport}>
        <div className="icon export">↓</div>
        Export code
      </button>
    </div>,
    menuContainer
  ) : null;

  if (!isActive) {
    return projectMenu;
  }

  return (
    <>
      {projectMenu}
      <div className="project visible">
        {/* Images with preview in the middle */}
        {images.map((image, index) => {
          // Insert preview tile in the middle
          const position = index < middleIndex ? index : index + 1;
          const count = images.length + 1;

          return (
            <ImageTile
              key={image.id || index}
              image={image}
              imageIndex={index}
              project={project}
              position={{ x: position / count, y: 0, width: 1 / count, height: 1 }}
              onDelete={() => deleteImage(index)}
              onUpdate={(updates) => updateImage(index, updates)}
              onFileChange={(file) => setImageFile(index, file)}
              onWeightChange={(weight) => setImageWeight(index, weight)}
              onPointHighlight={handlePointHighlight}
              onPointSelect={handlePointSelect}
              highlightedPoint={highlightedPoint}
              selectedPoints={selectedPoints}
              onSave={() => saveProject(projectIndex)}
            />
          );
        })}

        {/* Preview tile */}
        <Tile
          ref={previewCanvasRef}
          position={{
            x: middleIndex / (images.length + 1),
            y: 0,
            width: 1 / (images.length + 1),
            height: 1
          }}
        />
      </div>

      {/* Popups */}
      {showCodePopup && (
        <Popup onClose={() => setShowCodePopup(false)} title="Export Code">
          <div>
            <p>Copy this JSON configuration to use in your project:</p>
            <textarea
              className="code"
              value={getExportCode()}
              readOnly
              rows={20}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px' }}
              onFocus={(e) => e.target.select()}
            />
          </div>
        </Popup>
      )}

      {showBlendPopup && (
        <EditFunctionPopup
          title="Edit Blend Function"
          initialCode={project.blendFunction || ''}
          onSave={handleUpdateBlendFunction}
          onClose={() => setShowBlendPopup(false)}
          helpText="Function signature: (destination, source, weight) => void"
        />
      )}

      {showFinalTouchPopup && (
        <EditFunctionPopup
          title="Edit Final Touch Function"
          initialCode={project.finalTouchFunction || ''}
          onSave={handleUpdateFinalTouchFunction}
          onClose={() => setShowFinalTouchPopup(false)}
          helpText="Function signature: (canvas) => void"
        />
      )}
    </>
  );
}

function EditFunctionPopup({ title, initialCode, onSave, onClose, helpText }) {
  const [code, setCode] = useState(initialCode);

  const handleSave = () => {
    onSave(code);
    onClose();
  };

  return (
    <Popup onClose={onClose} title={title}>
      <div>
        <p>{helpText}</p>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={15}
          style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px' }}
          placeholder="Enter function body here..."
        />
        <div style={{ marginTop: '10px', textAlign: 'right' }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave} style={{ marginLeft: '10px' }}>Save</button>
        </div>
      </div>
    </Popup>
  );
}
