/**
 * Signal Matching Score utility for Seller -> Buyer recommendations.
 *
 * Weights (100 points total -> 0.0 to 10.0):
 *  - Industry / Sector Match: 25 pts
 *  - Geography / Location Match: 25 pts
 *  - Revenue / EBITDA Size Fit: 20 pts
 *  - Preferred Buyer Type Fit: 20 pts
 *  - Buyer Readiness (Verification, Capital, Description): 10 pts
 *  - Deal-Breakers Conflict Penalty: -15 pts (-1.5 on 10-point scale)
 */

const normalizeText = (val) => (typeof val === 'string' ? val.trim().toLowerCase() : '');

const toStringArray = (val) => {
  if (Array.isArray(val)) return val.map(normalizeText).filter(Boolean);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(normalizeText).filter(Boolean);
      } catch {
        // Fallback to comma-split below
      }
    }
    return trimmed.split(',').map(normalizeText).filter(Boolean);
  }
  return [];
};

const INDIAN_LOCATIONS = new Set([
  'india', 'mumbai', 'maharashtra', 'karnataka', 'bangalore', 'bengaluru',
  'tamil nadu', 'chennai', 'madurai', 'delhi', 'new delhi', 'ncr', 'gurgaon',
  'gurugram', 'noida', 'hyderabad', 'telangana', 'pune', 'kolkata', 'west bengal',
  'ahmedabad', 'gujarat', 'chhattisgarh', 'raipur', 'kerala', 'kochi', 'jaipur',
  'rajasthan', 'uttar pradesh', 'lucknow', 'haryana', 'punjab', 'chandigarh',
  'madhya pradesh', 'indore', 'bhopal', 'odisha', 'bihar', 'goa', 'surat',
]);

const expandLocationTokens = (loc) => {
  const norm = normalizeText(loc);
  if (!norm) return [];
  const tokens = [norm];
  if (INDIAN_LOCATIONS.has(norm)) tokens.push('india');
  return tokens;
};

const parseMoneyRange = (str) => {
  if (!str || typeof str !== 'string') return null;
  const cleaned = str.toLowerCase().replace(/,/g, '');
  const isINR = cleaned.includes('₹') || cleaned.includes('inr') || cleaned.includes('crore') || cleaned.includes('lakh');
  const matches = [...cleaned.matchAll(/(\d+(?:\.\d+)?)\s*(k|m|b|crore|cr|lakh|lakhs)?/g)];
  if (!matches.length) return null;

  const toMillionsUSD = (numStr, unit) => {
    const n = parseFloat(numStr);
    if (Number.isNaN(n)) return null;
    if (unit === 'crore' || unit === 'cr') return n * 0.12; // ~₹1 Cr ≈ $0.12M
    if (unit === 'lakh' || unit === 'lakhs') return n * 0.012; // ~₹1 Lakh ≈ $0.012M
    if (unit === 'k') return n / 1000;
    if (unit === 'b') return n * 1000;
    if (isINR && !unit) return n / 1000000;
    return n; // default 'm' or plain number in millions-scale
  };

  const values = matches
    .map((m) => toMillionsUSD(m[1], m[2]))
    .filter((v) => v !== null);

  if (!values.length) return null;
  return {
    min: values[0],
    max: values.length > 1 ? values[1] : values[0],
  };
};

const rangesOverlapOrClose = (sellerStr, buyerStr) => {
  const sNorm = normalizeText(sellerStr);
  const bNorm = normalizeText(buyerStr);
  if (!sNorm || !bNorm) return 'unknown';
  if (sNorm === bNorm || sNorm.includes(bNorm) || bNorm.includes(sNorm)) return 'exact';

  const sRange = parseMoneyRange(sNorm);
  const bRange = parseMoneyRange(bNorm);
  if (!sRange || !bRange) return 'none';

  if (sRange.max >= bRange.min && bRange.max >= sRange.min) return 'exact';

  // Check if within 2x proximity
  const gap = Math.min(Math.abs(sRange.min - bRange.max), Math.abs(bRange.min - sRange.max));
  const scale = Math.max(sRange.max, bRange.max, 1);
  return gap / scale <= 0.5 ? 'close' : 'none';
};

