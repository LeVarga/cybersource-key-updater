import { useState } from 'react'
import Textbox from './components/textbox';
import Sidebar from './components/sidebar/sidebar';
import './App.css'

function App({ merchantId, distributorId }: { merchantId: string, distributorId: string }) {
  const [inputs, setInputs] = useState({
    key: '',
    secret: '',
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

  return (
    <div className='bg-white grid grid-cols-2'>
      <Sidebar />
      <div>
        <h1>Payment Key Validation</h1>
        <p>{merchantId}</p>
        <p>{distributorId}</p>
        <form className="w-full max-w-sm" onSubmit={handleSubmit}>
          <Textbox name='key' id="inline-key" value={inputs.key} label='Key ID' handleChange={handleChange} />
          <Textbox name='secret' id="inline-secret" value={inputs.secret} label='Key Secret' handleChange={handleChange} />
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
    </div>
  )
}

export default App
