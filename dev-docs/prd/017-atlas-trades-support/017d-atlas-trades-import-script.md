# PRD 017D Import Script for Atlas Realms Trades

## Overview

An import to Atlas Realms trade starts from a URL in the format:

https://www.atlasrealms.com/trades/<trade id>/offerings

The POST of the new item goes to:

https://trade-api.atlasrealms.com/api/trade/<trade id>/items

Create a userscript which mirrors `importSwap.user.js`, for Atlas Realms trades.