const tokenizeKeywords = (str) =>
  normalizeText(str)
    .split(/[/,&()]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && !['and', 'the', 'for', 'as', 'of', 'a'].includes(s));

const scoreIndustry = (teaser, buyer) => {
  const sellerSectors = [teaser.industry, teaser.sector, teaser.subIndustry]
    .flatMap(tokenizeKeywords)
    .filter(Boolean);
  const targetIndustries = toStringArray(buyer.targetIndustries);
  const fallbackType = normalizeText(buyer.companyType);

  if (!sellerSectors.length) return { points: 12, matched: false };

  if (targetIndustries.length > 0) {
    if (targetIndustries.some((t) => t === 'all' || t === 'any' || t === 'agnostic')) {
      return { points: 20, matched: true, tag: 'Industry Open' };
    }
    const buyerTokens = targetIndustries.flatMap(tokenizeKeywords);
    const exact = sellerSectors.some((s) =>
      buyerTokens.some((t) => t === s || t.includes(s) || s.includes(t))
    );
    if (exact) return { points: 25, matched: true, tag: 'Industry Fit' };
    return { points: 0, matched: false };
  }

  // Fallback for incomplete buyer profile
  if (fallbackType) {
    const fallbackTokens = tokenizeKeywords(fallbackType);
    const partial = sellerSectors.some((s) =>
      fallbackTokens.some((f) => f === s || f.includes(s) || s.includes(f))
    );
    if (partial) return { points: 18, matched: true, tag: 'Sector Fit' };
    return { points: 10, matched: false };
  }

  return { points: 10, matched: false };
};

const scoreLocation = (teaser, buyer) => {
  const sellerLocations = [
    teaser.headquarters,
    teaser.geography,
    ...toStringArray(teaser.operationsLocation),
  ].flatMap(expandLocationTokens);

  const buyerLocations = [
    buyer.geography,
    buyer.headquarters,
    buyer.country,
    buyer.stateRegion,
    buyer.city,
  ].flatMap(expandLocationTokens);

  if (!sellerLocations.length || !buyerLocations.length) {
    return { points: 12, matched: false };
  }

  if (buyerLocations.some((b) => b === 'global' || b === 'worldwide' || b === 'any')) {
    return { points: 22, matched: true, tag: 'Global Mandate' };
  }

  const matched = sellerLocations.some((s) =>
    buyerLocations.some((b) => s === b || s.includes(b) || b.includes(s))
  );

  if (matched) return { points: 25, matched: true, tag: 'Location Match' };
  return { points: 4, matched: false };
};

const scoreFinancials = (teaser, buyer) => {
  let points = 0;
  let matched = false;

  const revStatus = rangesOverlapOrClose(
    teaser.revenue || (teaser.revenueBand !== 'undefined' ? teaser.revenueBand : ''),
    buyer.revenueRange || buyer.investmentRange
  );
  if (revStatus === 'exact') {
    points += 12;
    matched = true;
  } else if (revStatus === 'close') {
    points += 7;
  } else if (revStatus === 'unknown') {
    points += 5;
  }

  const ebitdaStatus = rangesOverlapOrClose(
    teaser.ebitdaBand || teaser.ebitda,
    buyer.ebitdaRange || buyer.equityRange
  );
  if (ebitdaStatus === 'exact') {
    points += 8;
    matched = true;
  } else if (ebitdaStatus === 'close') {
    points += 4;
  } else if (ebitdaStatus === 'unknown') {
    points += 3;
  }

  return {
    points,
    matched,
    tag: matched ? 'Deal Size Fit' : null,
  };
};

const scoreBuyerType = (teaser, buyer) => {
  const preferred = toStringArray(teaser.preferredBuyerTypes);
  const buyerTypes = [buyer.buyerRole, buyer.investorType, buyer.companyType]
    .map(normalizeText)
    .filter(Boolean);

  if (!preferred.length) return { points: 14, matched: false };
  if (!buyerTypes.length) return { points: 8, matched: false };

  const financialSubtypes = ['private equity', 'pe', 'venture capital', 'vc', 'family office', 'independent sponsor', 'financial investor'];
  const matched = preferred.some((p) => {
    if (buyerTypes.some((b) => p === b || p.includes(b) || b.includes(p))) return true;
    if (p.includes('financial investor') && buyerTypes.some((b) => financialSubtypes.some((f) => b.includes(f)))) {
      return true;
    }
    return false;
  });

  if (matched) return { points: 20, matched: true, tag: 'Buyer Type Fit' };
  return { points: 4, matched: false };
};

