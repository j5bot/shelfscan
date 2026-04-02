/**
 * fetch.js — Luminate Online TeamRaiser API fetcher
 *
 * Fetches fundraising goal and current amount raised for the
 * Ghostbusters Virginia team on the Make-A-Wish TeamRaiser event.
 *
 * fr_id   = 7464   (TeamRaiser event ID)
 * team_id = 58435  (Team ID)
 *
 * No API key is used — testing unauthenticated access.
 */

const BASE_URL = "https://site.wish.org/site/CRTeamraiserAPI";
const FR_ID = "7464";
const TEAM_ID = "58435";

// Methods to try in sequence
const METHODS = ["getTeamProgress", "getFundraisingResults", "getEventSummary"];

/**
 * Build a query string from a plain object.
 * @param {Record<string, string>} params
 * @returns {string}
 */
function buildQueryString(params) {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

/**
 * Attempt to extract goal and raised values from a parsed JSON response,
 * regardless of which method was called.
 *
 * Returns an object { goal, raised } where values are strings/numbers
 * as returned by the API, or null if not found.
 *
 * @param {object} data
 * @returns {{ goal: string|number|null, raised: string|number|null }|null}
 */
function extractValues(data) {
  if (!data || typeof data !== "object") return null;

  // Walk all keys looking for common field names used by Luminate Online
  const goalKeys = [
    "fundraisingGoal",
    "goal",
    "teamGoal",
    "event_goal",
    "goalAmount",
  ];
  const raisedKeys = [
    "totalAmountRaised",
    "amountRaised",
    "raised",
    "teamAmountRaised",
    "amount_raised",
    "totalRaised",
  ];

  function search(obj) {
    if (typeof obj !== "object" || obj === null) return null;

    let goal = null;
    let raised = null;

    for (const key of Object.keys(obj)) {
      if (goalKeys.includes(key)) goal = obj[key];
      if (raisedKeys.includes(key)) raised = obj[key];
    }

    if (goal !== null || raised !== null) return { goal, raised };

    // Recurse into nested objects/arrays
    for (const value of Object.values(obj)) {
      if (typeof value === "object" && value !== null) {
        const result = search(value);
        if (result) return result;
      }
    }

    return null;
  }

  return search(data);
}

/**
 * Try a single API method and return the parsed JSON response.
 * Throws on network error or non-OK HTTP status.
 *
 * @param {string} method
 * @returns {Promise<object>}
 */
async function tryMethod(method) {
  const params = {
    method,
    fr_id: FR_ID,
    team_id: TEAM_ID,
    v: "1.0",
    response_format: "json",
  };
  const url = `${BASE_URL}?${buildQueryString(params)}`;

  console.log(`[ghostbusters-wish] Trying method: ${method}`);
  console.log(`[ghostbusters-wish] URL: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`[ghostbusters-wish] Raw response for ${method}:`, data);
  return data;
}

/**
 * Main entry point — tries each method in sequence until one succeeds
 * or all have been exhausted.
 *
 * @returns {Promise<{ method: string, goal: string|number|null, raised: string|number|null, raw: object }|null>}
 */
async function fetchFundraisingData() {
  const errors = [];

  for (const method of METHODS) {
    try {
      const data = await tryMethod(method);
      const values = extractValues(data);
      return {
        method,
        goal: values ? values.goal : null,
        raised: values ? values.raised : null,
        raw: data,
      };
    } catch (err) {
      console.warn(
        `[ghostbusters-wish] Method "${method}" failed:`,
        err.message
      );
      errors.push({ method, error: err.message });
    }
  }

  console.error("[ghostbusters-wish] All methods failed:", errors);
  return null;
}

/**
 * Parse a value that may be a number, a dollar string like "$1,234.56",
 * or a plain numeric string into a JavaScript number.
 * Returns NaN if the value cannot be parsed.
 *
 * @param {string|number|null|undefined} value
 * @returns {number}
 */
function parseAmount(value) {
  if (value === null || value === undefined) return NaN;
  if (typeof value === "number") return value;
  // Strip currency symbols, commas, and spaces; preserve a leading minus and
  // the first decimal point only.
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  // Reject strings with more than one decimal point (e.g. "12.34.56")
  if ((cleaned.match(/\./g) || []).length > 1) return NaN;
  return parseFloat(cleaned);
}

/**
 * Format a dollar amount for display.
 * @param {string|number|null} value
 * @returns {string}
 */
function formatCurrency(value) {
  if (value === null || value === undefined) return "N/A";
  const num = parseAmount(value);
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Update the HTML page with the fetched data.
 * Only used when running in a browser context.
 *
 * @param {{ method: string, goal: string|number|null, raised: string|number|null, raw: object }|null} result
 * @param {string|null} errorMessage
 */
function updatePage(result, errorMessage) {
  const statusEl = document.getElementById("status");
  const goalEl = document.getElementById("goal");
  const raisedEl = document.getElementById("raised");
  const progressBarEl = document.getElementById("progress-bar");
  const progressPctEl = document.getElementById("progress-pct");
  const rawEl = document.getElementById("raw-response");

  if (errorMessage || !result) {
    statusEl.textContent =
      errorMessage ||
      "All API methods failed. See console for details. CORS may be blocking the request — try serving this page with: npx serve .";
    statusEl.className = "error";
    return;
  }

  statusEl.textContent = `Data fetched successfully using method: ${result.method}`;
  statusEl.className = "success";

  goalEl.textContent = formatCurrency(result.goal);
  raisedEl.textContent = formatCurrency(result.raised);

  if (result.goal && result.raised) {
    const goalNum = parseAmount(result.goal);
    const raisedNum = parseAmount(result.raised);
    if (!isNaN(goalNum) && !isNaN(raisedNum) && goalNum > 0) {
      const pct = Math.min(100, Math.round((raisedNum / goalNum) * 100));
      progressBarEl.style.width = `${pct}%`;
      progressPctEl.textContent = `${pct}%`;
    }
  }

  rawEl.textContent = JSON.stringify(result.raw, null, 2);
}

/**
 * Button click handler — wires fetchFundraisingData() to the page UI.
 * Exported so index.html can call it directly.
 */
async function onFetchClick() {
  const btnEl = document.getElementById("fetch-btn");
  const statusEl = document.getElementById("status");

  btnEl.disabled = true;
  statusEl.textContent = "Fetching data…";
  statusEl.className = "";

  try {
    const result = await fetchFundraisingData();
    updatePage(result, null);
  } catch (err) {
    updatePage(null, `Unexpected error: ${err.message}`);
  } finally {
    btnEl.disabled = false;
  }
}

// Make available as a browser global
if (typeof window !== "undefined") {
  window.onFetchClick = onFetchClick;
}

// Node.js usage: `node fetch.js`
if (typeof module !== "undefined" && require.main === module) {
  // Node's built-in fetch (available since Node 18)
  fetchFundraisingData().then((result) => {
    if (!result) {
      console.error("Failed to retrieve fundraising data.");
      process.exit(1);
    }
    console.log("\n=== Fundraising Results ===");
    console.log(`Method used : ${result.method}`);
    console.log(`Goal        : ${formatCurrency(result.goal)}`);
    console.log(`Raised      : ${formatCurrency(result.raised)}`);
  });
}
