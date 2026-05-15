# 007 Not In Collection Improvements

## Overview

Users should be able to select items from the "Not in Collection" tab and add them to their 
collection.

## Requirements

- Button to turn on selection mode in the "Not in Collection" tab.
- Ability to select multiple items from the "Not in Collection" tab by clicking on the ListGame 
  entry, with selected items denoted by a large checkmark icon in a circle in the center of the 
  entry.
- Entries which don't have a game id should not be selectable and should have an X icon in a 
  circle in the center of the entry to indicate that they cannot be selected.
- Button to add selected items to the collection.
- Confirmation dialog before adding items to the collection.
- Feedback to the user after items have been added to the collection (e.g., success message

## Implementation Notes

- Reuse the existing BatchAddButton component for the "Add to Collection" button.
- Use the same toast pattern from the batch scan page to provide feedback to the user after adding items to the collection.

