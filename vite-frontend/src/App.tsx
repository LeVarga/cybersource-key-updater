import { useState } from 'react'
import Textbox from './components/Textbox';
import Sidebar from './components/sidebar/Sidebar';
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
      <div className='w-full'>
        <h1 className='text-left mx-4 pt-4 pb-2'>Payment Key Validation</h1>
        {/* area containing current ids */}
        <div className='grid grid-cols-2 items-start my-4'>
          <span className='bg-lightGray-300 mx-4 w-auto p-1 rounded font-bold'>Merchant ID: 000_A1{merchantId}</span>
          <span className='bg-lightGray-200 mx-4 w-auto p-1 rounded'>Distributor B{distributorId}</span>
        </div>
        {/* textbox form */}
        <form className="w-full" onSubmit={handleSubmit}>
          <Textbox name='key' id="inline-key" value={inputs.key} label='Key ID' handleChange={handleChange} />
          <Textbox name='secret' id="inline-secret" value={inputs.secret} label='Key Secret' handleChange={handleChange} />
          <button
            className="shadow bg-red focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded float-right"
            type="submit">
            Validate
          </button>
        </form>
        {loading ? <div className="spinner"></div> : <div>{result}</div>}
      </div>
    </div>
  )
}

export default App
