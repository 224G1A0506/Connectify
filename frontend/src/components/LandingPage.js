import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css';
import { FaRobot, FaUser, FaTimes } from 'react-icons/fa'; // Import necessary icons
import AjayKumarImage from './ajaykumar.jpeg.jpeg';
import MahaboobBashaImage from './mahaboob.jpeg.jpeg';
import ManjunathReddyImage from './manjunath.jpeg.jpeg';
import ArifAzeemImage from './arif.jpeg.jpeg';

const LandingPage = () => {
  const navigate = useNavigate();
  const [readMoreContent, setReadMoreContent] = useState(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I assist you today?' }
  ]);
  const messagesEndRef = useRef(null);

  // Check if the user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (token) {
      navigate("/home"); // Redirect to home if logged in
    }
  }, [navigate]);

  // Add scroll animation effect
  useEffect(() => {
    const sections = document.querySelectorAll('.features-section, .about-section, .how-to-use-section, .contact-section, .testimonials-section, .team-section, .cta-banner, .blog-section, .faq-section, .newsletter-section');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    sections.forEach(section => {
      observer.observe(section);
    });

    // Add particles dynamically
    const particles = document.createElement('div');
    particles.className = 'particles';

    for (let i = 0; i < 10; i++) {
      const particle = document.createElement('span');
      particle.className = 'particle';
      particles.appendChild(particle);
    }

    document.querySelector('.landing-page').appendChild(particles);

    // Cleanup
    return () => {
      sections.forEach(section => {
        observer.unobserve(section);
      });
      if (particles.parentNode) {
        particles.parentNode.removeChild(particles);
      }
    };
  }, []);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    if (messagesEndRef.current && chatbotOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatbotOpen]);

  // Handle Read More click
  const handleReadMore = (content) => {
    setReadMoreContent(content);
  };

  // Handle chatbot input
  const handleChatbotInput = (e) => {
    setUserInput(e.target.value);
  };

  // Handle chatbot submit
  const handleChatbotSubmit = (e) => {
    e.preventDefault();
    if (userInput.trim() === '') return;

    // Add user message to chat
    setChatMessages((prevMessages) => [
      ...prevMessages,
      { sender: 'user', text: userInput },
    ]);

    // Get chatbot response
    const response = getChatbotResponse(userInput);
    
    // Add small delay for bot response to feel more natural
    setTimeout(() => {
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'bot', text: response },
      ]);
    }, 500);

    // Clear input
    setUserInput('');
  };

  // Get chatbot response
  const getChatbotResponse = (input) => {
    const lowerInput = input.toLowerCase();

    // Greetings
    if (lowerInput.includes('hi') || lowerInput.includes('hello') || lowerInput.includes('hey')) {
      return "Hello! How can I assist you today?";
    } else if (lowerInput.includes('good morning')) {
      return "Good morning! How can I help you?";
    } else if (lowerInput.includes('good afternoon')) {
      return "Good afternoon! How can I assist you?";
    } else if (lowerInput.includes('good evening')) {
      return "Good evening! How can I help you?";
    }

    // Connectify-related questions
    if (lowerInput.includes('what is connectify')) {
      return "Connectify is a next-generation social media platform designed to bring people closer in meaningful ways. It offers fast, secure, and immersive social networking experiences.";
    } else if (lowerInput.includes('how to sign up')) {
      return "You can sign up by clicking the 'Sign Up' button on the landing page and following the instructions.";
    } else if (lowerInput.includes('features')) {
      return "Connectify offers features like fast performance, global reach, and military-grade encryption for security.";
    } else if (lowerInput.includes('contact')) {
      return "You can contact us via email at arifazeem053@gmail.com or call us at +91 6300789328.";
    }

    // SRIT College-related questions
    if (lowerInput.includes('srit') || lowerInput.includes('college')) {
      if (lowerInput.includes('location') || lowerInput.includes('where')) {
        return "SRIT College is located in Anantapur, Andhra Pradesh, India.";
      } else if (lowerInput.includes('courses') || lowerInput.includes('programs')) {
        return "SRIT College offers courses in Engineering, Management, and Computer Applications.";
      } else if (lowerInput.includes('website')) {
        return "You can visit the official SRIT College website at https://www.srit.org.";
      } else if (lowerInput.includes('admission') || lowerInput.includes('apply')) {
        return "You can apply to SRIT College by visiting their official website and following the admission process.";
      } else if (lowerInput.includes('placement') || lowerInput.includes('career')) {
        return "SRIT College has a strong placement record with top companies visiting the campus for recruitment.";
      } else if (lowerInput.includes('facilities') || lowerInput.includes('campus')) {
        return "SRIT College offers state-of-the-art facilities including a library, hostels, sports complexes, and more.";
      } else if (lowerInput.includes('contact') || lowerInput.includes('email') || lowerInput.includes('phone')) {
        return "You can contact SRIT College via their official website or call their administration office.";
      } else {
        return "SRIT College is a renowned institution offering quality education in various fields. How can I assist you further?";
      }
    }

    // Arif Azeem-related questions
    if (lowerInput.includes('arif azeem')) {
      if (lowerInput.includes('role') || lowerInput.includes('position')) {
        return "Arif Azeem is the Lead Developer of Connectify.";
      } else if (lowerInput.includes('contact') || lowerInput.includes('email')) {
        return "You can contact Arif Azeem via email at arifazeem053@gmail.com.";
      } else if (lowerInput.includes('qualification') || lowerInput.includes('education')) {
        return "Arif Azeem holds a degree in Computer Science and has expertise in web development and software engineering.";
      } else if (lowerInput.includes('project') || lowerInput.includes('work')) {
        return "Arif Azeem has contributed significantly to the development of Connectify, focusing on backend systems and user experience.";
      } else {
        return "Arif Azeem is a skilled developer and a key member of the Connectify team. How can I assist you further?";
      }
    }

    // Default response
    return "I'm sorry, I don't understand that. Can you please ask something about Connectify, SRIT College, or Arif Azeem?";
  };

  return (
    <div className="landing-page">
      {/* 3D Background */}
      <div className="background-3d"></div>

      <div className="content-container">
        {/* Hero Section */}
        <div className="hero-section">
          <h1 className="hero-title">Connectify</h1>
          <p className="hero-subtext">
            Your Social World Simplified. Connect, share, and engage with people from across the globe in a secure and immersive digital environment.
          </p>
          <div className="cta-buttons">
            <Link to="/signin" className="cta-button">Sign In</Link>
            <Link to="/signup" className="cta-button">Sign Up</Link>
            <button className="cta-button" onClick={() => setChatbotOpen(true)}>Chat with AI</button>
          </div>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <h2 className="section-title">Why Choose Connectify?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Fast & Reliable</h3>
              <p>Experience lightning-fast performance with our cutting-edge technology. No lag, no waiting - just pure connection.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>Global Reach</h3>
              <p>Connect with people from all corners of the world. Break boundaries and build relationships that span continents.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Private</h3>
              <p>Your data is protected with military-grade encryption. We prioritize your privacy above everything else.</p>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="testimonials-section">
          <h2 className="section-title">What Our Users Say</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p className="testimonial-text">"Connectify blew my mind! It's like Facebook on steroids. The speed and features are insane!"</p>
              <p className="testimonial-author">- Harsha</p>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">"I've never seen a social platform this smooth and secure. Connectify is the future!"</p>
              <p className="testimonial-author">- Kiran Kumar</p>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">"This platform is a game-changer. I can't believe how easy it is to connect with people worldwide!"</p>
              <p className="testimonial-author">- Pavan Adithya</p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="team-section">
  <h2 className="section-title">Meet the Dream Team</h2>
  <div className="team-grid">
    {/* Ajay Kumar */}
    <div className="team-card">
      <div className="team-photo">
        <img src={AjayKumarImage} alt="Ajay Kumar" />
      </div>
      <h3>Ajay Kumar</h3>
      <p>Frontend Developer</p>
      <p className="team-bio">The wizard behind the stunning UI. Ajay makes sure every pixel is perfect.</p>
    </div>

    {/* Mahaboob Basha */}
    <div className="team-card">
      <div className="team-photo">
        <img src={MahaboobBashaImage} alt="Mahaboob Basha" />
      </div>
      <h3>Mahaboob Basha</h3>
      <p>Backend Developer</p>
      <p className="team-bio">The backbone of Connectify. Mahaboob ensures everything runs like clockwork.</p>
    </div>

    {/* Manjunath Reddy */}
    <div className="team-card">
      <div className="team-photo">
        <img src={ManjunathReddyImage} alt="Manjunath Reddy" />
      </div>
      <h3>Manjunath Reddy</h3>
      <p>Team Leader</p>
      <p className="team-bio">The captain of the ship. Manjunath keeps the team focused and driven.</p>
    </div>

    {/* Arif Azeem */}
    <div className="team-card">
      <div className="team-photo">
        <img src={ArifAzeemImage} alt="Arif Azeem" />
      </div>
      <h3>Arif Azeem</h3>
      <p>Lead Developer</p>
      <p className="team-bio">The visionary. Arif turns ideas into reality with his coding superpowers.</p>
    </div>
  </div>
</div>
        {/* CTA Banner */}
        <div className="cta-banner">
          <h2>Ready to Join the Revolution?</h2>
          <p>Sign up today and start connecting with people around the world!</p>
          <Link to="/signup" className="cta-button">Get Started</Link>
        </div>

        {/* Blog Section */}
<div className="blog-section">
  <h2 className="section-title">Latest News & Updates</h2>
  <div className="blog-grid">
    <div className="blog-card">
      <h3>New Feature: Direct Messaging</h3>
      <p>We've just launched our new real-time messaging system. Check it out!</p>
      <button onClick={() => handleReadMore("Direct Messaging Content")} className="read-more">Read More →</button>
    </div>
    <div className="blog-card">
      <h3>Connectify 2.0 Released</h3>
      <p>Discover the new features and improvements in our latest update.</p>
      <button onClick={() => handleReadMore("Connectify 2.0 Content")} className="read-more">Read More →</button>
    </div>
    <div className="blog-card">
      <h3>Tips for Better Networking</h3>
      <p>Learn how to make the most out of Connectify and grow your network.</p>
      <button onClick={() => handleReadMore("Networking Tips Content")} className="read-more">Read More →</button>
    </div>
  </div>
</div>
        
{/* Read More Section */}
{readMoreContent && (
  <div className="read-more-section">
    <div className="read-more-content">
      <h2>{readMoreContent}</h2>
      <p>
        {readMoreContent === "Direct Messaging Content" && (
          "Our new real-time messaging system allows you to connect with friends and family instantly. Enjoy seamless communication with end-to-end encryption for maximum security."
        )}
        {readMoreContent === "Connectify 2.0 Content" && (
          "Connectify 2.0 introduces new features like enhanced privacy controls, improved performance, and a redesigned user interface. Stay connected like never before!"
        )}
        {readMoreContent === "Networking Tips Content" && (
          "Learn how to grow your network on Connectify. Follow these tips: 1. Be active and engage with others. 2. Share valuable content. 3. Join groups and communities. 4. Connect with like-minded individuals."
        )}
      </p>
      <button onClick={() => setReadMoreContent(null)} className="close-button">Close</button>
    </div>
  </div>
)}
 

        {/* FAQ Section */}
        <div className="faq-section">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3>How do I sign up?</h3>
              <p>Signing up is easy! Just click on the "Sign Up" button and follow the instructions.</p>
            </div>
            <div className="faq-item">
              <h3>Is Connectify free to use?</h3>
              <p>Yes, Connectify is completely free to use with optional premium features.</p>
            </div>
            <div className="faq-item">
              <h3>How secure is my data?</h3>
              <p>Your data is protected with military-grade encryption. We take your privacy seriously.</p>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="newsletter-section">
          <h2 className="section-title">Stay Updated</h2>
          <p className="newsletter-text">Subscribe to our newsletter for the latest updates and features.</p>
          <form className="newsletter-form">
            <input type="email" placeholder="Enter your email" required />
            <button type="submit">Subscribe</button>
          </form>
        </div>

        {/* About Section */}
        <div className="about-section">
          <h2 className="section-title">About Connectify</h2>
          <p className="about-text">
            Connectify is a next-generation social media platform designed to bring people closer in meaningful ways.
            Built with <strong>React</strong>, <strong>Node.js</strong>, and <strong>WebSocket</strong>,
            Connectify offers a seamless and immersive experience that prioritizes genuine human connection.
          </p>
        </div>

        {/* Contact Section */}
        <div className="contact-section">
          <h2 className="section-title">Contact Us</h2>
          <p className="contact-text">
            Have questions or suggestions? We'd love to hear from you:
          </p>
          <p className="contact-info">
            <strong>Email:</strong> <a href="mailto:arifazeem053@gmail.com">arifazeem053@gmail.com</a>
          </p>
          <p className="contact-info">
            <strong>Phone:</strong> +91 6300789328
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <p className="footer-text">© 2023 Connectify. All rights reserved.</p>
        <div className="social-links">
          <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://linkedin.com/in/your-profile" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://twitter.com/your-profile" target="_blank" rel="noopener noreferrer">Twitter</a>
        </div>
        <button className="chatbot-footer-button" onClick={() => setChatbotOpen(true)}>Chat with AI</button>
      </div>

      {/* Chatbot Floating Button */}
      <div className="chatbot-button" onClick={() => setChatbotOpen(!chatbotOpen)}>
        <FaRobot className="chatbot-icon" />
        <span className="tooltip">Need help? Chat with our AI assistant!</span>
      </div>

      {/* Chatbot Container */}
      <div className={`chatbot-container ${chatbotOpen ? 'active' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-title">
            <FaRobot className="chatbot-header-icon" />
            <span>Connectify Assistant</span>
          </div>
          <button 
            className="chatbot-close-btn" 
            onClick={() => setChatbotOpen(false)}
            aria-label="Close chatbot"
          >
            <FaTimes />
          </button>
        </div>

        {chatbotOpen && (
          <div className="chatbot-body">
            <div className="chat-messages">
              {chatMessages.map((message, index) => (
                <div key={index} className={`chat-message ${message.sender}`}>
                  <div className="message-avatar">
                    {message.sender === 'bot' ? <FaRobot /> : <FaUser />}
                  </div>
                  <div className="message-content">
                    <p>{message.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} /> {/* Empty div for scrolling to bottom */}
            </div>
            
            <form className="chatbot-input" onSubmit={handleChatbotSubmit}>
              <input
                type="text"
                placeholder="Ask me anything about Connectify..."
                value={userInput}
                onChange={handleChatbotInput}
                aria-label="Chat message"
              />
              <button type="submit" aria-label="Send message">Send</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;