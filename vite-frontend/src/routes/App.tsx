import { useState } from 'react'
import { Link } from 'react-router-dom';
import './App.css'
import TestPage from './TestPage';

function App() {
  const [inputs, setInputs] = useState({
    key: '',
    secret: '',
    dataAcctID: '',
    distID: ''
  });

  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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

  const handleDistributer = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true); // Start loading
  
    const url = new URL('https://yf6zmmg1j0.execute-api.us-west-1.amazonaws.com/Prod/getDistributors');
    url.searchParams.set('dataAcctID', inputs.dataAcctID);
  
    fetch(url, {
      method: 'GET', // Assuming this is a GET request
    })
      .then(response => response.json())
      .then(data => {
        // setResult(JSON.stringify(data));
        const distIDs = data.data?.map((distributor: { distID: any; }) => distributor.distID) ?? [];
        const formattedDistIDs = distIDs.join(' ');
        setResult(formattedDistIDs);
      })
      .catch((error) => {
        console.error('Error:', error);
        // Handle error and display user-friendly message
        setResult('An error occurred. Please try again later.');
      })
      .finally(() => {
        setLoading(false);
      });
  };
  

  function newTextBox(props: {name: string, id: string, value: string, label: string}): JSX.Element {
    return (
      <div className="md:flex md:items-center mb-6">
        <div className="md:w-1/3">
          <label className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4"
                htmlFor={props.id}>
            {props.label}
          </label>
        </div>
        <div className="md:w-2/3">
          <input
              className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
              name={props.name} id={props.id} type="text" value={props.value} onChange={handleChange}/>
        </div>
      </div>
    )
  }

  return (
    <>
      <h1>Vite + React</h1>
      <nav>
        <Link to="/testpage">Test Page</Link>
      </nav>
      <form className="w-full max-w-sm" onSubmit={handleSubmit}>
            {newTextBox({ name: "dataAcctID", id: "inline-dataAcctID", value: inputs.dataAcctID, label: "Data Account ID" })}
            {newTextBox({ name: "distID", id: "inline-distID", value: inputs.distID, label: "Distributor ID" })}
            {newTextBox({ name: "key", id: "inline-key", value: inputs.key, label: "Key ID" })}
            {newTextBox({ name: "secret", id: "inline-secret", value: inputs.secret, label: "Key Secret" })}
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

      <button onClick={handleDistributer}>Fetch Distributors</button>


    </>
  )
}

export default App
