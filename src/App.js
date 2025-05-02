import React, { useState, useEffect } from 'react';
import { initDB, getDB, transaction } from './db';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

function App() {
  const [dbReady, setDbReady] = useState(false);
  const [patients, setPatients] = useState([]);
  const [queryResult, setQueryResult] = useState(null);
  const [activeTab, setActiveTab] = useState('register');
  const [query, setQuery] = useState('SELECT * FROM patients LIMIT 10');
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();
        setDbReady(true);
        await refreshPatients();
      } catch (err) {
        setError(`Database initialization failed: ${err.message}`);
        console.error(err);
      }
    };
    initialize();
  }, []);

  const refreshPatients = async () => {
    try {
      const db = getDB();
      const result = await db.query(
        'SELECT * FROM patients ORDER BY created_at DESC LIMIT 10'
      );
      setPatients(result.rows);
      setError(null);
    } catch (err) {
      setError(`Failed to load patients: ${err.message}`);
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dbReady) return;

    try {
      await transaction(async (db) => {
        await db.query(
          `INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, email, phone, address)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            uuidv4(),
            formData.firstName,
            formData.lastName,
            formData.dateOfBirth,
            formData.gender,
            formData.email,
            formData.phone,
            formData.address
          ]
        );
      });

      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        email: '',
        phone: '',
        address: ''
      });

      await refreshPatients();
    } catch (err) {
      setError(`Patient registration failed: ${err.message}`);
      console.error(err);
    }
  };

  const executeQuery = async () => {
    try {
      const db = getDB();
      const result = await db.query(query);
      setQueryResult(result.rows);
      setError(null);
    } catch (err) {
      setError(`Query failed: ${err.message}`);
      setQueryResult(null);
      console.error(err);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle different input types appropriately
    const inputValue = type === 'checkbox' ? checked : value;
  
    setFormData(prev => ({
      ...prev,
      [name]: inputValue
    }));
  
    // Clear any existing errors when user starts typing
    if (error) {
      setError(null);
    }
  };

  return (
    <div className="app">
      <h1>Patient Registration System</h1>
      {error && <div className="error">{error}</div>}

      
      <div className="tabs">
        <button 
          className={activeTab === 'register' ? 'active' : ''}
          onClick={() => setActiveTab('register')}
        >
          Register Patient
        </button>
        <button 
          className={activeTab === 'view' ? 'active' : ''}
          onClick={() => setActiveTab('view')}
        >
          View Patients
        </button>
        <button 
          className={activeTab === 'query' ? 'active' : ''}
          onClick={() => setActiveTab('query')}
        >
          SQL Query
        </button>
      </div>

      {activeTab === 'register' && (
        <div className="tab-content">
          <h2>Register New Patient</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>First Name:</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Last Name:</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Date of Birth:</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Gender:</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label>Phone:</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label>Address:</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
            
            <button type="submit" disabled={!dbReady}>
              {dbReady ? 'Register Patient' : 'Initializing Database...'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'view' && (
        <div className="tab-content">
          <h2>Recent Patients</h2>
          <button onClick={refreshPatients}>Refresh List</button>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Date of Birth</th>
                <th>Gender</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(patient => (
                <tr key={patient.id}>
                  <td>{patient.id.substring(0, 8)}...</td>
                  <td>{patient.first_name} {patient.last_name}</td>
                  <td>{new Date(patient.date_of_birth).toLocaleDateString()}</td>
                  <td>{patient.gender || '-'}</td>
                  <td>
                    {patient.email && <div>Email: {patient.email}</div>}
                    {patient.phone && <div>Phone: {patient.phone}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'query' && (
        <div className="tab-content">
          <h2>SQL Query Interface</h2>
          <div className="query-container">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={5}
            />
            <button onClick={executeQuery}>Execute</button>
          </div>
          
          {queryResult && (
            <div className="query-results">
              <h3>Results ({queryResult.length} rows)</h3>
              <pre>{JSON.stringify(queryResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
