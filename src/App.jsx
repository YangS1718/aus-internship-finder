import { useState, useMemo } from 'react';
import { Analytics } from '@vercel/analytics/react';
import './index.css';
import programsData from './data/asset.json';

const FEEDBACK_FORM_URL = 'https://tally.so/r/A7W0LB';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    industry: '',
    visa: '',
    timing: '',
    role: ''
  });

  // Extract unique locations, industries, and roles for dropdowns
  const uniqueLocations = useMemo(() => {
    const locs = new Set();
    programsData.forEach(p => {
      p.location.forEach(l => locs.add(l));
    });
    return Array.from(locs).sort();
  }, []);

  const uniqueIndustries = useMemo(() => {
    const inds = new Set();
    programsData.forEach(p => inds.add(p.category));
    return Array.from(inds).sort();
  }, []);

  const uniqueRoles = useMemo(() => {
    const roles = new Set();
    programsData.forEach(p => {
      if (p.roles) {
        p.roles.forEach(r => roles.add(r));
      }
    });
    return Array.from(roles).sort();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredPrograms = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const nextThreeMonths = [
      currentMonth,
      (currentMonth + 1) % 12,
      (currentMonth + 2) % 12,
      (currentMonth + 3) % 12
    ];

    const getActiveMonths = (dateStr) => {
      const str = dateStr.toLowerCase();
      const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      
      const foundMonths = [];
      months.forEach((m, i) => {
        const idx = str.indexOf(m);
        if (idx !== -1) {
          foundMonths.push({ month: i, idx });
        } else {
          const sIdx = str.indexOf(shortMonths[i]);
          if (sIdx !== -1 && i !== 4) {
            foundMonths.push({ month: i, idx: sIdx });
          }
        }
      });

      foundMonths.sort((a, b) => a.idx - b.idx);
      
      const active = new Set();
      if (foundMonths.length === 1) {
        active.add(foundMonths[0].month);
        if (str.includes('open')) {
          active.add((foundMonths[0].month + 1) % 12);
        }
      } else if (foundMonths.length >= 2) {
        const start = foundMonths[0].month;
        const end = foundMonths[foundMonths.length - 1].month;
        
        if (start <= end) {
          for (let i = start; i <= end; i++) active.add(i);
        } else {
          for (let i = start; i < 12; i++) active.add(i);
          for (let i = 0; i <= end; i++) active.add(i);
        }
      }
      
      if (active.size === 0 && str.includes('rolling')) {
        for (let i = 0; i < 12; i++) active.add(i);
      }
      return active;
    };

    return programsData.filter(program => {
      // Search match
      const matchSearch = !searchQuery || program.company_name.toLowerCase().includes(searchQuery.toLowerCase());

      // Location match
      const matchLocation = !filters.location || program.location.includes(filters.location) || program.location.includes('Australia-wide');
      
      // Industry match
      const matchIndustry = !filters.industry || program.category === filters.industry;

      // Role match
      const matchRole = !filters.role || (program.roles && program.roles.includes(filters.role));
      
      // Visa match
      let matchVisa = true;
      if (filters.visa === 'domestic_only') {
        // If user is domestic, they can apply to both domestic_only and international_eligible
        matchVisa = true; 
      } else if (filters.visa === 'international_eligible') {
        // If user is international, they can ONLY apply to international_eligible
        matchVisa = program.visa_status === 'international_eligible';
      }

      // Timing match
      let matchTiming = true;
      if (filters.timing) {
        const activeMonths = getActiveMonths(program.open_close_dates);
        if (activeMonths.size > 0) {
          if (filters.timing === 'now') {
            matchTiming = activeMonths.has(currentMonth);
          } else if (filters.timing === 'next_3_months') {
            matchTiming = nextThreeMonths.some(m => activeMonths.has(m));
          }
        }
      }

      return matchSearch && matchLocation && matchIndustry && matchRole && matchVisa && matchTiming;
    });
  }, [filters, searchQuery]);

  return (
    <div className="container">
      <header>
        <h1>Aus Internship Finder</h1>
        <p>Discover your next career opportunity with top Australian programs.</p>
        <a
          href={FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost"
          id="header-feedback-link"
        >
          + Add / Edit a Program
        </a>
      </header>

      <div className="glass-panel search-form">
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="search">Search Company</label>
          <input 
            type="text" 
            id="search" 
            className="form-control" 
            placeholder="e.g. Atlassian, Macquarie Group, Optiver..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="industry">Industry</label>
          <select 
            id="industry" 
            name="industry" 
            className="form-control"
            value={filters.industry}
            onChange={handleFilterChange}
          >
            <option value="">All Industries</option>
            {uniqueIndustries.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="role">Role / Stream</label>
          <select 
            id="role" 
            name="role" 
            className="form-control"
            value={filters.role}
            onChange={handleFilterChange}
          >
            <option value="">All Roles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <select 
            id="location" 
            name="location" 
            className="form-control"
            value={filters.location}
            onChange={handleFilterChange}
          >
            <option value="">All Locations</option>
            {uniqueLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="visa">Visa Status</label>
          <select 
            id="visa" 
            name="visa" 
            className="form-control"
            value={filters.visa}
            onChange={handleFilterChange}
          >
            <option value="">Select Visa Status</option>
            <option value="citizen_only">Australian Citizen Only</option>
            <option value="domestic_only">Domestic / PR / Citizen</option>
            <option value="international_eligible">International Student</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="timing">Timing</label>
          <select 
            id="timing" 
            name="timing" 
            className="form-control"
            value={filters.timing}
            onChange={handleFilterChange}
          >
            <option value="">All Programs</option>
            <option value="now">Opening Now</option>
            <option value="next_3_months">Opening in Next 3 Months</option>
          </select>
        </div>
      </div>

      <div className="results-count">
        Showing {filteredPrograms.length} {filteredPrograms.length === 1 ? 'program' : 'programs'}
      </div>

      <div className="results-grid">
        {filteredPrograms.length > 0 ? (
          filteredPrograms.map((program, idx) => (
            <div key={idx} className="glass-panel program-card">
              <div className="card-header">
                <h3 className="company-name">{program.company_name}</h3>
                <span className="program-type">{program.internship_type}</span>
              </div>
              
              <div className="card-body">
                <div className="info-row">
                  <span className="info-label">Industry:</span>
                  <span className="info-value">{program.category}</span>
                </div>
                {program.roles && program.roles.length > 0 && (
                  <div className="info-row">
                    <span className="info-label">Roles:</span>
                    <span className="info-value roles-list">{program.roles.join(', ')}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">Apply:</span>
                  <span className="info-value">{program.open_close_dates}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Dates:</span>
                  <span className="info-value">{program.program_dates}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Visa:</span>
                  <span className="info-value">
                    {program.visa_status === 'international_eligible' 
                      ? 'International Eligible' 
                      : program.visa_status === 'citizen_only'
                        ? 'Australian Citizen Only'
                        : 'Domestic / PR / Citizen'}
                  </span>
                </div>
              </div>

              <div className="tags-container">
                {program.location.map(loc => (
                  <span key={loc} className="tag location">{loc}</span>
                ))}
                {program.visa_tags && program.visa_tags.map(tag => (
                  <span key={tag} className="tag visa-tag">{tag}</span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <h3>No programs match these filters</h3>
            <p>Know one we missed?</p>
            <a
              href={FEEDBACK_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent"
              id="empty-state-feedback-link"
            >
              Submit a Program
            </a>
          </div>
        )}
      </div>
      <Analytics />
    </div>
  );
}

export default App;
