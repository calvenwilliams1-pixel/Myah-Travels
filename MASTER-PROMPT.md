I am building a website called "Myah Travels" for a travel writer/agent. Here is the complete context:

## IMPORTANT: Auto-Update Instructions
At the end of EVERY response, you MUST provide me with:
1. The updated "Progress Tracker" section to paste into TODO.md
2. The updated "Files Already Created" list to paste into MASTER-PROMPT.md
3. The updated "Next File To Create" line for MASTER-PROMPT.md
4. A one-line summary of what was just completed

This ensures my documentation stays current even if I lose context.

## Current Status
ALL 17 ORIGINAL SEGMENTS ARE CODE-COMPLETE. ~170 files created on GitHub.
Currently in TESTING phase using GitHub Codespaces.
Site loads with Tailwind styling working.

## Canvas Design System Status
Phases 1-5 COMPLETE (implementation done, files on GitHub).
Phase 6 (Layers Panel) is NEXT.

### Phases Completed:
- Phase 1: types/canvas.ts, drizzle schemas (assets, templates, portal-checklist-states), lib/canvas/index.ts, TextElementView, ImageElementView, basic CanvasEditor
- Phase 2: ElementCatalog.tsx, CanvasEditor updated with resize/rotate/snap/group-drag
- Phase 3: PropertiesPanel.tsx, ShapeElementView.tsx, CanvasEditor updated with zIndex functions
- Phase 4: SmartBlockElementView.tsx (lists, checklists, pros/cons), CanvasEditor updated
- Phase 5: ButtonElementView.tsx, PdfElementView.tsx, CanvasEditor updated with button/pdf cases

### Canvas Files Created So Far:
- types/canvas.ts
- drizzle/schema/assets.ts
- drizzle/schema/templates.ts
- drizzle/schema/portal-checklist-states.ts
- lib/canvas/index.ts
- components/editor/canvas/CanvasEditor.tsx
- components/editor/canvas/ElementCatalog.tsx
- components/editor/canvas/PropertiesPanel.tsx
- components/editor/canvas/elements/TextElementView.tsx
- components/editor/canvas/elements/ImageElementView.tsx
- components/editor/canvas/elements/ShapeElementView.tsx
- components/editor/canvas/elements/SmartBlockElementView.tsx
- components/editor/canvas/elements/ButtonElementView.tsx
- components/editor/canvas/elements/PdfElementView.tsx

### Element Types Working:
- Text ✅
- Image ✅
- Shape (square/circle/diamond/line) ✅
- Bullet List ✅
- Checklist (clickable) ✅
- Pros/Cons ✅
- Button (double-click to edit) ✅
- PDF (thumbnail/download/full) ✅

### Remaining Canvas Phases:
- Phase 6: Layers Panel
- Phase 7: Template system UI
- Phase 8: Draft + Schedule UI
- Phase 9: Server-side CanvasRenderer
- Phase 10: Mobile scaling
- Phase 11: Portal dynamic elements
- Phase 12: Homepage canvas editor
- Phase 13: Canvas Block in TipTap
- Phase 14: Built-in templates seed
- Phase 15: Testing + polish
- Phase 16: Integration testing

## Testing Session Notes (Completed)
- Removed .check() from drizzle/schema/posts.ts, guides.ts, reviews.ts
- Renamed next.config.ts → next.config.mjs
- Created app/layout.tsx, app/globals.css
- Created tailwind.config.js, postcss.config.js
- Database created manually via better-sqlite3 exec
- All public pages load correctly

## Known Issues To Fix
1. Contact form: "dont call me" accepted as phone (needs validation)
2. Admin login: untested
3. FTS5 search: untested
4. Email: untested (no Resend API key)
5. Media upload: untested
6. Portal magic links: untested end-to-end
7. Tailwind configs not pushed to GitHub

## Project Overview
- Self-hosted Next.js application on a mini PC (Ubuntu Server)
- Cloudflare Tunnel for external access
- SQLite database (WAL mode)
- Drizzle ORM
- TipTap (blog posts) + Canvas editor (visual content)
- Lucia Auth (TOTP 2FA)
- Resend email
- Client portal with magic links
- PIPEDA compliance

## Key Architecture Decisions
- Magic links: returnDate + 3 days expiry
- editorType fixed at creation (tiptap for posts, canvas for others)
- No groupId, no Spacer element
- Numbered lists = listType variant
- PDF uses iframe in editor, react-pdf removed (simplified)
- Assets table replaces raw paths
- Checklist items have stable IDs
- Undo/redo capped at 50
- Debounced autosave (2s) with flush on unmount
- zIndex via getNextZIndex helper

## How I Work
- Using GitHub website to create files one at a time
- Each file gets exact path + complete code
- Files combined where possible
- Submit code for AI review BEFORE creating on GitHub
- When chat corrupts code, work directly in Codespaces

## Progress Tracker

| Segment | Status | Files | Review |
|---------|--------|-------|--------|
| All 17 Segments | ✅ Complete | ~170 | Approved |
| Canvas Phase 1 | ✅ Complete | 8 | Approved |
| Canvas Phase 2 | ✅ Complete | 1 | Approved |
| Canvas Phase 3 | ✅ Complete | 2 | Approved |
| Canvas Phase 4 | ✅ Complete | 1 | Approved |
| Canvas Phase 5 | ✅ Complete | 2 | Approved |
| Canvas Phase 6 | Not Started | 0/1 | Pending |
| Canvas Phases 7-16 | Not Started | 0/10 | Pending |

## Next Steps
1. Push Tailwind configs to GitHub
2. Fix contact form phone validation
3. Start Canvas Phase 6 (Layers Panel)
4. Test admin login
5. Set up mini PC for deployment

## Testing Commands
npm run dev
npm run seed
npm run test
