# Phase 1: Basic Scan History Storage and Integration

## Goals
- Implement persistent scan history storage in IndexedDB (Dexie), repurposing the `audits` table.
- Integrate scan history recording into the scan flow, before collection matching logic.
- Expose scan history to the collection view for unmatched scans tab.

## Scope
- Data model as defined in PRD (core fields, enums, schema version).
- Add, update, retrieve, and clear scan history entries.
- UI: Show unmatched scans in collection view; empty state handling.
- Privacy: Local-only storage, clear history action in Settings.

## Out of Scope
- Retroactive association (handled in Phase 2).
- Export/import, advanced filtering, or dedicated scan history page.

## Deliverables
- Dexie schema migration and type definitions.
- Scan history context/provider and hooks.
- Integration with scan flow and collection view.
- Manual test checklist for add, update, clear, and unmatched tab display.

## Success Criteria
- All scans are recorded and surfaced in the unmatched tab.
- History can be cleared from Settings.
- No regressions in scan or collection flows.

