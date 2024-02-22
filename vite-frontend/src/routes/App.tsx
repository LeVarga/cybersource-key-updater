import { useState } from 'react'
import Textbox from '../components/Textbox';
import Sidebar from '../components/sidebar/Sidebar';
import './App.css'

export default function App({ dataAcctID, merchantId, distID }: { dataAcctID: string, merchantId: string, distID: string }) {
  const [inputs, setInputs] = useState({
    key: '',
    secret: '',
    dataAcctID: dataAcctID,
    distID: distID
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


  return (
    <div className='bg-white grid grid-cols-2'>
      <Sidebar />
      <div className='w-full'>
        <h1 className='text-left mx-4 pt-4 pb-2'>Payment Key Validation</h1>
        {/* area containing current ids */}
        <div className='grid grid-cols-2 items-start my-4'>
          <span className='bg-lightGray-300 mx-4 w-auto p-1 rounded font-bold'>Merchant ID: {merchantId}</span>
          <span className='bg-lightGray-200 mx-4 w-auto p-1 rounded'>Distributor {distID }</span>
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
      <button onClick={handleDistributer}>Handle Distributor</button>
      </div>

    </div>
  )
}
