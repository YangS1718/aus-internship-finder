/**
 * build.js — Single source of truth pipeline
 *
 * Reads asset.json (master data), normalises categories, computes
 * visa_status + visa_tags, and writes the result to src/data/asset.json
 * for the React app to consume.
 *
 * Run:  node build.js
 */
import fs from 'fs';

const VALID_LOCATIONS = new Set([
  'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide',
  'Canberra', 'Hobart', 'Darwin', 'Australia-wide',
  // Internships that actually occur overseas
  'Hong Kong', 'Singapore', 'Chicago', 'Auckland',
]);

// Rationalise the long-tail categories into clean top-level groups
const CATEGORY_MAP = {
  'Corporate Finance & Healthcare':    'Corporate Finance',
  'Corporate Finance & Infrastructure':  'Corporate Finance',
  'Corporate Finance & Strategy':      'Corporate Finance',
  'Technology & Finance':              'Technology',
  'Quantitative Trading & Tech':       'Quantitative Trading',
  'Hedge Fund & Alternative Assets':   'Hedge Fund',
  'Retail & Entertainment':            'Retail & FMCG',
  'Manufacturing & Automotive':        'Manufacturing',
  'Manufacturing & Construction Materials': 'Manufacturing',
  'Manufacturing & Packaging':         'Manufacturing',
  'Manufacturing & Chemicals':         'Manufacturing',
  'Engineering & Infrastructure':      'Engineering',
  'Engineering & Property':            'Engineering',
  'Utilities & Renewables':            'Energy & Utilities',
  'Mining & Energy':                   'Energy & Utilities',
};

// Rationalise long-tail roles into cleaner groups
const ROLE_MAP = {
  'Business Development': 'Corporate Functions',
};

const data = JSON.parse(fs.readFileSync('asset.json', 'utf8'));

const processed = data.map(item => {
  // --- Location sanity check ---
  const cleanedLoc = item.location.filter(l => VALID_LOCATIONS.has(l));
  if (cleanedLoc.length === 0) {
    console.warn(`⚠️  ${item.company_name} has no valid locations after filtering!`);
  }

  // --- Category normalisation ---
  const category = CATEGORY_MAP[item.category] ?? item.category;

  // --- Visa status ---
  const visaStr = item.visa_requirements.toLowerCase();
  let visa_status = 'international_eligible';
  if (visaStr === 'australian citizen' || visaStr.includes('security clearance required')) {
    visa_status = 'citizen_only';
  } else if (visaStr.includes('requires full working rights') || visaStr.includes('australian citizen or permanent resident')) {
    visa_status = 'domestic_only';
  }

  // Extract parenthetical qualifier e.g. "(case-by-case, except Canberra)"
  const tagMatch = item.visa_requirements.match(/\(([^)]+)\)/);
  const visa_tags = tagMatch ? [tagMatch[1]] : [];

  return {
    company_name:      item.company_name,
    internship_type:   item.internship_type,
    location:          cleanedLoc,
    category,
    program_dates:     item.program_dates,
    open_close_dates:  item.open_close_dates,
    visa_requirements: item.visa_requirements,
    visa_status,
    visa_tags,
    roles:             [...new Set((item.roles ?? []).map(r => ROLE_MAP[r] ?? r))],
  };
});

// Write the canonical src/data/asset.json
if (!fs.existsSync('src/data')) fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/asset.json', JSON.stringify(processed, null, 2));

console.log(`✅  Built src/data/asset.json — ${processed.length} entries`);
