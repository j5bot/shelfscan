# Collection View Phase 2

## New Features

- [] Change sorting UI to a dropdown menu for field selection and a toggle for ascending/descending.
- [] Add toggle or dropdowns for additional filters to the right of the sorting controls
- [] Add a view button bar with options for list/small grid/large grid views to the head, at the 
  right of the refresh button (aligned right)

## Additional Filters

Three state toggles have three states represented by grayed out (not filtered), green (positive 
filter), and red with slash through the icon (negative filter).
For example, the "For Trade" toggle would show all items when in the grayed out state, only items that are for trade in the green state, and only items that are not for trade in the red state.

- [] Collection statuses
  - [] four option dropdown: Owned, Not Owned, Previously Owned, "Ownership" (not filtered by 
    ownership status, default) (FaCheck)
  - [] three state toggle: For Trade, Not For Trade, "Trade Status" (Not filtered by trade 
    status, default) (FaRecycle)
  - [] five option dropdown: Want in Trade, Want to Play, Want to Buy, "Want Status" (not 
    filtered by want status, default) (FaStar)
  - [] three state toggle: Has Trade Condition, Does Not Have Condition, "Condition Status" (not 
    filtered by trade condition, default) (FaSignal - mirrored horizontally)
  - [] three state toggle: Wish (on wishlist with priority 1-4) not on wishlist (priority 5 or 
    not on wishlist), "Wishlist Status" (not filtered by wishlist status, default) (FaHeart)
  - [] six option dropdown only visible when filtered by wishlist: Wishlist priority 1-5, "Wishlist 
    Priority" 
    (not filtered by wishlist 
    priority, default)
  - [] three state toggle: Preordered, Not Preordered, "Preorder Status" (not filtered by 
    preorder status, default) (FaCalendar)
- [] Scan statuses
  - [] three state toggle: Verified, Not Verified, "Verification Status" (not filtered by 
    verification status, default (FaThumbsUp)
  - [] three state toggle: Scanned, Not Scanned, "Scan Status" (not filtered by scan status, 
    default) (FaBarcode)

## List View

Implement the list view with a simple table showing an extra-small thumbnail (50x50) and key
metadata fields (e.g., title, collection statuses, scan status, verification status).

## Small Grid View

The existing grid view is the small grid view.

## Large Grid View

The large grid view should show larger thumbnails (200 x 200)

