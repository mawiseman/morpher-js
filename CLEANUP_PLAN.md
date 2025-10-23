# Cleanup Plan - Legacy Files Removal

## Files Identified for Removal

### 1. Ruby/Middleman Files (No Longer Needed)

**Why Remove:** We've migrated from Middleman (Ruby) to Vite (Node.js)

- `Gemfile` - Ruby dependencies
- `Gemfile.lock` - Ruby dependency lock file
- `config.rb` - Middleman configuration

**Status:** Safe to remove ✅

---

### 2. CoffeeScript Source Directory (No Longer Needed)

**Why Remove:** All CoffeeScript files have been migrated to ES6+ JavaScript

**Directory:** `source/`

**Contents:**
- 19 CoffeeScript files (`.coffee`)
- HAML templates (`.haml`)
- SASS stylesheets (`.sass`)
- Old vendor libraries (jQuery, Underscore, Backbone)
- Fonts and images (moved to examples/)

**CoffeeScript Files:**
```
source/javascripts/morpher/lib/
├── morpher.js.coffee          → migrated to src/morpher.js
├── image.js.coffee            → migrated to src/image.js
├── mesh.js.coffee             → migrated to src/mesh.js
├── point.js.coffee            → migrated to src/point.js
├── triangle.js.coffee         → migrated to src/triangle.js
├── _event_dispatcher.js.coffee → migrated to src/event-dispatcher.js
└── _matrix.js.coffee          → migrated to src/matrix.js

source/javascripts/views/
├── image.js.coffee            → GUI (deferred)
├── main.js.coffee             → GUI (deferred)
├── popup.js.coffee            → GUI (deferred)
└── ... (other view files)     → GUI (deferred)

source/javascripts/models/
├── image.js.coffee            → GUI (deferred)
└── project.js.coffee          → GUI (deferred)
```

**Status:** Safe to remove entire directory ✅

**Note:** GUI migration was intentionally deferred. If GUI is needed in future, it will be rebuilt with modern framework (React/Vue/Svelte), not from these old CoffeeScript files.

---

### 3. Test Files in Root (Should Be Organized)

**Current Location:** Root directory

- `test-event-dispatcher.js` - Event system tests
- `test-security.js` - Security validation tests

**Recommendation:** Create `tests/` directory or remove if only for development

**Options:**
1. Move to `tests/` directory for future test suite
2. Remove if they were only for development verification
3. Keep in root if they're useful for quick testing

**Status:** Pending decision 🤔

---

## What to Keep

### Keep - Still Used

- `src/` - Modern ES6+ JavaScript source
- `examples/` - Demo applications
- `dist/` - Build output (generated)
- `node_modules/` - Node dependencies (generated)
- `public/` - Public assets
- `package.json` - Node dependencies
- `package-lock.json` - Dependency lock file
- `vite.config.js` - Build configuration
- `index.html` - Examples launcher
- Documentation files (*.md)

---

## Removal Plan

### Phase 1: Ruby Files
```bash
rm Gemfile
rm Gemfile.lock
rm config.rb
```

### Phase 2: CoffeeScript Source
```bash
rm -rf source/
```

### Phase 3: Test Files (Choose One)

**Option A - Organize:**
```bash
mkdir tests
mv test-event-dispatcher.js tests/
mv test-security.js tests/
```

**Option B - Remove:**
```bash
rm test-event-dispatcher.js
rm test-security.js
```

### Phase 4: Update .gitignore
Remove Middleman-specific entries:
- .bundle
- .sass-cache

---

## Verification After Cleanup

1. **Build still works:**
   ```bash
   npm run build
   ```

2. **Dev server still works:**
   ```bash
   npm run dev
   ```

3. **Examples still load:**
   - Open http://localhost:3000
   - Verify demos work

4. **No broken references:**
   - Check for any imports from `source/`
   - Verify no references to `.coffee` files

---

## Impact Assessment

### Disk Space Saved
- Ruby files: ~4 KB
- source/ directory: ~1.5 MB
- Total: ~1.5 MB

### Cleanup Benefits
- ✅ Clearer project structure
- ✅ Removes confusion (one source of truth: `src/`)
- ✅ No misleading legacy files
- ✅ Easier for new contributors

### Risks
- ⚠️ If someone needs old GUI code for reference
  - **Mitigation:** It's in Git history, can always retrieve
  - **Better:** Modern GUI should be built from scratch with modern framework

---

## Recommendations

### Immediate (Low Risk)
1. ✅ Remove Ruby files (Gemfile, config.rb)
2. ✅ Remove source/ directory (all migrated)

### Consider (Medium Risk)
3. 🤔 Move test files to tests/ directory
   - Keeps them organized
   - Available for future test suite

### Future
4. Update documentation to reflect cleanup
5. Add note in README about GUI migration status

---

## Git Commit Message Template

```
chore: remove legacy Ruby and CoffeeScript files

Remove Middleman (Ruby) and CoffeeScript files after migration to Vite and ES6+

Removed:
- Gemfile, Gemfile.lock, config.rb (Ruby/Middleman)
- source/ directory (19 .coffee files + templates)
- Old vendor libraries (jQuery, Backbone, Underscore)

All functionality has been migrated to:
- src/ (ES6+ JavaScript)
- examples/ (Modern demos)

GUI migration intentionally deferred - will be rebuilt with modern framework when needed.

Closes #migration-phase1
```

---

## Final Checklist

Before removing files:
- [ ] Verify all CoffeeScript files have ES6+ equivalents
- [ ] Confirm no imports from source/
- [ ] Test build and dev server
- [ ] Update documentation
- [ ] Commit changes with clear message

After removing files:
- [ ] Verify build works
- [ ] Verify examples work
- [ ] Update .gitignore
- [ ] Update README
- [ ] Push to repository
