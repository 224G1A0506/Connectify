import React, { useState, useRef, useEffect } from 'react';

const EmojiCommentInput = ({ value, onChange, onSubmit, placeholder = "Add a comment" }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const emojis = [
    "😀", "😂", "🥰", "😊", "😎", "🤔", "😴", "😍",
    "👍", "🎉", "❤️", "🔥", "✨", "🙌", "👏", "💪",
    "🌈", "🌟", "💖", "🎵", "🎮", "📸", "🎨", "🎭"
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) &&
          event.target.className !== 'material-symbols-outlined') {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const insertEmoji = (emoji) => {
    if (!value) {
      onChange(emoji);
      return;
    }
    
    const start = value.substring(0, cursorPosition);
    const end = value.substring(cursorPosition);
    const newComment = start + emoji + end;
    onChange(newComment);
    
    if (inputRef.current) {
      inputRef.current.focus();
      setTimeout(() => {
        const newPosition = cursorPosition + emoji.length;
        inputRef.current.selectionStart = newPosition;
        inputRef.current.selectionEnd = newPosition;
        setCursorPosition(newPosition);
      }, 0);
    }
  };

  const handleInputClick = (e) => {
    setCursorPosition(e.target.selectionStart);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="add-comment">
      <span 
        className="material-symbols-outlined"
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
      >
        mood
      </span>
      
      {showEmojiPicker && (
        <div 
          ref={emojiPickerRef}
          className="emoji-picker"
        >
          <div className="emoji-grid">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                className="emoji-button"
                onClick={() => insertEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value || ""}
        onChange={(e) => {
          onChange(e.target.value);
          setCursorPosition(e.target.selectionStart);
        }}
        onClick={handleInputClick}
        onKeyPress={handleKeyPress}
      />
      
      <button
        className="comment"
        onClick={onSubmit}
      >
        Post
      </button>
    </div>
  );
};

export default EmojiCommentInput;
