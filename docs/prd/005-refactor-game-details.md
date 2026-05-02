# Refactor the Game Details Component

## Objective

The goal of this refactor is to make the game details component suitable for reuse as a view of 
a game from a user's collection (BggCollectionItem / BggVersionItem). This will allow us to use the 
same component for both the search results and the user's collection, ensuring consistency in the UI and reducing code duplication.

## Changes to be Made

 - Extract the search functionality from the game details component and make it injectable as a 
   prop, similar to how the header and children are currently handled.  Use custom hooks where they are appropriate.

 - Make common Typescript types Game and Version for game and version information data that can be 
   used in both the 
   select version context and the user's collection context. This will ensure that the component 
   can handle data from both sources without any issues.
   - This common type needs to include the BGG url for the game, which is page_url in the 
     GameUPC data, and can be derived from the BGG id for the version in the collection context.
 - Refactor the game details component to use this common type for its props, allowing it to be flexible and reusable in different contexts.
 - Make adapter functions to convert the data from the search results and the user's collection into the common 
   Typescript type. This will allow us to easily integrate the component with both data sources without 
   having to modify the component itself.
 - Make a wrapper component for use in the Select Version context that uses the game details component and injects the search functionality as a prop.
 - Make a wrapper component for use in the user collection context which can have BGG specific 
   information added in the future, such as the user's rating, play count, etc.

