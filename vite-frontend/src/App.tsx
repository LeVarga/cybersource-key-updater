import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

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

  function newTextBox(props: { name: string, id: string, value: string, label: string }): JSX.Element {
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
            name={props.name} id={props.id} type="text" value={props.value} onChange={handleChange} />
        </div>
      </div>
    )
  }

  return (
    <div className='bg-white'>
      <h1>Payment Key Validation</h1>
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
    </div>
  )
}

export default App
