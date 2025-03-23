import React, { useState, useRef } from 'react';
import './EmojiCommentInput.css';

const EmojiCommentInput = ({ value, onChange, onSubmit, placeholder }) => {
  const [showEmojis, setShowEmojis] = useState(false);
  const emojiPickerRef = useRef(null);
  
  // Common emoji sets
  const emojiSets = [
    { category: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗'] },
    { category: 'Gestures', emojis: ['👍', '👎', '👏', '🙌', '🤝', '👊', '✌️', '🤞', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆'] },
    { category: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗'] },
  ];

  const handleEmojiSelect = (emoji) => {
    onChange(value + emoji);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit();
    }
  };

  // Close emoji picker when clicking outside
  const handleClickOutside = (e) => {
    if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
      setShowEmojis(false);
    }
  };

  // Add event listener for clicking outside
  React.useEffect(() => {
    if (showEmojis) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojis]);

  return (
    <form className="emoji-comment-form" onSubmit={handleSubmit}>
      <div className="emoji-input-container">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="emoji-text-input"
        />
        <button
          type="button"
          className="emoji-button"
          onClick={() => setShowEmojis(!showEmojis)}
        >
          😊
        </button>
        {showEmojis && (
          <div className="emoji-picker" ref={emojiPickerRef}>
            {emojiSets.map((set, setIndex) => (
              <div key={setIndex} className="emoji-category">
                <h4>{set.category}</h4>
                <div className="emoji-grid">
                  {set.emojis.map((emoji, index) => (
                    <button
                      key={index}
                      className="emoji-item"
                      onClick={() => handleEmojiSelect(emoji)}
                      type="button"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <button type="submit" className="comment-submit-button">
        Post
      </button>
    </form>
  );
};

export default EmojiCommentInput;