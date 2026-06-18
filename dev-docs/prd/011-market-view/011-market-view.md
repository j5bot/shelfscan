# 011 Market View

## Overview

Every user potentially has listings in the BoardGameGeek Marketplace.

They may want to review these listings and compare them against their BGG collection.

The scope of this PRD is to create a market view within the collection page which loads and shows a 
user's marketplace listings.  New game adapters should be created to transform marketplace 
listing data into a format displayable with the same components as the other views.

The 'marketLoad' extension message type with the userId of the user initiates the load of 
marketplace listings, when they are not present in the database.

When a user's marketplace listings are loaded, an additional filter should be available in the 
collection view that reflects whether a matching game is not present in the marketplace.

Marketplace listings should be persisted in the database, similarly to the collection's persistence.
They should also be stored in redux after loading from the database or 'marketLoad' action, with 
a similar structure to the collection slice, keyed off of the username.

An affordance should be added to refresh/reload marketplace listings from the marketplace view.

Sample product data is available as `product.json`.  Market typescript types are available in 
`market.ts`.