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
      }
    };
    initialize();
  }, []);

  const refreshPatients = async () => {
    try {
      const db = getDB();
      const result = await db.query('SELECT * FROM patients ORDER BY created_at DESC LIMIT 10');
      setPatients(result.rows);
    } catch (err) {
      setError(`Failed to load patients: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dbReady) return;

    try {
      await transaction(async (db) => {
        await db.query(
          `INSERT INTO patients 
          (id, first_name, last_name, date_of_birth, gender, email, phone, address)
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
      setError(null);
    } catch (err) {
      setError(`Patient registration failed: ${err.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (error) setError(null);
  };

  const executeQuery = async () => {
    try {
      const db = getDB();
      const result = await db.query(query);
      setQueryResult(result.rows);
      setError(null);
    } catch (err) {
      setQueryResult(null);
      setError(`Query failed: ${err.message}`);
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit}>
      <h2>Register New Patient</h2>
      {[
        { label: 'First Name', name: 'firstName', type: 'text', required: true },
        { label: 'Last Name', name: 'lastName', type: 'text', required: true },
        { label: 'Date of Birth', name: 'dateOfBirth', type: 'date', required: true },
        { label: 'Email', name: 'email', type: 'email' },
        { label: 'Phone', name: 'phone', type: 'tel' }
      ].map(field => (
        <div className="form-group" key={field.name}>
          <label>{field.label}</label>
          <input
            {...field}
            value={formData[field.name]}
            onChange={handleInputChange}
          />
        </div>
      ))}

      <div className="form-group">
        <label>Gender</label>
        <select name="gender" value={formData.gender} onChange={handleInputChange}>
          <option value="">Select</option>
          {['Male', 'Female', 'Other', 'Prefer not to say'].map(gender => (
            <option key={gender} value={gender}>{gender}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Address</label>
        <textarea name="address" value={formData.address} onChange={handleInputChange} />
      </div>

      <button type="submit" disabled={!dbReady}>
        {dbReady ? 'Register Patient' : 'Initializing Database...'}
      </button>
    </form>
  );

  const renderPatientsTable = () => (
    <div>
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
  );

  const renderQueryInterface = () => (
    <div>
      <h2>SQL Query Interface</h2>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rows={5}
        placeholder="Enter SQL query here..."
      />
      <button onClick={executeQuery}>Execute</button>

      {queryResult && (
        <div className="query-results">
          <h3>Results ({queryResult.length} rows)</h3>
          <pre>{JSON.stringify(queryResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );

  return (
    <div className="app">
      <h1>Patient Registration System</h1>
      {error && <div className="error">{error}</div>}

      <div className="tabs">
        {['register', 'view', 'query'].map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'register' && 'Register Patient'}
            {tab === 'view' && 'View Patients'}
            {tab === 'query' && 'SQL Query'}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'register' && renderForm()}
        {activeTab === 'view' && renderPatientsTable()}
        {activeTab === 'query' && renderQueryInterface()}
      </div>
    </div>
  );
}

export default App;
