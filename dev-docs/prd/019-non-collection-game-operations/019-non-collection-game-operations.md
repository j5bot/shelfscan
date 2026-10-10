# PRD 019 Non-Collection Game Operations

## Overview

Users of ShelfScan may wish to register plays, add items to their collection, or
do other operations without scanning a UPC or already having a game in their
collection.

Add functionality to the collection view which allows for this.  Specifically,
if a search for a game does not result in items from the collection, run the
text part of the search through BGG in order to get games which match the search
but are not yet part of the user's collection in any way.

Games which are not part of a user's collection should have an alternate
presentation in the grid/list.  For the first version, have them appear on a
dark background with light text/icons when in light mode, and on a light background
with dark text/icons when in dark mode.

To do the search when the extension is present and the version is greater than
0.12.0, send a 'doSearch' message with
the query as a 'query' parameter to the extension and wait for the result, which
will be a data object with `items` property as an array of items with this shape:

```
{
    "objectid": "822",
    "subtype": "boardgame",
    "primaryname": "1",
    "nameid": "736",
    "yearpublished": 2000,
    "ordtitle": "Carcassonne",
    "rep_imageid": 8621446,
    "objecttype": "thing",
    "name": "Carcassonne",
    "sortindex": "1",
    "type": "things",
    "id": "822",
    "href": "/boardgame/822/carcassonne"
}
```

When planning for this PRD, indicate which fields are not present that are
necessary for displaying the item as a card in the grid or list row.  For the
first version, do not display an image (display the no image url default).

Fill in nonsense defaults for the not-present required fields for the first
version where necessary after discussion.

If the extension is not present, run a search through the BGG XML API v2.  To do
this, add actions as necessary.  The URL for an XML API call for search is
formatted like:

`https://boardgamegeek.com/xmlapi2/search?query=carc&type=boardgame,boardgameexpansion`

Always searching both boardgame and boardgameexpansion types.

The image field is not present for these searches and the results are not
ordered in a particular fashion.  Order them so that boardgame items are first,
then order by published year descending, then expansions ordered by published
year descending.
