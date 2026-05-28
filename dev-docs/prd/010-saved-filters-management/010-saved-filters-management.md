# 010: Saved Filters Management

## Overview

Users should be able to rename, delete, and duplicate saved filters via a Saved Filters 
Management modal.

## Requirements

- [ ] Add an entry "Manage..." after a divider in the saved filters list
- [ ] clicking on the manage entry should open a modal which presents a list of the currently 
  saved filters
  - The modal should be substantially similar to other current modals (search the codebase for them 
    with the 
    keyword modal)
- [ ] the modal should have a close button in the upper right using the Fa6/FaXMark icon
- [ ] the list should be limited in height by the height of the modal, requiring scrolling to see 
  additional filters beyond what fits in the viewport
- [ ] each entry in the list should offer actions to rename, delete, and duplicate the filter
- [ ] rename, delete, and duplicate action buttons should be represented by Cg/CgRename, 
  Fa6/FaXMark, and Fa/FaCopy icons, respectively
- [ ] rename action should use a simple javascript prompt for now
- [ ] saving or renaming a preset with the same name as an existing preset should be blocked
- [ ] duplicating a preset should add or update an incremental suffix like (1), (2), (3), etc.
- [ ] updates should be immediate, there is no 'save' or 'cancel' button to apply changes
- [ ] the modal title should be 'Filter Management'