# PRD 016 Swaptagon Export

## Overview

Items selected in the swap mode can be exported to an ODS format via the button
which currently exports in Math Trade format in mathTrade mode.

The function which creates the file from an array of `SwapItemData` objects
should be in the `swapExport` file.

## Details

The ODS sheet should contain a header be comprised of rows for columns based on `SwapItemData`
typescript type:

Item Id: blank if undefined, otherwise `swapItemId`
Description: a multiline text string, stored as `bodyText`
Comparative Value: a number from 0-10
Sell For: a number 0 or greater
Image: an embedded image

The ODS sheet should contain a styled header row