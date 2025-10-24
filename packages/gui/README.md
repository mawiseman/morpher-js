# MorpherJS GUI

Web-based visual editor for the MorpherJS image morphing library, built with Web Components and Vite.

## Features

- **Visual Mesh Editor**: Interactive canvas-based editor for defining morph geometry
- **Multi-Project Management**: Create and manage multiple morphing projects
- **Real-time Preview**: See morphing results as you adjust weights
- **Persistent Storage**: Projects automatically saved to browser localStorage
- **JSON Export**: Export configurations for use in standalone applications

## Technology Stack

- **Build Tool**: Vite 5.x
- **UI Framework**: Web Components (Custom Elements v1)
- **Language**: ES2022+ JavaScript
- **Styling**: CSS3 with CSS Custom Properties
- **Template Rendering**: lit-html
- **Testing**: Vitest

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start dev server with HMR
npm run dev

# Open http://localhost:3000
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Linting & Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
packages/gui/
├── public/           # Static assets
│   ├── fonts/        # Icon fonts
│   └── images/       # Sample images
├── src/
│   ├── components/   # Web Components
│   ├── models/       # State management
│   ├── utils/        # Utility functions
│   ├── styles/       # Global styles
│   ├── main.js       # Entry point
│   └── index.html    # HTML template
├── tests/            # Test files
└── dist/             # Build output
```

## Usage

### Basic Workflow

1. **Create Project**: Click "New Project" to start
2. **Add Images**: Upload images or enter URLs
3. **Define Mesh**: Click canvas to add points, create triangles
4. **Adjust Weights**: Use sliders to blend between images
5. **Export**: Generate JSON configuration for production use

### Keyboard Shortcuts

- `Ctrl/Cmd + N` - New project
- `Ctrl/Cmd + ←` - Previous project
- `Ctrl/Cmd + →` - Next project

## Architecture

The application follows a component-based architecture:

- **Components**: Web Components for UI (Shadow DOM for encapsulation)
- **Models**: Plain JavaScript classes extending EventTarget for state
- **Storage**: localStorage for persistence
- **Events**: CustomEvent for component communication

See [PLANNING.md](../../PLANNING.md) for detailed architecture documentation.

## Development Status

**Phase 1: Foundation & Setup** ✅ Complete
- Package structure created
- Build system configured
- Base styles and assets in place

**Next Steps**: Implement core components and state management

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../../LICENSE)
