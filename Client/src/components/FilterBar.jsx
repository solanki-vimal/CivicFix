// Gap flagged, not silently dropped: section 3.4 of the project doc lists
// "date range" as a feed filter, but Server/validators/issueValidators.js's
// listIssuesQuerySchema (Phase 4) never implemented it — only category,
// status, department, and the geo params exist server-side. A date-range
// control here would do nothing, so it's left out until the backend adds
// support, rather than built as dead UI.

import { useEffect, useState } from 'react';
import * as departmentApi from '../api/departmentApi';
import * as categoryApi from '../api/categoryApi';
import { STATUS_LABELS } from './StatusBadge';
import './FilterBar.css';

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);

export default function FilterBar({ filters, onChange, onNearMe, nearMeActive, nearMeLoading }) {
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    departmentApi.getDepartments().then((res) => setDepartments(res.data));
  }, []);

  useEffect(() => {
    categoryApi.getCategories(filters.department || undefined).then((res) => setCategories(res.data));
  }, [filters.department]);

  const handleField = (key) => (e) => {
    const value = e.target.value;
    // Changing department invalidates the current category selection, since
    // categories are scoped to a department (the auto-routing link).
    if (key === 'department') {
      onChange({ ...filters, department: value, category: '' });
    } else {
      onChange({ ...filters, [key]: value });
    }
  };

  return (
    <div className="filter-bar">
      <select value={filters.department || ''} onChange={handleField('department')} aria-label="Filter by department">
        <option value="">All departments</option>
        {departments.map((d) => (
          <option key={d._id} value={d._id}>
            {d.name}
          </option>
        ))}
      </select>

      <select value={filters.category || ''} onChange={handleField('category')} aria-label="Filter by category">
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>

      <select value={filters.status || ''} onChange={handleField('status')} aria-label="Filter by status">
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <button
        type="button"
        className={`near-me-toggle${nearMeActive ? ' active' : ''}`}
        onClick={onNearMe}
        disabled={nearMeLoading}
      >
        {nearMeLoading ? 'Locating…' : nearMeActive ? 'Near me ✓' : 'Near me'}
      </button>
    </div>
  );
}
