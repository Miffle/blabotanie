// components/FriendSection.jsx
import React from "react";

export default function FriendSection({items, renderItem, emptyMessage }) {
  return (
    <div className="friends-section">
      <div className="friends-section-content">
        {items.length === 0 ? (
          <div className="empty-list">{emptyMessage}</div>
        ) : (
          items.map(renderItem)
        )}
      </div>
    </div>
  );
}
