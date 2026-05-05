# 🇦🇺 Aus Internship Finder

A fast, filterable directory of structured internship programs at top Australian firms — built as a zero-cost static SPA.

## Features

- **169 programs** across Finance, Tech, Consulting, Mining, Government and more
- Filter by **Industry**, **Role / Stream**, **Location**, **Visa Status**, and **Application Timing**
- Timing filter is calendar-aware — "Opening Now" and "Opening in Next 3 Months" compute dynamically
- Data verified against official company career pages and graduate platforms (Prosple, GradConnection)

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite |
| Styling | Vanilla CSS (Glassmorphism dark mode) |
| Data | Static JSON — no backend required |

## Getting Started

```bash
npm install
npm run dev
```

## Data Pipeline

The master dataset lives in `asset.json` at the project root. The React app consumes a **derived** copy at `src/data/asset.json` which adds computed fields (`visa_status`, `visa_tags`).

Whenever you edit `asset.json`, re-generate the derived file:

```bash
npm run data:build
```

### Data Schema (`asset.json`)

| Field | Type | Description |
|---|---|---|
| `company_name` | string | Official company name |
| `internship_type` | string | Program name / type |
| `location` | string[] | Capital cities where program runs |
| `category` | string | Industry group |
| `program_dates` | string | When the internship runs |
| `open_close_dates` | string | When applications open/close |
| `visa_requirements` | string | Human-readable visa requirement |
| `roles` | string[] | Available career streams |

### Computed fields (added by `build.js`)

| Field | Values | Description |
|---|---|---|
| `visa_status` | `domestic_only` \| `international_eligible` | Machine-readable visa flag |
| `visa_tags` | string[] | Extracted qualifiers, e.g. `case-by-case` |

## Adding New Entries

1. Add the raw entry to `asset.json`
2. Run `npm run data:build`
3. Verify in the browser with `npm run dev`
