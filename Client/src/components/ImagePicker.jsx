// Up to 3 photos, each JPG/PNG/WEBP and under 5 MB (the same limits Multer
// enforces server-side). Rejected files are explained to the user instead of
// silently dropped; the server check stays as the safety net.

import { useEffect, useRef, useState } from 'react';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_IMAGES } from '../validation/issueSchemas';
import './ImagePicker.css';

export default function ImagePicker({ value = [], onChange, error }) {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);
  const [problems, setProblems] = useState([]);

  // Preview URLs are created and revoked inside the effect itself, so React
  // StrictMode's dev-only mount/unmount/mount cycle can't leave images
  // pointing at an already-revoked URL.
  useEffect(() => {
    const urls = value.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [value]);

  const handleSelect = (event) => {
    const incoming = Array.from(event.target.files || []);
    event.target.value = ''; // lets the same file be picked again after removing it

    const accepted = [];
    const rejected = [];
    const slots = MAX_IMAGES - value.length;

    incoming.forEach((file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        rejected.push(`${file.name} is not a JPG, PNG or WEBP image`);
      } else if (file.size > MAX_IMAGE_BYTES) {
        rejected.push(`${file.name} is over 5 MB`);
      } else if (accepted.length >= slots) {
        rejected.push(`${file.name} was not added, the limit is ${MAX_IMAGES} photos`);
      } else {
        accepted.push(file);
      }
    });

    setProblems(rejected);
    if (accepted.length > 0) onChange([...value, ...accepted]);
  };

  const removeAt = (index) => {
    setProblems([]);
    onChange(value.filter((_, i) => i !== index));
  };

  const full = value.length >= MAX_IMAGES;

  return (
    <div className="image-picker">
      <div className="image-picker-bar">
        <label className="btn-secondary" aria-disabled={full} htmlFor="issue-photos">
          Add photos
        </label>
        <input
          ref={inputRef}
          id="issue-photos"
          className="visually-hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={full}
          onChange={handleSelect}
        />
        <span className="image-picker-count">
          {value.length} of {MAX_IMAGES} added. JPG, PNG or WEBP, up to 5 MB each.
        </span>
      </div>

      {previews.length > 0 && (
        <ul className="image-picker-list">
          {value.map((file, index) => (
            <li key={`${file.name}-${file.size}-${index}`} className="image-picker-item">
              {previews[index] && <img src={previews[index]} alt={`Preview of ${file.name}`} />}
              <button type="button" onClick={() => removeAt(index)} aria-label={`Remove ${file.name}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {problems.length > 0 && (
        <ul className="image-picker-problems" role="alert">
          {problems.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      {error && <div className="field-error">{error.message}</div>}
    </div>
  );
}
