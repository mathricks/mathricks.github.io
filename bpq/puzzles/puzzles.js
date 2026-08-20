(() => {
  'use strict';

  const MAX_QUERY_LENGTH = 128;
  const EXPECTED_PUZZLE_COUNT = 160;
  const PUZZLE_71_HUNT_PATH = '/bpq/hunt/';
  const ANNOUNCEMENT_HOSTS = new Set([
    'bitcointalk.org',
    'github.com',
    'mempool.space',
    'reddit.com',
    'www.reddit.com'
  ]);
  const BITCOIN_ADDRESS_PATTERN = /^(?:[13][a-km-zA-HJ-NP-Z1-9]{25,61}|bc1[ac-hj-np-z02-9]{11,71})$/;
  const DECIMAL_KEY_PATTERN = /^\d{1,78}$/;
  const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  const rowsElement = document.getElementById('puzzleRows');
  const searchElement = document.getElementById('puzzleSearch');
  const filterElement = document.getElementById('statusFilter');
  const resultCountElement = document.getElementById('resultCount');
  const loadErrorElement = document.getElementById('loadError');
  const latestSolveElement = document.getElementById('latestSolve');
  const previousSolveElement = document.getElementById('previousSolve');
  const remainingRewardsElement = document.getElementById('remainingRewards');
  const remainingRewardsUSDElement = document.getElementById('remainingRewardsUSD');
  const claimedRewardsElement = document.getElementById('claimedRewards');
  const claimedRewardsUSDElement = document.getElementById('claimedRewardsUSD');
  const totalRewardsElement = document.getElementById('totalRewards');
  const totalRewardsUSDElement = document.getElementById('totalRewardsUSD');

  let puzzles = [];

  const statusFor = (entry) => entry.solvedDate || entry.solvedKey ? 'solved' : 'open';
  const rewardFor = (bit) => `${(bit / 10).toFixed(1)} BTC`;
  const formatBTC = (amount) =>
    `${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(amount)} BTC`;
  const isPlausibleBTCPrice = (value) =>
    Number.isFinite(value) && value > 0 && value < 100000000;

  const normalizeQuery = (value) =>
    value.normalize('NFKC').trim().slice(0, MAX_QUERY_LENGTH).toLocaleLowerCase('en-US');

  const trustedAnnouncementURL = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string' || value.length > 500) {
      throw new Error('Invalid announcement URL');
    }

    const url = new URL(value);
    if (url.protocol !== 'https:' || !ANNOUNCEMENT_HOSTS.has(url.hostname)) {
      throw new Error('Untrusted announcement URL');
    }
    return url.href;
  };

  const validatedEntry = (rawBit, rawEntry) => {
    const bit = Number(rawBit);
    if (!Number.isInteger(bit) || bit < 1 || bit > EXPECTED_PUZZLE_COUNT) {
      throw new Error('Invalid puzzle number');
    }
    if (!rawEntry || typeof rawEntry !== 'object' || Array.isArray(rawEntry)) {
      throw new Error(`Invalid puzzle record: ${bit}`);
    }

    const address = rawEntry.address;
    if (typeof address !== 'string' || !BITCOIN_ADDRESS_PATTERN.test(address)) {
      throw new Error(`Invalid puzzle address: ${bit}`);
    }

    const solvedDate = rawEntry.solvedDate;
    if (solvedDate !== null &&
        (typeof solvedDate !== 'string' || !ISO_DATE_PATTERN.test(solvedDate))) {
      throw new Error(`Invalid solved date: ${bit}`);
    }
    if (solvedDate !== null) {
      const parsedDate = new Date(`${solvedDate}T00:00:00Z`);
      if (Number.isNaN(parsedDate.getTime()) ||
          parsedDate.toISOString().slice(0, 10) !== solvedDate) {
        throw new Error(`Invalid calendar date: ${bit}`);
      }
    }

    const solvedKey = rawEntry.solvedKey;
    if (solvedKey !== null &&
        (typeof solvedKey !== 'string' || !DECIMAL_KEY_PATTERN.test(solvedKey))) {
      throw new Error(`Invalid solved key: ${bit}`);
    }

    return Object.freeze({
      address,
      solvedDate,
      solvedKey,
      announcementURL: trustedAnnouncementURL(rawEntry.announcementURL)
    });
  };

  const makeCell = (className, text) => {
    const cell = document.createElement('td');
    if (className) cell.className = className;
    if (text !== undefined) cell.textContent = text;
    return cell;
  };

  const fetchJSON = async (url) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Price request failed: ${response.status}`);
      return await response.json();
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const fetchBTCPriceUSD = async () => {
    try {
      const data = await fetchJSON(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      );
      const price = Number(data?.bitcoin?.usd);
      if (isPlausibleBTCPrice(price)) return price;
    } catch {
      // Try the same fallback provider used by the app.
    }

    try {
      const data = await fetchJSON('https://blockchain.info/ticker');
      const price = Number(data?.USD?.last);
      if (isPlausibleBTCPrice(price)) return price;
    } catch {
      // The BTC total remains available even when live pricing is unavailable.
    }

    return null;
  };

  const updateRewardUSD = async ({ remainingBTC, claimedBTC, totalBTC }) => {
    const price = await fetchBTCPriceUSD();
    if (price === null) return;

    const usdFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    });

    [
      [remainingRewardsUSDElement, remainingBTC],
      [claimedRewardsUSDElement, claimedBTC],
      [totalRewardsUSDElement, totalBTC]
    ].forEach(([element, amount]) => {
      element.textContent = `≈ ${usdFormatter.format(amount * price)}`;
      element.hidden = false;
    });
  };

  const scrollToPuzzle = (bit, behavior = 'auto') => {
    const row = document.getElementById(`puzzle-${bit}`);
    if (row) row.scrollIntoView({ behavior, block: 'start' });
  };

  const render = () => {
    if (searchElement.value.length > MAX_QUERY_LENGTH) {
      searchElement.value = searchElement.value.slice(0, MAX_QUERY_LENGTH);
    }
    const query = normalizeQuery(searchElement.value);
    const selectedStatus = filterElement.value;

    const visible = puzzles.filter(({ bit, entry, status }) => {
      if (selectedStatus !== 'all' && status !== selectedStatus) return false;
      if (!query) return true;
      return [
        String(bit),
        entry.address,
        entry.solvedDate || '',
        entry.solvedKey || '',
        status
      ].some((value) => normalizeQuery(value).includes(query));
    });

    rowsElement.replaceChildren();
    resultCountElement.textContent = `${visible.length} ${visible.length === 1 ? 'puzzle' : 'puzzles'}`;

    if (!visible.length) {
      const row = document.createElement('tr');
      const cell = makeCell('empty-cell', 'No puzzles match this search.');
      cell.colSpan = 6;
      row.appendChild(cell);
      rowsElement.appendChild(row);
      return;
    }

    const fragment = document.createDocumentFragment();
    visible.forEach(({ bit, entry, status }) => {
      const row = document.createElement('tr');
      row.id = `puzzle-${bit}`;

      const puzzleCell = document.createElement('th');
      puzzleCell.scope = 'row';
      puzzleCell.className = 'puzzle-number';
      if (bit === 71) {
        puzzleCell.textContent = `#${bit} `;
        const huntLink = document.createElement('a');
        huntLink.className = 'hunt-link';
        huntLink.href = PUZZLE_71_HUNT_PATH;
        huntLink.textContent = 'Join Hunt ↗';
        huntLink.title = 'Choose a private Puzzle 71 range and scan it in your browser';
        huntLink.setAttribute('aria-label', 'Join the browser hunt for Bitcoin Puzzle 71');
        puzzleCell.appendChild(huntLink);
      } else if (bit === 69 || bit === 135) {
        const recordLink = document.createElement('a');
        recordLink.href = `/bpq/puzzles/${bit}/`;
        recordLink.textContent = `#${bit}`;
        puzzleCell.appendChild(recordLink);
      } else {
        puzzleCell.textContent = `#${bit}`;
      }
      row.appendChild(puzzleCell);
      row.appendChild(makeCell('reward', rewardFor(bit)));

      const statusCell = makeCell();
      const pill = document.createElement('span');
      pill.className = `status-pill status-${status}`;
      pill.textContent = status === 'solved' ? 'Solved' : 'Open';
      statusCell.appendChild(pill);
      row.appendChild(statusCell);

      const dateCell = makeCell('date-cell');
      if (entry.solvedDate && entry.announcementURL) {
        const announcementLink = document.createElement('a');
        announcementLink.className = 'date-link';
        announcementLink.href = entry.announcementURL;
        announcementLink.target = '_blank';
        announcementLink.rel = 'external noopener noreferrer';
        announcementLink.referrerPolicy = 'no-referrer';
        announcementLink.textContent = entry.solvedDate;
        announcementLink.title = `Open the win announcement for puzzle #${bit}`;
        dateCell.appendChild(announcementLink);
      } else {
        dateCell.textContent = entry.solvedDate || '—';
      }
      row.appendChild(dateCell);

      const addressCell = makeCell();
      const addressLink = document.createElement('a');
      addressLink.className = 'mono-link';
      addressLink.href = `https://mempool.space/address/${encodeURIComponent(entry.address)}`;
      addressLink.target = '_blank';
      addressLink.rel = 'external noopener noreferrer';
      addressLink.referrerPolicy = 'no-referrer';
      addressLink.textContent = entry.address;
      addressLink.title = entry.address;
      addressCell.appendChild(addressLink);
      row.appendChild(addressCell);

      const keyCell = makeCell();
      if (entry.solvedKey) {
        const key = document.createElement('code');
        key.className = 'key-value';
        key.textContent = entry.solvedKey;
        key.title = entry.solvedKey;
        keyCell.appendChild(key);
      } else if (status === 'solved') {
        const unpublished = document.createElement('span');
        unpublished.className = 'key-unpublished';
        unpublished.textContent = 'Not published yet';
        keyCell.appendChild(unpublished);
      } else {
        const empty = document.createElement('span');
        empty.className = 'key-empty';
        empty.textContent = '—';
        keyCell.appendChild(empty);
      }
      row.appendChild(keyCell);

      fragment.appendChild(row);
    });
    rowsElement.appendChild(fragment);
  };

  const updateSummary = () => {
    const solved = puzzles.filter(({ status }) => status === 'solved');
    const solvesByDate = solved
      .filter(({ entry }) => entry.solvedDate)
      .sort((a, b) => b.entry.solvedDate.localeCompare(a.entry.solvedDate) || b.bit - a.bit);
    const latest = solvesByDate[0];
    const previous = solvesByDate[1];
    const remainingBTC = puzzles
      .filter(({ status }) => status === 'open')
      .reduce((total, { bit }) => total + bit / 10, 0);
    const claimedBTC = solved.reduce((total, { bit }) => total + bit / 10, 0);
    const totalBTC = puzzles.reduce((total, { bit }) => total + bit / 10, 0);

    document.getElementById('totalCount').textContent = puzzles.length;
    document.getElementById('solvedCount').textContent = solved.length;
    document.getElementById('openCount').textContent = puzzles.length - solved.length;
    latestSolveElement.textContent = latest ? `#${latest.bit}` : '—';
    latestSolveElement.href = latest ? `#puzzle-${latest.bit}` : '#ledger-title';
    previousSolveElement.textContent = previous ? `#${previous.bit}` : '—';
    previousSolveElement.href = previous ? `#puzzle-${previous.bit}` : '#ledger-title';
    remainingRewardsElement.textContent = formatBTC(remainingBTC);
    claimedRewardsElement.textContent = formatBTC(claimedBTC);
    totalRewardsElement.textContent = formatBTC(totalBTC);
    updateRewardUSD({ remainingBTC, claimedBTC, totalBTC });
  };

  fetch('puzzles.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`Ledger request failed: ${response.status}`);
      return response.json();
    })
    .then((data) => {
      if (!data || typeof data !== 'object' || Array.isArray(data) ||
          Object.keys(data).length !== EXPECTED_PUZZLE_COUNT) {
        throw new Error('Incomplete puzzle ledger');
      }

      puzzles = Object.entries(data)
        .map(([rawBit, rawEntry]) => {
          const bit = Number(rawBit);
          const entry = validatedEntry(rawBit, rawEntry);
          return {
            bit,
            entry,
            status: statusFor(entry)
          };
        })
        .sort((a, b) => b.bit - a.bit);

      updateSummary();
      render();

      const match = window.location.hash.match(/^#puzzle-(\d{1,3})$/);
      if (match) {
        const bit = Number(match[1]);
        if (bit >= 1 && bit <= EXPECTED_PUZZLE_COUNT) {
          window.requestAnimationFrame(() => scrollToPuzzle(bit));
        }
      }
    })
    .catch(() => {
      loadErrorElement.hidden = false;
      resultCountElement.textContent = '83 solved puzzles';
    });

  searchElement.addEventListener('input', render);
  filterElement.addEventListener('change', render);
  [latestSolveElement, previousSolveElement].forEach((element) => {
    element.addEventListener('click', (event) => {
      const match = element.hash.match(/^#puzzle-(\d{1,3})$/);
      if (!match) return;

      event.preventDefault();
      searchElement.value = '';
      filterElement.value = 'all';
      render();

      const bit = Number(match[1]);
      window.history.replaceState(null, '', `#puzzle-${bit}`);
      window.requestAnimationFrame(() => scrollToPuzzle(bit, 'smooth'));
    });
  });
})();
