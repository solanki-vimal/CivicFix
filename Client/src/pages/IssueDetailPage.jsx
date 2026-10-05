import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ImageGallery from '../components/ImageGallery';
import StatusBadge from '../components/StatusBadge';
import StatusTimeline from '../components/StatusTimeline';
import UpvoteButton from '../components/UpvoteButton';
import CommentSection from '../components/CommentSection';
import * as issueApi from '../api/issueApi';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import './IssueDetailPage.css';

export default function IssueDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { joinIssueRoom, leaveIssueRoom, socket } = useSocket();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchIssue = useCallback(() => {
    return issueApi
      .getIssueById(id)
      .then((res) => setIssue(res.data))
      .catch(() => setError('This issue could not be found.'));
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchIssue().finally(() => setLoading(false));
  }, [fetchIssue]);

  // Join this issue's room for the duration of viewing it, so a status
  // change made by staff elsewhere reflects here live, no refresh needed.
  useEffect(() => {
    joinIssueRoom(id);
    return () => leaveIssueRoom(id);
  }, [id, joinIssueRoom, leaveIssueRoom]);

  useEffect(() => {
    if (!socket) return;
    const handleStatusUpdate = (payload) => {
      if (payload.issueId === id) {
        fetchIssue(); // re-fetch rather than hand-reconstruct the new timeline entry
      }
    };
    socket.on('statusUpdate', handleStatusUpdate);
    return () => socket.off('statusUpdate', handleStatusUpdate);
  }, [socket, id, fetchIssue]);

  const handleUpvoteUpdate = (newCount, wasAdded) => {
    setIssue((prev) => ({
      ...prev,
      upvoteCount: newCount,
      upvotes: wasAdded ? [...(prev.upvotes || []), user._id] : (prev.upvotes || []).filter((u) => u !== user._id && u?._id !== user._id),
    }));
  };

  if (loading) {
    return (
      <div className="detail-shell">
        <Navbar />
        <p className="detail-loading">Loading…</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="detail-shell">
        <Navbar />
        <div className="detail-content">
          <p className="detail-error">{error}</p>
          <Link to="/">Back to the feed</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-shell">
      <Navbar />
      <div className="detail-content">
        <Link to="/" className="detail-back">
          ← Back to feed
        </Link>

        <div className="detail-top">
          <span className="detail-category" style={{ color: issue.category?.color }}>
            {issue.category?.name}
          </span>
          <StatusBadge status={issue.status} />
        </div>

        <h1>{issue.title}</h1>
        <p className="detail-meta">
          {issue.address || 'Location pinned on map'} · Reported by {issue.reportedBy?.name} ·{' '}
          {formatRelativeTime(issue.createdAt)}
        </p>

        <ImageGallery images={issue.images} />

        <p className="detail-description">{issue.description}</p>

        <UpvoteButton issue={issue} onUpdate={handleUpvoteUpdate} />

        <section className="detail-section">
          <h2>Status timeline</h2>
          <StatusTimeline history={issue.statusHistory} />
        </section>

        <CommentSection issueId={issue._id} />
      </div>
    </div>
  );
}
