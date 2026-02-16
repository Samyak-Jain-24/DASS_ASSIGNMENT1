import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyRegistrations } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './Dashboard.css';

const ParticipantDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [registrations, setRegistrations] = useState({
    upcoming: [],
    completed: [],
    cancelled: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await getMyRegistrations();
      setRegistrations(response.data);
    } catch (error) {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const viewTicket = (registration) => {
    setSelectedTicket(registration);
    setShowTicketModal(true);
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1>Felicity</h1>
          <div className="nav-links">
            <Link to="/participant/dashboard">Dashboard</Link>
            <Link to="/events">Browse Events</Link>
            <Link to="/participant/merchandise-orders">My Orders</Link>
            <Link to="/clubs">Clubs</Link>
            <Link to="/participant/profile">Profile</Link>
            <button onClick={handleLogout} className="btn btn-danger btn-sm">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="dashboard-header">
          <h2>Welcome, {user?.firstName}!</h2>
          <p>Manage your event registrations and participation history</p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>{registrations.upcoming.length}</h3>
            <p>Upcoming Events</p>
          </div>
          <div className="stat-card">
            <h3>{registrations.completed.length}</h3>
            <p>Completed Events</p>
          </div>
          <div className="stat-card">
            <h3>{registrations.cancelled.length}</h3>
            <p>Cancelled/Rejected</p>
          </div>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Events
          </button>
          <button
            className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
          <button
            className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled/Rejected
          </button>
        </div>

        <div className="registrations-list">
          {registrations[activeTab].length === 0 ? (
            <div className="no-data">
              <p>No {activeTab} events</p>
              {activeTab === 'upcoming' && (
                <Link to="/events" className="btn btn-primary">
                  Browse Events
                </Link>
              )}
            </div>
          ) : (
            registrations[activeTab].map((registration) => (
              <div key={registration._id} className="registration-card">
                <div className="registration-info">
                  <h3>{registration.event?.eventName}</h3>
                  <p>
                    Organized by {registration.event?.organizer?.organizerName}
                  </p>
                  <p>
                    <strong>Date:</strong>{' '}
                    {new Date(registration.event?.eventStartDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Type:</strong> {registration.registrationType}
                  </p>
                  <p>
                    <strong>Ticket ID:</strong> {registration.ticketId}
                  </p>
                  {registration.registrationType === 'Merchandise' && registration.purchasedItems && (
                    <div style={{ marginTop: '10px' }}>
                      <strong>Purchased Items:</strong>
                      <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                        {registration.purchasedItems.map((item, idx) => (
                          <li key={idx}>
                            {item.variant} {item.size && `(${item.size})`} {item.color && `- ${item.color}`} - Qty: {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={`status-badge status-${registration.status.toLowerCase()}`}>
                      {registration.status}
                    </span>
                  </p>
                </div>
                <div className="registration-actions">
                  <button
                    onClick={() => viewTicket(registration)}
                    className="btn btn-primary btn-sm"
                  >
                    View Ticket
                  </button>
                  <Link
                    to={`/events/${registration.event?._id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    View Event
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && selectedTicket && (
        <div className="modal-overlay" onClick={() => setShowTicketModal(false)}>
          <div className="modal-content ticket-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Event Ticket</h2>
              <button className="modal-close" onClick={() => setShowTicketModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="ticket-display">
                <div className="ticket-info">
                  <h3>{selectedTicket.event?.eventName}</h3>
                  <p><strong>Organizer:</strong> {selectedTicket.event?.organizer?.organizerName}</p>
                  <p><strong>Event Date:</strong> {new Date(selectedTicket.event?.eventStartDate).toLocaleString()}</p>
                  <p><strong>Ticket ID:</strong> {selectedTicket.ticketId}</p>
                  <p><strong>Registration Date:</strong> {new Date(selectedTicket.registrationDate).toLocaleString()}</p>
                  {selectedTicket.paymentAmount > 0 && (
                    <p><strong>Amount Paid:</strong> ₹{selectedTicket.paymentAmount}</p>
                  )}
                  
                  {selectedTicket.registrationType === 'Merchandise' && selectedTicket.purchasedItems && (
                    <div className="purchased-items">
                      <strong>Purchased Items:</strong>
                      <ul>
                        {selectedTicket.purchasedItems.map((item, idx) => (
                          <li key={idx}>
                            {item.variant} {item.size && `(${item.size})`} {item.color && `- ${item.color}`} - Qty: {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="ticket-qr">
                  <h4>Show this QR Code at the event</h4>
                  {selectedTicket.qrCode ? (
                    <img src={selectedTicket.qrCode} alt="Ticket QR Code" className="qr-code-image" />
                  ) : (
                    <p>QR Code not available</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowTicketModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantDashboard;
