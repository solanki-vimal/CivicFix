// Public can read; login required to post. isOfficialUpdate
// is set entirely server-side from the poster's role — nothing here
// decides or claims that badge, it just displays what the API returned.

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as issueApi from '../api/issueApi';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import './CommentSection.css';

export default function CommentSection({ issueId }) {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    issueApi
      .getComments(issueId)
      .then((res) => setComments(res.data))
      .finally(() => setLoading(false));
  }, [issueId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    setError('');
    try {
      const res = await issueApi.addComment(issueId, text.trim());
      setComments((prev) => [res.data, ...prev]);
      setText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post your comment.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="comment-section">
      <h2>Comments</h2>

      {isAuthenticated ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add an update or comment…"
            maxLength={500}
            rows={3}
          />
          {error && <p className="comment-form-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={posting || !text.trim()}>
            {posting ? 'Posting…' : 'Post comment'}
          </button>
        </form>
      ) : (
        <p className="comment-login-prompt">Log in to add a comment.</p>
      )}

      {loading ? (
        <p className="comment-loading">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="comment-empty">No comments yet.</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c._id} className="comment-item">
              <div className="comment-item-header">
                <span className="comment-author">{c.user?.name}</span>
                {c.isOfficialUpdate && <span className="official-badge">Official Update</span>}
                <span className="comment-time">{formatRelativeTime(c.createdAt)}</span>
              </div>
              <p className="comment-text">{c.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
