# PRD 016B Swaptagon Export from Scan

## Overview

Users of ShelfScan should be able to scan games using the batch scan interface
and export them as an ODS file for import into Swaptagon.

## Details

Extract logic from batch/page.tsx into a new component for use in both batch
page and new page `swapscan`.

Extract the add games to collection button from the component and have it passed
in via the page.

