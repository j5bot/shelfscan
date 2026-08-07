# 015 Database Export & Import

## Overview

In order to back up ShelfScan data and be able to transfer it to another device, users need the 
ability to both export and import ShelfScan database tables.

## Requirements

1. Write a utility function to export one or more dexie db tables to a blob
2. Write a utility function to create a PNG image envelope and to embed a blob into the image 
   using the `png-compressor` library.  The PNG image envelope should present to the user as a 
   viewable title/filename, date, and blob size
3. Write a utility function to read an embedded blob from the PNG image envelope
4. Write a utility function to import one or more dexie db tables from the blob without 
   overwriting other tables