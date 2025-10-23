import React, { useState } from 'react';
import { useProjects } from '../hooks/useProjects.js';
import { Project } from './Project.jsx';
import { Popup } from './Popup.jsx';

export function Main() {
  const {
    projects,
    currentProject,
    currentIndex,
    setCurrentIndex,
    addProject,
    deleteProject,
    updateProject,
    saveProject,
  } = useProjects();

  const [showHelp, setShowHelp] = useState(false);

  const handlePrevProject = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNextProject = () => {
    if (currentIndex < projects.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleNameChange = (e) => {
    updateProject(currentIndex, { name: e.target.value });
  };

  const handleDeleteProject = () => {
    deleteProject(currentIndex);
  };

  const hasProjects = projects.length > 0;

  return (
    <>
      <div className="menu">
        <button
          data-action="previousProject"
          title="Previous project"
          disabled={currentIndex === 0}
          onClick={handlePrevProject}
        >
          <div className="standalone icon previous">&#9664;</div>
        </button>

        <input
          type="text"
          name="name"
          value={currentProject?.name || ''}
          onChange={handleNameChange}
          disabled={!hasProjects}
        />

        <button
          data-action="nextProject"
          title="Next project"
          disabled={currentIndex === projects.length - 1}
          onClick={handleNextProject}
        >
          <div className="standalone icon next">&#9654;</div>
        </button>

        <button data-action="addProject" onClick={addProject}>
          <div className="icon new">+</div>
          New project
        </button>

        <button
          data-action="deleteProject"
          onClick={handleDeleteProject}
          disabled={!hasProjects}
        >
          <div className="icon delete">×</div>
          Delete this project
        </button>

        <hr />

        <div className="project-menus">
          {projects.map((project, index) => (
            <ProjectMenu
              key={project.id || index}
              project={project}
              isActive={index === currentIndex}
              onSave={() => saveProject(index)}
            />
          ))}
        </div>

        <hr />

        <button data-action="help" onClick={() => setShowHelp(true)}>
          <div className="icon help">?</div>
          Help
        </button>
      </div>

      {projects.map((project, index) => (
        <Project
          key={project.id || index}
          project={{ ...project, index }}
          isVisible={index === currentIndex}
          updateProject={updateProject}
          saveProject={saveProject}
        />
      ))}

      {showHelp && (
        <Popup onClose={() => setShowHelp(false)} title="Help">
          <HelpContent />
        </Popup>
      )}
    </>
  );
}

function ProjectMenu({ project, isActive, onSave }) {
  if (!isActive) return null;

  return (
    <div className="project-menu visible" style={{ backgroundColor: project.color }}>
      {/* Project-specific buttons will be rendered by Project component */}
    </div>
  );
}

function HelpContent() {
  return (
    <div className="help-content">
      <h2>MorpherJS GUI Editor</h2>
      <h3>Getting Started</h3>
      <ol>
        <li>Click "Add image" to add images to your project</li>
        <li>Click on the image canvas to add mesh points</li>
        <li>Select 3 points to create a triangle</li>
        <li>Adjust image weights with sliders to see the morph</li>
      </ol>

      <h3>Controls</h3>
      <ul>
        <li><strong>Add image:</strong> Add a new image to the project</li>
        <li><strong>Load image:</strong> Choose an image file from your computer</li>
        <li><strong>Move image:</strong> Toggle move mode to reposition images</li>
        <li><strong>Delete image:</strong> Remove the image from the project</li>
        <li><strong>Blend function:</strong> Customize how images are blended together</li>
        <li><strong>Final touch function:</strong> Apply post-processing to the result</li>
        <li><strong>Export code:</strong> Get the JSON configuration for your morph</li>
      </ul>

      <h3>Mesh Editing</h3>
      <ul>
        <li>Click on the canvas to add a point</li>
        <li>Drag points to adjust the mesh</li>
        <li>Click midpoints on triangle edges to split them</li>
        <li>Select 3 points to create a triangle</li>
      </ul>

      <h3>Tips</h3>
      <ul>
        <li>Add corresponding points on all images for best results</li>
        <li>Create triangles to define how the mesh deforms</li>
        <li>Use the weight sliders to preview different morphs</li>
        <li>Export the code to use in your own projects</li>
      </ul>
    </div>
  );
}
