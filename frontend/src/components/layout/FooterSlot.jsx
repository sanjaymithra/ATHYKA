import React from 'react';

/**
 * Empty FooterSlot reserving 96px bottom padding
 * As specified: NO footer anywhere on any page, only this empty slot
 */
export default function FooterSlot() {
  return (
    <div
      className="athyka-footer-slot"
      style={{ height: '96px', width: '100%', pointerEvents: 'none' }}
      aria-hidden="true"
    />
  );
}
