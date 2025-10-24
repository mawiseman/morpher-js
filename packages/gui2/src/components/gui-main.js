import { BaseComponent } from '../utils/base-component.js';
import { ProjectModel } from '../models/Project.js';
import './gui-project.js';

/**
 * MainView - Main GUI container with project management
 */
export class GuiMain extends BaseComponent {
  constructor() {
    super();
    this.projects = [];
    this.currentIndex = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadProjects();
    this.showProject(this.currentIndex);
  }

  template() {
    return `
      <div class="gui-main">
        <div class="menu">
          <div class="logo">MorpherJS GUI</div>
          <div class="controls">
            <button data-action="help" title="Help">?</button>
            <button data-action="addProject">+ New Project</button>
            <button data-action="previousProject" ${this.currentIndex === 0 ? 'disabled' : ''}>←</button>
            <input type="text" name="name" placeholder="Project Name" ${this.projects.length === 0 ? 'disabled' : ''}>
            <button data-action="nextProject" ${this.currentIndex >= this.projects.length - 1 ? 'disabled' : ''}>→</button>
            <button data-action="deleteProject" ${this.projects.length === 0 ? 'disabled' : ''}>Delete</button>
          </div>
          <div class="project-menus"></div>
        </div>
        <div class="projects"></div>
      </div>
    `;
  }

  attachEventListeners() {
    // Menu button clicks
    this.$$('[data-action]').forEach(btn => {
      this.on(btn, 'click', (e) => {
        const action = e.target.dataset.action;
        if (this[action]) {
          this[action]();
        }
      });
    });

    // Project name change
    const nameInput = this.$('input[name=name]');
    if (nameInput) {
      this.on(nameInput, 'change', (e) => {
        if (this.projects[this.currentIndex]) {
          this.projects[this.currentIndex].name = e.target.value;
          this.projects[this.currentIndex].save();
        }
      });
    }
  }

  /**
   * Load all projects from storage
   */
  loadProjects() {
    this.projects = ProjectModel.loadAll();

    // Create project views
    const container = this.$('.projects');
    const menuContainer = this.$('.project-menus');

    this.projects.forEach((project, index) => {
      const projectView = document.createElement('gui-project');
      projectView.setProject(project);
      projectView.style.display = index === this.currentIndex ? 'block' : 'none';
      container.appendChild(projectView);

      // Add to menu container if needed
      // menuContainer.appendChild(projectView.menuElement);
    });
  }

  /**
   * Show project at index
   */
  showProject(index) {
    if (this.projects.length === 0) {
      this.updateMenu(null);
      return;
    }

    // Hide all projects
    this.$$('gui-project').forEach(pv => pv.hide());

    // Show selected project
    this.currentIndex = Math.max(0, Math.min(this.projects.length - 1, index));
    const projectViews = this.$$('gui-project');
    if (projectViews[this.currentIndex]) {
      projectViews[this.currentIndex].show();
    }

    this.updateMenu(this.projects[this.currentIndex]);
  }

  /**
   * Update menu UI
   */
  updateMenu(project) {
    const nameInput = this.$('input[name=name]');
    const prevBtn = this.$('[data-action=previousProject]');
    const nextBtn = this.$('[data-action=nextProject]');
    const deleteBtn = this.$('[data-action=deleteProject]');
    const menu = this.$('.menu');

    if (project) {
      nameInput.value = project.name;
      nameInput.disabled = false;
      prevBtn.disabled = this.currentIndex === 0;
      nextBtn.disabled = this.currentIndex >= this.projects.length - 1;
      deleteBtn.disabled = false;
      menu.style.backgroundColor = project.color;
    } else {
      nameInput.value = '';
      nameInput.disabled = true;
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      deleteBtn.disabled = true;
      menu.style.backgroundColor = '';
    }
  }

  /**
   * Add new project
   */
  addProject() {
    const project = new ProjectModel({ name: 'New Project' });
    project.save();
    this.projects.push(project);

    // Create view
    const projectView = document.createElement('gui-project');
    projectView.setProject(project);
    this.$('.projects').appendChild(projectView);

    // Show new project
    this.showProject(this.projects.length - 1);
  }

  /**
   * Delete current project
   */
  deleteProject() {
    const project = this.projects[this.currentIndex];
    if (!project) return;

    if (confirm(`Are you sure you want to delete '${project.name}'?`)) {
      project.destroy();

      // Remove view
      const projectViews = this.$$('gui-project');
      projectViews[this.currentIndex].remove();

      // Remove from array
      this.projects.splice(this.currentIndex, 1);

      // Show previous project
      this.showProject(this.currentIndex - 1);
      this.render();
    }
  }

  /**
   * Go to previous project
   */
  previousProject() {
    this.showProject(this.currentIndex - 1);
  }

  /**
   * Go to next project
   */
  nextProject() {
    this.showProject(this.currentIndex + 1);
  }

  /**
   * Show help popup
   */
  help() {
    alert('MorpherJS GUI\n\nCreate morphing projects visually.\n\n- Add images\n- Drag points to create mesh\n- Adjust weights\n- Export to JSON');
  }
}

customElements.define('gui-main', GuiMain);
