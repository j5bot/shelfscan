# Phase 2: Retroactive Association and Advanced Duplicate Handling

## Goals
- Allow retroactive association of scan history entries with a BGG username after login.
- Add scan history settings UI for user-initiated association.
- Improve duplicate scan handling and user feedback.

## Scope
- Update scan history entries with username when user logs in (manual action in settings).
- UI: Add scan history settings section for retroactive association and clear history.
- Duplicate logic: Enforce 5-minute window, show user messages as specified in PRD.

## Out of Scope
- Export/import, advanced analytics, or dedicated scan history page.

## Deliverables
- Migration logic for associating anonymous scans.
- Settings UI for scan history management.
- User feedback for duplicate scans.
- Manual test checklist for retroactive association and duplicate handling.

## Success Criteria
- Users can associate anonymous scans with their BGG account after login.
- Duplicate scans are handled and surfaced as specified.
- No data loss or regressions in scan history.