const scoreReadinessAndDealBreakers = (teaser, buyer) => {
  let points = 0;
  const vStatus = normalizeText(buyer.verificationStatus);
  if (vStatus === 'verified' || vStatus === 'active') points += 4;
  if (normalizeText(buyer.capitalValue)) points += 3;
  if (normalizeText(buyer.companyDescription)) points += 3;

  let dealBreakerWarning = null;
  const dealBreakers = normalizeText(buyer.dealBreakers);
  if (dealBreakers) {
    const sellerContext = [
      teaser.industry,
      teaser.subIndustry,
      teaser.debtOnBusiness,
      teaser.reasonForSale,
      teaser.businessSummary,
    ]
      .map(normalizeText)
      .filter(Boolean)
      .join(' ');

    const tokens = dealBreakers
      .split(/[,;.\s]+/)
      .filter((w) => w.length >= 4 && !['with', 'that', 'this', 'from', 'have', 'none'].includes(w));

    const conflict = tokens.find((token) => sellerContext.includes(token));
    if (conflict) {
      points -= 15;
      dealBreakerWarning = `Potential deal-breaker: "${buyer.dealBreakers}"`;
    }
  }

  return { points, dealBreakerWarning };
};

/**
 * Calculate Signal Score between a single seller teaser and a buyer.
 */
export function calculateBuyerSignalScore(teaser, buyer) {
  if (!teaser || !buyer) {
    return {
      hasTeaser: false,
      score: null,
      numericScore: 0,
      label: 'No active teaser yet',
      subtext: 'Publish a teaser to see Signal Score',
      matchedTags: [],
      dealBreakerWarning: null,
    };
  }

  const industryRes = scoreIndustry(teaser, buyer);
  const locationRes = scoreLocation(teaser, buyer);
  const financialRes = scoreFinancials(teaser, buyer);
  const buyerTypeRes = scoreBuyerType(teaser, buyer);
  const readinessRes = scoreReadinessAndDealBreakers(teaser, buyer);

  const rawPoints =
    industryRes.points +
    locationRes.points +
    financialRes.points +
    buyerTypeRes.points +
    readinessRes.points;

  const clampedPoints = Math.max(15, Math.min(99, rawPoints));
  const numericScore = Number((clampedPoints / 10).toFixed(1));

  const matchedTags = [
    locationRes.tag,
    industryRes.tag,
    financialRes.tag,
    buyerTypeRes.tag,
  ].filter(Boolean);

  let label = 'Partial match';
  let subtext = 'Outside some of your primary criteria.';

  if (numericScore >= 8.0) {
    label = 'Strong fit for your deal';
    subtext =
      matchedTags.length > 0
        ? `Aligned on ${matchedTags.slice(0, 2).join(' & ').toLowerCase()}.`
        : 'Worth a closer look.';
  } else if (numericScore >= 6.0) {
    label = 'Good potential match';
    subtext =
      matchedTags.length > 0
        ? `Aligns on ${matchedTags[0].toLowerCase()}.`
        : 'Worth exploring further.';
  }

  return {
    hasTeaser: true,
    score: numericScore.toFixed(1),
    numericScore,
    label,
    subtext,
    matchedTags: matchedTags.slice(0, 3),
    dealBreakerWarning: readinessRes.dealBreakerWarning,
    bestProjectId: teaser.projectId,
    bestProjectName: teaser.projectName || teaser.dealName || 'Your Project',
  };
}

/**
 * Compare a buyer against all active teasers of a seller and return the best match.
 */
export function getBestBuyerMatch(sellerTeasers, buyer) {
  if (!Array.isArray(sellerTeasers) || sellerTeasers.length === 0) {
    return calculateBuyerSignalScore(null, buyer);
  }

  let best = null;
  for (const teaser of sellerTeasers) {
    const result = calculateBuyerSignalScore(teaser, buyer);
    if (!best || result.numericScore > best.numericScore) {
      best = result;
    }
  }
  return best;
}
