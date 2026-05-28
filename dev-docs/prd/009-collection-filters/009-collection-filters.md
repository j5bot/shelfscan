# 009: Collection Filters Persistence and Saving

## Overview

Users need to be able to save a link to a set of filters, and also need to be able to save a set 
of filters as a custom, named preset.

## Requirements

- [ ] Update the URL query parameters to represent the current filter state when updating the 
      filters
- [ ] Save the current filter state in localStorage in the same format as the query parameters
- [ ] Restore the current filter state from the URL if present, then from localStorage, if present
- [ ] Wire up the save button that has been added to CollectionControls to save the current set 
      of filters into the dexie 'database' database.  Add a new 'table' to the dexie database 
      called 'filters'
      in which to store the filters
- [ ] Prompt the user for a name for the saved filter.  This can be a basic js prompt.  When 
  canceled, do not save the filter set.
- [ ] When there are saved filter sets, add a dropdown before 'owned' filter to select a saved 
  filter set
- [ ] A management interface for the filters is not in scope at this time