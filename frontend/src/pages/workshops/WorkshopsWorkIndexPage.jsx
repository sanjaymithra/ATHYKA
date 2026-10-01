import React, { useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useContent } from '../../content';
import { prefetchRoute } from '../../utils/prefetch';
import './WorkshopsWorkIndexPage.css';

export default function WorkshopsWorkIndexPage() {
  const gridTopRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedTopic = searchParams.get('topic') || '';
  const selectedType = searchParams.get('type') || '';
  const selectedYear = searchParams.get('year') || '';
  const searchQuery = searchParams.get('q') || '';
  const currentPage = Math.max(1, Number(searchParams.get('page')) || 1);

  const { items, totalCount, totalPages, page, availableFilters } = useContent('pastWorkshops', {
    page: currentPage,
    pageSize: 12,
    filters: {
      topic: selectedTopic,
      institutionType: selectedType,
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
      next.delete('page');
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
    <div className="ws-work-container">
      {/* 1. Header */}
      <div ref={gridTopRef} className="work-header">
        <div>
          <span className="work-header-eyebrow">CAMPUS SESSIONS / ARCHIVE</span>
          <h1 className="work-title">Previous Work</h1>
        </div>
        <div className="work-count-badge">
          <span className="count-number">{totalCount}</span>
          <span className="count-label">SESSIONS</span>
        </div>
      </div>

      {/* 2. Filters & Search */}
      <div className="work-filter-bar">
        <div className="work-search-box">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => updateParam('q', e.target.value)}
            placeholder="Search by campus, city, or topic..."
            className="work-search-input"
            aria-label="Search campus sessions"
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

        <div className="filter-chips-wrapper">
          {/* Topic Chips */}
          <div className="chip-group" role="group" aria-label="Filter by topic">
            <span className="chip-group-label">TOPIC:</span>
            <button
              type="button"
              onClick={() => updateParam('topic', '')}
              className={`filter-chip ${!selectedTopic ? 'is-active' : ''}`}
            >
              All
            </button>
            {availableFilters.topics.map((top) => (
              <button
                key={top}
                type="button"
                onClick={() => updateParam('topic', selectedTopic === top ? '' : top)}
                className={`filter-chip ${selectedTopic === top ? 'is-active' : ''}`}
              >
                {top}
              </button>
            ))}
          </div>

          {/* Institution Type Chips */}
          <div className="chip-group" role="group" aria-label="Filter by institution type">
            <span className="chip-group-label">TYPE:</span>
            <button
              type="button"
              onClick={() => updateParam('type', '')}
              className={`filter-chip ${!selectedType ? 'is-active' : ''}`}
            >
              All
            </button>
            {availableFilters.institutionTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => updateParam('type', selectedType === t ? '' : t)}
                className={`filter-chip ${selectedType === t ? 'is-active' : ''}`}
              >
                {t}
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

      {/* 3. Cards Grid */}
      {items.length === 0 ? (
        <div className="work-empty-state">
          <p className="empty-state-msg">No campus sessions match your filter criteria.</p>
          <div className="empty-state-actions">
            <button
              type="button"
              onClick={() => setSearchParams(new URLSearchParams())}
              className="ds-btn-outline"
            >
              RESET FILTERS
            </button>
            <Link to="/workshops/book" className="ds-btn-gold">
              WANT THIS ON YOUR CAMPUS? BOOK A WORKSHOP
            </Link>
          </div>
        </div>
      ) : (
        <div className="work-cards-grid">
          {items.map((ws) => (
            <Link
              key={ws.id}
              to={`/workshops/work/${ws.slug}`}
              onMouseEnter={() => prefetchRoute(`/workshops/work/${ws.slug}`)}
              className="work-card"
            >
              <div className="work-card-media">
                <img
                  src={ws.photo?.url || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop'}
                  alt={ws.institution}
                  loading="lazy"
                  width={640}
                  height={400}
                  className="work-card-img"
                />
                <span className="work-card-year">{ws.date || ws.year}</span>
              </div>

              <div className="work-card-body">
                <div className="work-card-meta">
                  <span className="work-card-client">{ws.institution}</span>
                  <span className="work-card-industry">{ws.city}</span>
                </div>
                <h3 className="work-card-title">{ws.topicTitle || `${ws.topic} Workshop`}</h3>
                <p className="work-card-outcome">"{ws.quote}"</p>

                <div className="work-card-tags">
                  <span className="work-tag">{ws.topic}</span>
                  <span className="work-tag">{ws.institutionType}</span>
                  <span className="work-tag">{ws.attendees}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 4. Numbered Pagination */}
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
