import './App.css';
import logo from './logo.svg';
import React, { useState } from 'react';

function App() {
  const [inputs, setInputs] = useState({
    key: '',
    secret: '',
    dataAcctID: '',
    distID: ''
  });

  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true); // Start loading
    fetch('https://yf6zmmg1j0.execute-api.us-west-1.amazonaws.com/Prod', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputs),
    })
        .then(response => response.json())
        .then(data => {
          setResult(JSON.stringify(data));
        })
        .catch((error) => {
          console.error('Error:', error);
          setResult(error.message);
        })
        .finally(() => {
          setLoading(false);
        });
  };

  return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo"/>
          <form onSubmit={handleSubmit}>
            <input
                type="text"
                name="dataAcctID"
                value={inputs.dataAcctID}
                onChange={handleChange}
                placeholder="Data Account ID"
            />
            <input
                type="text"
                name="distID"
                value={inputs.distID}
                onChange={handleChange}
                placeholder="Distributor ID"
            />
            <input
                type="text"
                name="key"
                value={inputs.key}
                onChange={handleChange}
                placeholder="Key"
            />
            <input
                type="text"
                name="secret"
                value={inputs.secret}
                onChange={handleChange}
                placeholder="Secret"
            />
            <button type="submit">Submit</button>
          </form>
          {loading ? <div className="spinner"></div> : <div>{result}</div>}
        </header>
      </div>
  );
}

export default App;
