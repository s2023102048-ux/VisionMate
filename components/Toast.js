'use client';

import { useEffect, useRef } from 'react';

export default function Toast({ message, visible }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (visible) {
      clearTimeout(timerRef.current);
    }
  }, [visible, message]);

  if (!visible) return null;

  return (
    <div className="toast" id="toast">
      <span id="toast-message">{message}</span>
    </div>
  );
}
