import React, { useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useContent } from '../../content';
import { prefetchRoute } from '../../utils/prefetch';
import './WorkIndexPage.css';

export default function WorkIndexPage() {
  const gridTopRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedService = searchParams.get('service') || '';
  const selectedIndustry = searchParams.get('industry') || '';
  const selectedYear = searchParams.get('year') || '';
  const searchQuery = searchParams.get('q') || '';
  const currentPage = Math.max(1, Number(searchParams.get('page')) || 1);

  const { items, totalCount, totalPages, page, availableFilters } = useContent('projects', {
    page: currentPage,
    pageSize: 12,
    filters: {
      service: selectedService,
      industry: selectedIndustry,
      year: selectedYear,
      q: searchQuery
    }
  });

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, String(value));
    } else {
      next.delete(key);
    }
    if (key !== 'page') {
      next.delete('page'); // Reset to page 1 on new filter
    }
    setSearchParams(next);
  };

  const handlePageChange = (newPage) => {
    updateParam('page', newPage);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="work-index-container">
      {/* 1. Header with Count */}
      <div ref={gridTopRef} className="work-header">
        <div>
          <span className="work-header-eyebrow">DIGITAL SERVICES / CASE STUDIES</span>
          <h1 className="work-title">Selected Work</h1>
        </div>
        <div className="work-count-badge">
          <span className="count-number">{totalCount}</span>
          <span className="count-label">PROJECTS</span>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="work-filter-bar">
        {/* Search input */}
        <div className="work-search-box">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => updateParam('q', e.target.value)}
            placeholder="Search by client, challenge, or outcome..."
            className="work-search-input"
            aria-label="Search case studies"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => updateParam('q', '')}
              className="search-clear-btn"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Chip Groups */}
        <div className="filter-chips-wrapper">
          {/* Service Chips */}
          <div className="chip-group" role="group" aria-label="Filter by service">
            <span className="chip-group-label">SERVICE:</span>
            <button
              type="button"
              onClick={() => updateParam('service', '')}
              className={`filter-chip ${!selectedService ? 'is-active' : ''}`}
            >
              All
            </button>
            {availableFilters.services.map((srv) => (
              <button
                key={srv}
                type="button"
                onClick={() => updateParam('service', selectedService === srv ? '' : srv)}
                className={`filter-chip ${selectedService === srv ? 'is-active' : ''}`}
              >
                {srv.replace(/-/g, ' ')}
              </button>
            ))}
          </div>

          {/* Industry Chips */}
          <div className="chip-group" role="group" aria-label="Filter by industry">
            <span className="chip-group-label">INDUSTRY:</span>
            <button
              type="button"
              onClick={() => updateParam('industry', '')}
              className={`filter-chip ${!selectedIndustry ? 'is-active' : ''}`}
            >
              All
            </button>
            {availableFilters.industries.map((ind) => (
              <button
                key={ind}
                type="button"
                onClick={() => updateParam('industry', selectedIndustry === ind ? '' : ind)}
                className={`filter-chip ${selectedIndustry === ind ? 'is-active' : ''}`}
              >
                {ind}
              </button>
            ))}
          </div>

          {/* Year Chips */}
          <div className="chip-group" role="group" aria-label="Filter by year">
            <span className="chip-group-label">YEAR:</span>
            <button
              type="button"
              onClick={() => updateParam('year', '')}
              className={`filter-chip ${!selectedYear ? 'is-active' : ''}`}
            >
              All
            </button>
            {availableFilters.years.map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => updateParam('year', selectedYear === String(yr) ? '' : yr)}
                className={`filter-chip ${selectedYear === String(yr) ? 'is-active' : ''}`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Project Cards Grid */}
      {items.length === 0 ? (
        <div className="work-empty-state">
          <p className="empty-state-msg">No projects match the selected filters or search terms.</p>
          <div className="empty-state-actions">
            <button
              type="button"
              onClick={() => {
                setSearchParams(new URLSearchParams());
              }}
              className="ds-btn-outline"
            >
              CLEAR ALL FILTERS
            </button>
            <Link to="/digital-services/contact" className="ds-btn-gold">
              HAVE A UNIQUE PROBLEM? BOOK A CALL
            </Link>
          </div>
        </div>
      ) : (
        <div className="work-cards-grid">
          {items.map((proj) => (
            <Link
              key={proj.id}
              to={`/digital-services/work/${proj.slug}`}
              onMouseEnter={() => prefetchRoute(`/digital-services/work/${proj.slug}`)}
              className="work-card"
            >
              <div className="work-card-media">
                <img
                  src={proj.gallery?.[0]?.url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop'}
                  alt={proj.name}
                  loading="lazy"
                  width={640}
                  height={400}
                  className="work-card-img"
                />
                <span className="work-card-year">{proj.year}</span>
              </div>

              <div className="work-card-body">
                <div className="work-card-meta">
                  <span className="work-card-client">{proj.client}</span>
                  <span className="work-card-industry">{proj.industry}</span>
                </div>
                <h3 className="work-card-title">{proj.name}</h3>
                <p className="work-card-outcome">{proj.outcome}</p>

                <div className="work-card-tags">
                  {proj.services?.slice(0, 3).map((s) => (
                    <span key={s} className="work-tag">
                      {s.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 4. Numbered Pagination with Prev / Next */}
      {totalPages > 1 && (
        <nav className="work-pagination" aria-label="Pagination Navigation">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="pagination-btn pagination-prev"
            aria-label="Previous page"
          >
            ← PREV
          </button>

          <div className="pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
              <button
                key={pNum}
                type="button"
                onClick={() => handlePageChange(pNum)}
                className={`pagination-num-btn ${page === pNum ? 'is-active' : ''}`}
                aria-current={page === pNum ? 'page' : undefined}
              >
                {pNum}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="pagination-btn pagination-next"
            aria-label="Next page"
          >
            NEXT →
          </button>
        </nav>
      )}
    </div>
  );
}
