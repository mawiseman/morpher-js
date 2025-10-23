# Build System Migration Guide

## Overview

MorpherJS is transitioning from Middleman (Ruby) to Vite (Node.js) for its build system.

## Current Status

- ✅ **Vite configured** - New build system ready
- ✅ **Development server configured** - Port 3000
- ✅ **Build outputs configured** - ESM, CJS, UMD formats
- ⏳ **Code migration pending** - CoffeeScript → ES6+ migration in progress
- ⏳ **Middleman still functional** - Old build system available until migration complete

## Using the OLD Build System (Current)

**Requirements:**
- Ruby (via RVM, rbenv, or system Ruby)
- Bundler gem

**Commands:**
```bash
# Install dependencies
bundle install

# Start development server
bundle exec middleman server

# Build for production
bundle exec middleman build
```

**Output:**
- Builds to `build/` directory
- Compiles CoffeeScript to JavaScript
- Processes SASS to CSS
- Combines files via Sprockets

**Access:**
- Development: http://localhost:4567
- GUI: http://localhost:4567/
- Demos: http://localhost:4567/demos.html

## Using the NEW Build System (Future)

**Requirements:**
- Node.js 18+
- npm (or pnpm/yarn)

**Commands:**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Output:**
- Builds to `dist/` directory
- Generates ES6 modules, CommonJS, and UMD bundles
- Creates source maps
- Minifies code with Terser

**Access:**
- Development: http://localhost:3000

## Migration Path

### Phase 1: Infrastructure (DONE)
- [x] Create `package.json`
- [x] Create `vite.config.js`
- [x] Create `src/` directory structure
- [x] Update `.gitignore`

### Phase 2: Code Migration (IN PROGRESS)
- [ ] Migrate CoffeeScript files to ES6+
- [ ] Update imports/exports
- [ ] Test migrated code

### Phase 3: Cutover (PENDING)
- [ ] Verify all functionality works with Vite
- [ ] Update documentation
- [ ] Remove Middleman dependencies
- [ ] Delete old `source/` directory

## Side-by-Side Comparison

| Aspect | Middleman (Old) | Vite (New) |
|--------|----------------|------------|
| **Language** | Ruby | Node.js |
| **Source** | CoffeeScript | ES6+ JavaScript |
| **Templates** | HAML | HTML |
| **Styles** | SASS | CSS (or SASS via plugin) |
| **Module System** | Sprockets | ES Modules |
| **Dev Server** | Rack (port 4567) | Vite (port 3000) |
| **Build Speed** | ~5-10s | ~1-2s |
| **Hot Reload** | Full page reload | HMR (instant) |
| **Output** | Single bundle | Multiple formats |

## Parallel Development

During migration, both systems can coexist:

```bash
# Terminal 1: Old system (for GUI development)
bundle exec middleman server

# Terminal 2: New system (for core library development)
npm run dev
```

## When to Remove Middleman

Middleman (and all Ruby dependencies) can be removed once:
1. ✅ All CoffeeScript files migrated to ES6+
2. ✅ GUI rebuilt (or decision made to skip GUI modernization)
3. ✅ All tests pass with new build
4. ✅ Demo/documentation sites work

## Files to Remove Later

Once migration is complete, these can be deleted:

- `Gemfile`
- `Gemfile.lock`
- `config.rb`
- `.bundle/`
- `.sass-cache/`
- `source/` (entire directory)

## Benefits of New System

- **50-80% faster builds** (Vite vs Middleman)
- **Instant HMR** (sub-second updates during development)
- **Better IDE support** (ES6 modules, TypeScript)
- **Modern tooling** (ESLint, Prettier, Vitest)
- **Smaller bundles** (tree-shaking, modern minification)
- **Multiple output formats** (ESM, CJS, UMD)
- **No Ruby dependency** (easier for JavaScript developers)
