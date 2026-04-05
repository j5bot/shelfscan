# PRD: Data Builder — Form Builder Feature

## Overview

Add a form builder page to ShelfScan that allows users to create, save, and edit data forms using the `@formio/js` and `@formio/react` libraries. Forms are stored in the existing Dexie IndexedDB database under a new `dataforms` collection.

## Goals

- Allow users to build custom data forms visually using a drag-and-drop builder
- Persist form schemas locally in Dexie (`dataforms` collection) with auto-generated IDs
- Allow users to name their forms
- Allow users to load and edit any previously saved form
- Integrate naturally into the existing ShelfScan navigation

## Non-Goals

- Rendering/submitting forms to collect data (the builder is for designing schemas only, at this stage)
- Cloud sync or sharing forms
- Supporting all formio field types (several are disabled per requirements)

## Disabled Field Types

The following formio field types will be **disabled** in the builder:

- Password
- Survey
- Signature
- Email
- Address
- Phone Number
- HTML Element
- File

## User Stories

1. **As a user**, I want to navigate to the Data Builder from the navigation drawer, above the Settings item.
2. **As a user**, I want to type a name for my form and build it using a drag-and-drop builder.
3. **As a user**, I want to click "Save" to persist my form (name + schema) to the local database.
4. **As a user**, I want to click "Open" to see a list of saved forms and select one to continue editing.
5. **As a user**, I want the builder to load my selected form so I can edit and re-save it.

## Technical Plan

### New Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@formio/js` | `^5.3.2` | Core form builder and renderer |
| `@formio/react` | `^6.2.0` | React wrapper for formio builder |

### Database Changes

Add a new `dataforms` collection to the existing Dexie `db` database (new version 4):

```typescript
export type DataFormEntity = {
    id?: number;    // auto-generated numeric primary key
    name: string;
    schema: object;
};

database.version(4).stores({
    settings: '++id',
    plugins: '++id',
    collections: '++id',
    scanned: '++id',
    dataforms: '++id',
});
```

### New Files

| File | Purpose |
|---|---|
| `src/app/(overview)/data-builder/page.tsx` | Next.js page at `/data-builder` |
| `src/app/ui/DataBuilder.tsx` | Main form builder component |

### Modified Files

| File | Change |
|---|---|
| `src/app/lib/database/database.ts` | Add `dataforms` collection and entity type |
| `src/app/ui/NavDrawer.tsx` | Add "Data Builder" link above Settings |

### Component Design

The `DataBuilder` component will:

1. Dynamically import `@formio/react` `FormBuilder` (client-side only, no SSR)
2. Show a text input for the form name at the top
3. Show "Save" and "Open" action buttons
4. Render the formio builder below with disabled field types
5. On "Save": write `{ name, schema }` to Dexie `dataforms` (add or update)
6. On "Open": show a DaisyUI modal dialog listing all saved forms; clicking a form loads it into the builder

### Builder Configuration

Disabled components will be specified in the formio builder config object:

```javascript
{
    basic: {
        components: {
            password: false,
            survey: false,
            signature: false,
            email: false,
            address: false,
            phoneNumber: false,
            htmlelement: false,
            file: false,
        }
    },
    advanced: {
        components: {
            password: false,
            survey: false,
            signature: false,
            email: false,
            address: false,
            phoneNumber: false,
            htmlelement: false,
            file: false,
        }
    },
    premium: false,
}
```

### Navigation Integration

A new menu item "Data Builder" with an icon will be added to the second `<ul>` in `NavDrawer.tsx`, placed above the existing Settings item. The icon will be `FaWpforms` or `FaTableList` from `react-icons/fa6`.

## Acceptance Criteria

- [ ] `/data-builder` route exists and renders the form builder
- [ ] Navigation drawer contains a "Data Builder" link above Settings
- [ ] Disabled field types do not appear in the builder toolbar
- [ ] User can type a form name
- [ ] Clicking "Save" stores the form name + schema in Dexie `dataforms`
- [ ] Clicking "Open" shows a dialog with all saved forms
- [ ] Selecting a saved form loads it into the builder (name + schema)
- [ ] Re-saving a loaded form updates the existing record
- [ ] Build and lint pass with no errors
