# 008 Play Logging

## Overview

The current shelfscan app logs a simple play through the extension.  It defaults to the current 
date and logs a single play with no other information.

A form has been started (`DetailedPlayForm`) to allow entering more information about the play, but 
it is not yet complete.  The form should also be moved to a modal dialog, necessitating changes to the 
`makeModeBlock` function and general flow of communicating with the extension to send data/messages.

## Requirements

New message types need to be added to the extension to load information from BGG.

These include `getPlayers`, `getLocations`, and `searchPlayer`.

Fields / values that can be set in the form / modal include the following:

- Play date (date picker)
- Play quantity (number input)
- Location (dropdown with search / add new)
- Duration (30 min, 1 hr, 2 hr, 3 hr, other)
- Incomplete (checkbox)
- Players (dropdown with search / add new, multiple select)

## Phases

### Phase 1: Add New Message Types

- [ ] Add `getPlayers` message type to extension
- [ ] Add `getLocations` message type to extension
- [ ] Add `searchPlayer` message type to extension

### Phase 2: Implement Detailed Play Form

- [ ] Add form field for play date with date picker to top of `DetailedPlayForm`
  - Only allow dates in the past and present, not future dates
- [ ] Add form field for play quantity with number input to `DetailedPlayForm`
- [ ] Add form field for location with dropdown and search/add new functionality to `DetailedPlayForm`
  - Search functionality should be limited to those locations returned by the `getLocations` 
    message response, and should not query BGG for additional locations
  - If the user enters a location that is not in the dropdown, it should be added to the dropdown options and selected
- [ ] Add form field for duration with predefined options and "other" option to `DetailedPlayForm`
  - When other is selected, a number input should appear to allow the user to enter a custom duration in minutes
- [ ] Add form field for incomplete status with checkbox to `DetailedPlayForm`
- [ ] Add form field for players with dropdown, search/add new functionality, and multiple select to `DetailedPlayForm`
  - A list of the players returned from the `getPlayers` message type should be displayed in the 
    dropdown, allowing for multiple selection without a search being performed

### Phase 3: Player Search Functionality

- [ ] Implement search functionality for players in the player dropdown of `DetailedPlayForm`
  - Search functionality should utilize the `searchPlayer` message type to query BGG for 
    existing players and wait for the response before displaying results in the dropdown.
  - A user should be able to hit enter after typing in the search box to add a new player if the
    desired player is not found in the search results.  This should add the new player to the 
    dropdown options and select it.

### Phase 4: Modal Dialog Integration
- [ ] Refactor `DetailedPlayForm` to be displayed in a modal dialog, similar to the 
  collection details dialog, instead of directly on the page
  - Execute the `addFn` function to submit the play log using the pink style button
  - Include a cancel button to close the modal without submitting the play log

### Phase 5: Color Picker and Miscellaneous Improvements

- [ ] Replace the color input for the play log with a color picker that allows users to select 
  from a predefined set of named CSS colors
  - Colors are: Red, Yellow, Green, Blue, White, Black, Gray, Orange, Purple, Pink, Tan, Brown, 
    Lime, Lavender, Navy, Olive, Teal, Silver, Gold (using color names)
  - Picker should be a tooltip-like dropdown that appears when the user clicks on the color input,
    as wide as the play data input row, and should display the color options in a grid format with the color name displayed on hover
  - When a color is selected, the color input should be updated to show the selected color
  - When no color is selected, the color input should display an opaque rainbow gradient with a 
    line through it, indicating that no color is selected, and the play log should be logged without a color value
- [ ] When the detail form is closed, play data should be cleared
- [ ] Add a confirmation message when the play log is completed, indicating that a play of the 
  specified game on the specified date has been logged