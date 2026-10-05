// Whether the current user has already upvoted is read directly from the
// issue's own `upvotes` array (an array of user IDs, already included in
// GET /api/issues/:id) rather than tracked separately — that array is the
// actual source of truth, so there's nothing to get out of sync.

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as issueApi from '../api/issueApi';
import './UpvoteButton.css';

export default function UpvoteButton({ issue, onUpdate }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState(false);

  const alreadyUpvoted = isAuthenticated && issue.upvotes?.some((id) => id === user._id || id?._id === user._id);

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setPending(true);
    try {
      const res = await issueApi.toggleUpvote(issue._id);
      onUpdate(res.data.upvoteCount, !alreadyUpvoted);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      className={`upvote-button${alreadyUpvoted ? ' active' : ''}`}
      onClick={handleClick}
      disabled={pending}
      aria-pressed={alreadyUpvoted}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 4l8 10h-5v6H9v-6H4z" />
      </svg>
      <span>{issue.upvoteCount ?? 0}</span>
      <span className="upvote-label">{alreadyUpvoted ? "You're affected too" : 'I am also affected'}</span>
    </button>
  );
}
