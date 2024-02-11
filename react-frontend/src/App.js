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
          <form className="w-full max-w-sm" onSubmit={handleSubmit}>
            <div className="md:flex md:items-center mb-6">
              <div className="md:w-1/3">
                <label className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4"
                       htmlFor="inline-dataAcctID">
                  Data Account ID
                </label>
              </div>
              <div className="md:w-2/3">
                <input
                    className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
                    name="dataAcctID" id="inline-dataAcctID" type="text" value={inputs.dataAcctID} onChange={handleChange}/>
              </div>
            </div>
            <div className="md:flex md:items-center mb-6">
              <div className="md:w-1/3">
                <label className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4"
                       htmlFor="inline-distrID">
                  Distributor ID
                </label>
              </div>
              <div className="md:w-2/3">
                <input
                    className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
                    name="distID" id="inline-distrID" type="text" onChange={handleChange} value={inputs.distID}/>
              </div>
            </div>
            <div className="md:flex md:items-center mb-6">
              <div className="md:w-1/3">
                <label className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4"
                       htmlFor="inline-key">
                  Key ID
                </label>
              </div>
              <div className="md:w-2/3">
                <input
                    className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
                    name="key" id="inline-key" type="text" value={inputs.key} onChange={handleChange}/>
              </div>
            </div>
            <div className="md:flex md:items-center mb-6">
              <div className="md:w-1/3">
                <label className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4"
                       htmlFor="inline-secret">
                  Key Secret
                </label>
              </div>
              <div className="md:w-2/3">
                <input
                    className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
                    name="secret" id="inline-secret" type="text" value={inputs.secret} onChange={handleChange}/>
              </div>
            </div>
            <div className="md:flex md:items-center">
              <div className="md:w-1/3"></div>
              <div className="md:w-2/3">
                <button
                    className="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
                    type="submit">
                  Submit
                </button>
              </div>
            </div>
          </form>
          {loading ? <div className="spinner"></div> : <div>{result}</div>}
        </header>
      </div>
  );
}

export default App;
