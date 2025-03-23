import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './StoryCreation.css';

const StoryCreation = () => {
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textPosition, setTextPosition] = useState('center');
  const [mediaType, setMediaType] = useState('image');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      setMediaType('image');
    } else if (file.type.startsWith('video/')) {
      setMediaType('video');
    } else {
      toast.error('Please upload an image or video file');
      return;
    }

    setMedia(file);
    const fileReader = new FileReader();
    fileReader.onload = () => setMediaPreview(fileReader.result);
    fileReader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!media) {
      toast.error('Please select a media file');
      return;
    }
    
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('media', media);
      formData.append('text', text);
      formData.append('textColor', textColor);
      formData.append('textPosition', textPosition);
      formData.append('mediaType', mediaType);
      
      const token = localStorage.getItem('jwt');
      const response = await fetch('/api/create-story', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        body: formData
      });
  
      if (!response.ok) {
        // Handle non-JSON responses
        const text = await response.text();
        try {
          const json = JSON.parse(text); // Try to parse as JSON
          throw new Error(json.message || 'Failed to create story');
        } catch (e) {
          throw new Error(`Failed to create story. Response: ${text}`);
        }
      }
  
      const result = await response.json();
      
      toast.success('Story created successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error(error.message || 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-story-container">
      <h2>Create Story</h2>
      <form onSubmit={handleSubmit}>
        <div className="media-preview-container">
          {mediaPreview && (
            <div className="media-preview">
              {mediaType === 'image' ? (
                <img src={mediaPreview} alt="Preview" />
              ) : (
                <video src={mediaPreview} controls />
              )}
              {text && (
                <div 
                  className={`text-overlay ${textPosition}`} 
                  style={{ color: textColor }}
                >
                  {text}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="media">Select Media</label>
          <input 
            type="file" 
            id="media" 
            accept="image/*, video/*" 
            onChange={handleMediaChange} 
            className="form-control"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="text">Add Text (Optional)</label>
          <input 
            type="text" 
            id="text" 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            className="form-control"
            placeholder="Enter text to display on your story"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="textColor">Text Color</label>
          <input 
            type="color" 
            id="textColor" 
            value={textColor} 
            onChange={(e) => setTextColor(e.target.value)} 
            className="form-control"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="textPosition">Text Position</label>
          <select 
            id="textPosition" 
            value={textPosition} 
            onChange={(e) => setTextPosition(e.target.value)} 
            className="form-control"
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading || !media}
        >
          {loading ? 'Creating...' : 'Create Story'}
        </button>
      </form>
    </div>
  );
};

export default StoryCreation;