// Up to 3 images per issue (enforced server-side by Multer) — a main view
// with a thumbnail strip underneath, not a full carousel library.

import { useState } from 'react';
import './ImageGallery.css';

export default function ImageGallery({ images = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="gallery-empty" aria-hidden="true">
        No photos attached
      </div>
    );
  }

  return (
    <div className="gallery">
      <div className="gallery-main">
        <img src={images[activeIndex]} alt={`Issue photo ${activeIndex + 1} of ${images.length}`} />
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`gallery-thumb${i === activeIndex ? ' active' : ''}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`Show photo ${i + 1}`}
            >
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
