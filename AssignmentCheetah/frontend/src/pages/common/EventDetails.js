import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEventById, registerForEvent, getForumMessages, getThreadReplies, postForumMessage, deleteForumMessage, togglePinMessage, toggleMessageReaction } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './EventDetails.css';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, role, user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  
  // For Normal Events - Custom Form Data
  const [formData, setFormData] = useState({});
  
  // For Merchandise Events - Item Selection
  const [selectedItems, setSelectedItems] = useState([]);
  const [itemQuantities, setItemQuantities] = useState({});

  // Forum State
  const [forumMessages, setForumMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [forumPage, setForumPage] = useState(1);
  const [forumPagination, setForumPagination] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [postingMessage, setPostingMessage] = useState(false);
  const [activeThread, setActiveThread] = useState(null);
  const [threadReplies, setThreadReplies] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [forumLoading, setForumLoading] = useState(false);

  useEffect(() => {
    fetchEvent();
    fetchForumMessages();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await getEventById(id);
      setEvent(response.data);
      
      // Initialize formData for custom form fields
      if (response.data.eventType === 'Normal' && response.data.customForm) {
        const initialFormData = {};
        response.data.customForm.forEach(field => {
          initialFormData[field.name] = '';
        });
        setFormData(initialFormData);
      }
    } catch (error) {
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const fetchForumMessages = async (page = 1) => {
    setForumLoading(true);
    try {
      const response = await getForumMessages(id, page);
      setForumMessages(response.data.messages);
      setAnnouncements(response.data.announcements);
      setForumPagination(response.data.pagination);
      setForumPage(page);
    } catch (error) {
      // Forum errors are non-critical
      console.error('Failed to load forum messages');
    } finally {
      setForumLoading(false);
    }
  };

  const handlePostMessage = async () => {
    if (!newMessage.trim()) return;
    setPostingMessage(true);
    try {
      await postForumMessage(id, {
        content: newMessage,
        isAnnouncement,
      });
      setNewMessage('');
      setIsAnnouncement(false);
      fetchForumMessages(forumPage);
      toast.success('Message posted!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post message');
    } finally {
      setPostingMessage(false);
    }
  };

  const handlePostReply = async () => {
    if (!replyContent.trim() || !activeThread) return;
    setPostingMessage(true);
    try {
      await postForumMessage(id, {
        content: replyContent,
        parentMessage: activeThread._id,
      });
      setReplyContent('');
      // Refresh thread
      const res = await getThreadReplies(id, activeThread._id);
      setActiveThread(res.data.parentMessage);
      setThreadReplies(res.data.replies);
      fetchForumMessages(forumPage);
      toast.success('Reply posted!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post reply');
    } finally {
      setPostingMessage(false);
    }
  };

  const handleOpenThread = async (message) => {
    try {
      const res = await getThreadReplies(id, message._id);
      setActiveThread(res.data.parentMessage);
      setThreadReplies(res.data.replies);
    } catch (error) {
      toast.error('Failed to load thread');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await deleteForumMessage(id, messageId);
      toast.success('Message deleted');
      if (activeThread && activeThread._id === messageId) {
        setActiveThread(null);
        setThreadReplies([]);
      } else if (activeThread) {
        const res = await getThreadReplies(id, activeThread._id);
        setActiveThread(res.data.parentMessage);
        setThreadReplies(res.data.replies);
      }
      fetchForumMessages(forumPage);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete message');
    }
  };

  const handleTogglePin = async (messageId) => {
    try {
      await togglePinMessage(id, messageId);
      fetchForumMessages(forumPage);
      toast.success('Pin toggled');
    } catch (error) {
      toast.error('Failed to toggle pin');
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await toggleMessageReaction(id, messageId, { emoji });
      // Refresh the relevant data
      if (activeThread) {
        const res = await getThreadReplies(id, activeThread._id);
        setActiveThread(res.data.parentMessage);
        setThreadReplies(res.data.replies);
      }
      fetchForumMessages(forumPage);
    } catch (error) {
      toast.error('Failed to update reaction');
    }
  };

  const isEventOrganizer = event && role === 'organizer' && user && event.organizer?._id === user._id;

  const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '🤔', '👎'];

  const renderReactions = (message) => {
    // Group reactions by emoji
    const grouped = {};
    (message.reactions || []).forEach(r => {
      if (!grouped[r.emoji]) grouped[r.emoji] = [];
      grouped[r.emoji].push(r);
    });

    return (
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
        {Object.entries(grouped).map(([emoji, reactions]) => {
          const hasReacted = user && reactions.some(r => r.user === user._id);
          return (
            <button
              key={emoji}
              onClick={() => isAuthenticated && handleReaction(message._id, emoji)}
              style={{
                padding: '2px 8px',
                borderRadius: '12px',
                border: hasReacted ? '2px solid #667eea' : '1px solid #ddd',
                background: hasReacted ? '#eef0ff' : '#f8f9fa',
                cursor: isAuthenticated ? 'pointer' : 'default',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {emoji} <span style={{ fontSize: '12px' }}>{reactions.length}</span>
            </button>
          );
        })}
        {isAuthenticated && (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              className="emoji-add-btn"
              style={{
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px dashed #ccc',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              onClick={(e) => {
                const popup = e.currentTarget.nextSibling;
                popup.style.display = popup.style.display === 'flex' ? 'none' : 'flex';
              }}
            >
              +
            </button>
            <div
              style={{
                display: 'none',
                position: 'absolute',
                bottom: '100%',
                left: 0,
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '4px',
                gap: '4px',
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {REACTION_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(message._id, emoji)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMessageCard = (msg, isReply = false) => {
    const canDelete =
      isAuthenticated &&
      (isEventOrganizer || (user && msg.author === user._id));
    const canPin = isEventOrganizer && !isReply && !msg.parentMessage;

    return (
      <div
        key={msg._id}
        style={{
          padding: '12px 16px',
          borderLeft: msg.isAnnouncement
            ? '4px solid #f39c12'
            : msg.isPinned
            ? '4px solid #667eea'
            : '3px solid transparent',
          backgroundColor: msg.isAnnouncement
            ? '#fff8e1'
            : msg.isPinned
            ? '#f0f2ff'
            : '#fff',
          borderRadius: '8px',
          marginBottom: '10px',
          border: msg.isAnnouncement ? '1px solid #f39c12' : msg.isPinned ? '1px solid #c5caf5' : '1px solid #eee',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {msg.authorName}
            </span>
            {msg.authorModel === 'Organizer' && (
              <span
                style={{
                  marginLeft: '8px',
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#667eea',
                  color: 'white',
                }}
              >
                Organizer
              </span>
            )}
            {msg.isAnnouncement && (
              <span
                style={{
                  marginLeft: '8px',
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#f39c12',
                  color: 'white',
                }}
              >
                📢 Announcement
              </span>
            )}
            {msg.isPinned && !msg.isAnnouncement && (
              <span
                style={{
                  marginLeft: '8px',
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#667eea',
                  color: 'white',
                }}
              >
                📌 Pinned
              </span>
            )}
            <span style={{ marginLeft: '10px', fontSize: '12px', color: '#888' }}>
              {new Date(msg.createdAt).toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {canPin && (
              <button
                onClick={() => handleTogglePin(msg._id)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
                title={msg.isPinned ? 'Unpin' : 'Pin'}
              >
                📌
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => handleDeleteMessage(msg._id)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#e74c3c',
                }}
                title="Delete"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        <p style={{ margin: '8px 0 4px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{msg.content}</p>

        {renderReactions(msg)}

        {!isReply && !msg.parentMessage && (
          <div style={{ marginTop: '8px' }}>
            <button
              onClick={() => handleOpenThread(msg)}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#667eea',
                cursor: 'pointer',
                fontSize: '13px',
                padding: 0,
              }}
            >
              💬 {msg.replyCount > 0 ? `${msg.replyCount} replies` : 'Reply'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleItemSelection = (item, quantity) => {
    const itemKey = `${item.size}-${item.color}-${item.variant}`;
    
    if (quantity > 0) {
      // Validate against purchase limit
      if (quantity > item.purchaseLimit) {
        toast.error(`Maximum purchase limit is ${item.purchaseLimit} for this item`);
        return;
      }
      
      // Validate against stock
      if (quantity > item.stock) {
        toast.error(`Only ${item.stock} items available in stock`);
        return;
      }
      
      // Update selected items
      const existingIndex = selectedItems.findIndex(
        si => si.size === item.size && si.color === item.color && si.variant === item.variant
      );
      
      if (existingIndex >= 0) {
        const updated = [...selectedItems];
        updated[existingIndex] = {
          size: item.size,
          color: item.color,
          variant: item.variant,
          quantity: parseInt(quantity)
        };
        setSelectedItems(updated);
      } else {
        setSelectedItems([...selectedItems, {
          size: item.size,
          color: item.color,
          variant: item.variant,
          quantity: parseInt(quantity)
        }]);
      }
      
      setItemQuantities({
        ...itemQuantities,
        [itemKey]: parseInt(quantity)
      });
    } else {
      // Remove item if quantity is 0
      setSelectedItems(selectedItems.filter(
        si => !(si.size === item.size && si.color === item.color && si.variant === item.variant)
      ));
      
      const newQuantities = { ...itemQuantities };
      delete newQuantities[itemKey];
      setItemQuantities(newQuantities);
    }
  };

  const validateNormalEventForm = () => {
    if (!event.customForm || event.customForm.length === 0) {
      return true; // No custom form, so valid
    }
    
    for (const field of event.customForm) {
      if (field.required && !formData[field.name]) {
        toast.error(`${field.label} is required`);
        return false;
      }
    }
    return true;
  };

  const validateMerchandiseSelection = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to purchase');
      return false;
    }
    return true;
  };

  const initiateRegistration = () => {
    if (!isAuthenticated) {
      toast.info('Please login to register');
      navigate('/login');
      return;
    }

    if (role !== 'participant') {
      toast.error('Only participants can register for events');
      return;
    }

    // For merchandise events, redirect to the dedicated merchandise order page
    // which requires payment proof upload
    if (event.eventType === 'Merchandise') {
      navigate(`/participant/merchandise-order/${id}`);
      return;
    }

    setShowRegistrationModal(true);
  };

  const handleRegister = async () => {
    // Validate based on event type
    if (event.eventType === 'Normal') {
      if (!validateNormalEventForm()) {
        return;
      }
    } else if (event.eventType === 'Merchandise') {
      if (!validateMerchandiseSelection()) {
        return;
      }
    }

    setRegistering(true);
    try {
      const payload = event.eventType === 'Normal' 
        ? { formData } 
        : { purchasedItems: selectedItems };
      
      await registerForEvent(id, payload);
      toast.success('Registration successful! Check your email for ticket details.');
      setShowRegistrationModal(false);
      navigate('/participant/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const renderFormField = (field) => {
    const commonProps = {
      name: field.name,
      placeholder: field.placeholder,
      required: field.required,
      onChange: handleFormChange,
      value: formData[field.name] || ''
    };

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.fieldType}
            {...commonProps}
            className="form-input"
          />
        );
      
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows="4"
            className="form-input"
          />
        );
      
      case 'dropdown':
        return (
          <select {...commonProps} className="form-input">
            <option value="">Select an option</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {field.options?.map((option, idx) => (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={formData[field.name] === option}
                  onChange={handleFormChange}
                  required={field.required}
                />
                {option}
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              name={field.name}
              checked={formData[field.name] || false}
              onChange={handleFormChange}
            />
            <span>{field.label}</span>
          </div>
        );
      
      case 'file':
        return (
          <input
            type="file"
            name={field.name}
            required={field.required}
            onChange={handleFormChange}
            className="form-input"
          />
        );
      
      default:
        return <input type="text" {...commonProps} className="form-input" />;
    }
  };

  if (loading) {
    return <div className="loading">Loading event details...</div>;
  }

  if (!event) {
    return <div className="container">Event not found</div>;
  }

  const isRegistrationOpen =
    event.status === 'Published' &&
    new Date() < new Date(event.registrationDeadline) &&
    event.registrationCount < event.registrationLimit;
  
  const isRegistered = event.isRegistered || false;
  const hasPendingOrder = event.hasPendingOrder || false;
  const merchandiseOrderStatus = event.merchandiseOrderStatus || null;

  return (
    <div className="event-details-page">
      <header className="page-header">
        <Link to="/events" className="back-link">← Back to Events</Link>
      </header>

      <div className="container">
        <div className="event-details-card">
          <div className="event-header">
            <div>
              <span className="event-type-badge">{event.eventType}</span>
              {isRegistered && !hasPendingOrder && (
                <span className="event-type-badge" style={{ 
                  backgroundColor: '#28a745', 
                  marginLeft: '10px' 
                }}>
                  ✓ Registered
                </span>
              )}
              {hasPendingOrder && merchandiseOrderStatus === 'Pending Approval' && (
                <span className="event-type-badge" style={{ 
                  backgroundColor: '#f39c12', 
                  marginLeft: '10px' 
                }}>
                  ⏳ Order Pending Approval
                </span>
              )}
              {hasPendingOrder && merchandiseOrderStatus === 'Approved' && (
                <span className="event-type-badge" style={{ 
                  backgroundColor: '#28a745', 
                  marginLeft: '10px' 
                }}>
                  ✓ Order Approved
                </span>
              )}
              <h1>{event.eventName}</h1>
              <p className="organizer-name">
                Organized by {event.organizer?.organizerName}
              </p>
            </div>
          </div>

          <div className="event-info-grid">
            <div className="info-section">
              <h3>Description</h3>
              <p>{event.eventDescription}</p>
            </div>

            <div className="info-section">
              <h3>Event Details</h3>
              <div className="detail-item">
                <strong>Start Date:</strong> {new Date(event.eventStartDate).toLocaleDateString()}
              </div>
              <div className="detail-item">
                <strong>End Date:</strong> {new Date(event.eventEndDate).toLocaleDateString()}
              </div>
              <div className="detail-item">
                <strong>Registration Deadline:</strong>{' '}
                {new Date(event.registrationDeadline).toLocaleDateString()}
              </div>
              <div className="detail-item">
                <strong>Eligibility:</strong> {event.eligibility}
              </div>
              <div className="detail-item">
                <strong>Registration Fee:</strong>{' '}
                {event.registrationFee ? `₹${event.registrationFee}` : 'Free'}
              </div>
              <div className="detail-item">
                <strong>Available Slots:</strong>{' '}
                {event.registrationLimit - event.registrationCount} / {event.registrationLimit}
              </div>
            </div>

            {event.eventTags && event.eventTags.length > 0 && (
              <div className="info-section">
                <h3>Tags</h3>
                <div className="tags">
                  {event.eventTags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isRegistered ? (
            <div className="registration-section" style={{ 
              backgroundColor: hasPendingOrder && merchandiseOrderStatus === 'Pending Approval' ? '#fff3cd' : '#d4edda', 
              border: `1px solid ${hasPendingOrder && merchandiseOrderStatus === 'Pending Approval' ? '#ffeaa7' : '#c3e6cb'}`, 
              color: hasPendingOrder && merchandiseOrderStatus === 'Pending Approval' ? '#856404' : '#155724',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              {hasPendingOrder && merchandiseOrderStatus === 'Pending Approval' ? (
                <>
                  <h3>⏳ Order Pending Approval</h3>
                  <p>Your merchandise order has been placed and is waiting for the organizer to verify your payment. No QR ticket will be generated until the payment is approved.</p>
                  <Link to="/participant/merchandise-orders" className="btn btn-primary">
                    View My Orders
                  </Link>
                </>
              ) : hasPendingOrder && merchandiseOrderStatus === 'Approved' ? (
                <>
                  <h3>✓ Order Approved!</h3>
                  <p>Your payment has been approved and your ticket with QR code has been generated.</p>
                  <Link to="/participant/merchandise-orders" className="btn btn-primary">
                    View My Orders & Ticket
                  </Link>
                </>
              ) : (
                <>
                  <h3>✓ You're Registered!</h3>
                  <p>You have successfully registered for this event. Check your dashboard for your ticket.</p>
                  <Link to="/participant/dashboard" className="btn btn-primary">
                    View My Tickets
                  </Link>
                </>
              )}
            </div>
          ) : isRegistrationOpen ? (
            <div className="registration-section">
              <button
                className="btn btn-primary btn-lg"
                onClick={initiateRegistration}
              >
                {event.eventType === 'Merchandise' ? 'Order Merchandise' : 'Register Now'}
              </button>
              {event.eventType === 'Merchandise' && (
                <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
                  You'll need to upload a payment proof. Your order will be reviewed by the organizer before a ticket is generated.
                </p>
              )}
            </div>
          ) : (
            <div className="registration-closed">
              <p>Registration is closed for this event</p>
            </div>
          )}
        </div>

        {/* Discussion Forum Section */}
        <div style={{
          marginTop: '30px',
          padding: '24px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #667eea', paddingBottom: '10px' }}>
            💬 Discussion Forum
          </h2>

          {/* Announcements */}
          {announcements.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#f39c12', marginBottom: '10px' }}>📢 Announcements</h4>
              {announcements.map(ann => renderMessageCard(ann))}
            </div>
          )}

          {/* Post New Message */}
          {isAuthenticated && (role === 'participant' || role === 'organizer') ? (
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #eee',
            }}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Write a message..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <div>
                  {isEventOrganizer && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isAnnouncement}
                        onChange={(e) => setIsAnnouncement(e.target.checked)}
                      />
                      📢 Post as Announcement
                    </label>
                  )}
                </div>
                <button
                  onClick={handlePostMessage}
                  disabled={postingMessage || !newMessage.trim()}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px' }}
                >
                  {postingMessage ? 'Posting...' : 'Post Message'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#666',
            }}>
              <p>{isAuthenticated ? 'Only participants and organizers can post messages.' : 'Please log in to participate in the discussion.'}</p>
            </div>
          )}

          {/* Thread View */}
          {activeThread && (
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#f0f2ff',
              borderRadius: '8px',
              border: '1px solid #c5caf5',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, color: '#667eea' }}>Thread</h4>
                <button
                  onClick={() => { setActiveThread(null); setThreadReplies([]); setReplyContent(''); }}
                  style={{
                    border: 'none',
                    background: '#667eea',
                    color: 'white',
                    borderRadius: '4px',
                    padding: '4px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  ✕ Close Thread
                </button>
              </div>

              {/* Original message */}
              {renderMessageCard(activeThread, true)}

              {/* Replies */}
              <div style={{ marginLeft: '20px', borderLeft: '2px solid #ddd', paddingLeft: '16px' }}>
                {threadReplies.length > 0 ? (
                  threadReplies.map(reply => renderMessageCard(reply, true))
                ) : (
                  <p style={{ color: '#888', fontSize: '14px' }}>No replies yet.</p>
                )}
              </div>

              {/* Reply input */}
              {isAuthenticated && (role === 'participant' || role === 'organizer') && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    onKeyDown={(e) => e.key === 'Enter' && handlePostReply()}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                    }}
                  />
                  <button
                    onClick={handlePostReply}
                    disabled={postingMessage || !replyContent.trim()}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px' }}
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Messages List */}
          {forumLoading ? (
            <p style={{ textAlign: 'center', color: '#888' }}>Loading messages...</p>
          ) : forumMessages.length > 0 ? (
            <>
              {forumMessages.filter(m => !m.isAnnouncement).map(msg => renderMessageCard(msg))}

              {/* Pagination */}
              {forumPagination && forumPagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                  {Array.from({ length: forumPagination.pages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => fetchForumMessages(i + 1)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: forumPage === i + 1 ? '2px solid #667eea' : '1px solid #ddd',
                        background: forumPage === i + 1 ? '#667eea' : 'white',
                        color: forumPage === i + 1 ? 'white' : '#333',
                        cursor: 'pointer',
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
              No messages yet. Be the first to start a discussion!
            </p>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="modal-overlay" onClick={() => setShowRegistrationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {event.eventType === 'Normal' ? 'Complete Registration' : 'Select Items to Purchase'}
              </h2>
              <button className="modal-close" onClick={() => setShowRegistrationModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {/* Normal Event - Custom Form */}
              {event.eventType === 'Normal' && (
                <div className="registration-form">
                  {event.customForm && event.customForm.length > 0 ? (
                    <>
                      <p style={{ marginBottom: '20px', color: '#666' }}>
                        Please fill out the registration form below:
                      </p>
                      {event.customForm.map((field, index) => (
                        <div key={index} className="form-group">
                          <label>
                            {field.label}
                            {field.required && <span style={{ color: 'red' }}> *</span>}
                          </label>
                          {renderFormField(field)}
                        </div>
                      ))}
                    </>
                  ) : (
                    <p>No additional information required. Click Register to complete your registration.</p>
                  )}
                </div>
              )}

              {/* Merchandise Event - Item Selection */}
              {event.eventType === 'Merchandise' && (
                <div className="merchandise-selection">
                  {event.items && event.items.length > 0 ? (
                    <>
                      <p style={{ marginBottom: '20px', color: '#666' }}>
                        Select items and quantities you wish to purchase:
                      </p>
                      <div className="items-grid">
                        {event.items.map((item, index) => {
                          const itemKey = `${item.size}-${item.color}-${item.variant}`;
                          const currentQuantity = itemQuantities[itemKey] || 0;
                          
                          return (
                            <div key={index} className="item-card">
                              <div className="item-details">
                                <h4>{item.variant}</h4>
                                {item.size && <p><strong>Size:</strong> {item.size}</p>}
                                {item.color && <p><strong>Color:</strong> {item.color}</p>}
                                <p><strong>Stock:</strong> {item.stock} available</p>
                                <p><strong>Max per person:</strong> {item.purchaseLimit}</p>
                              </div>
                              <div className="item-quantity">
                                <label>Quantity:</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={Math.min(item.stock, item.purchaseLimit)}
                                  value={currentQuantity}
                                  onChange={(e) => handleItemSelection(item, e.target.value)}
                                  className="quantity-input"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {selectedItems.length > 0 && (
                        <div className="selected-items-summary">
                          <h4>Selected Items:</h4>
                          <ul>
                            {selectedItems.map((item, idx) => (
                              <li key={idx}>
                                {item.variant} ({item.size && `${item.size}, `}{item.color}) - Qty: {item.quantity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p>No items available for this merchandise event.</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowRegistrationModal(false)}
                disabled={registering}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRegister}
                disabled={registering}
              >
                {registering ? 'Processing...' : 'Complete Registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
