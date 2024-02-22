import { useState } from 'react'
import Textbox from '../components/Textbox';
import Sidebar from "../components/sidebar/Sidebar";
import './App.css'

export default function App() {

  const [inputs, setInputs] = useState({
    key: '',
    secret: '',
    dataAcctID: '',
    sk: '',
    distIDs: '',
  });

  const [result, setResult] = useState<Array<any>>([])
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [_error, setError] = useState(Error);
  const [currentStep, setStep] = useState(0);

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

    if (currentStep == 0) { // step 0 is submitting the client ID
      const url = new URL('https://yf6zmmg1j0.execute-api.us-west-1.amazonaws.com/Prod/getDistributors');
      url.searchParams.set('dataAcctID', inputs.dataAcctID);
      fetch(url, {
        method: 'GET',
      })
          .then((response) => {
            response.json().then((json) => {
              if (!json?.error) {
                setStep(1);
                setResult(json.data);
                setResultMessage("");
              }
              else {
                setResultMessage(json.message);
                setError(json.error);
              }
            })
          })
          .catch((error) => {
            console.error('Error:', error);
            // Handle error and display user-friendly message
            setError(error);
            setResultMessage('An error occurred. Please try again later.');
          })
          .finally(() => {
            setLoading(false);
          });
    } else if (currentStep == 1) { // step 1 is selecting the distributor ID(s) to update
      // TODO: set the values from the selected checkboxes here
      setStep(2);
      setLoading(false);

    } else if (currentStep == 2) { // step 2 is getting the key/secret and submitting the update
      fetch('https://yf6zmmg1j0.execute-api.us-west-1.amazonaws.com/Prod/updateSecret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputs),
      })
          .then((response) => { // TODO: refactor this into a named function (it's mostly the same as step 0)
            response.json().then((json) => {
              if (!json?.error) {
                setStep(1);
                setResult(json.data);
                setResultMessage("");
              }
              else {
                setResultMessage(json.message);
                setError(json.error);
              }
            })
          })
          .catch((error) => {
            console.error('Error:', error);
            // Handle error and display user-friendly message
            setError(error);
            setResultMessage('An error occurred. Please try again later.');
          })
          .finally(() => {
            setLoading(false);
          });
    }
  };


  let distributorCheckboxes = result.map(function(item) {
     return (<div><input type="checkbox" id={item?.sk + item?.distID} name={item?.distID} data-sk={item?.sk} data-distID={item?.distID}/>
      <label htmlFor={item?.sk + item?.distID}> {item?.distID}</label>
      </div>);
  });

    return (
      <div className='bg-white grid grid-cols-2'>
        <Sidebar/>
        <div className='w-full'>
          <h1 className='text-left mx-4 pt-4 pb-2'>Payment Key Validation</h1>
          {Textbox({name: "dataAcctID", id: "inline-dataAcctID", value: inputs.dataAcctID, disabled: currentStep != 0, label: "Data Account ID", handleChange})}
          {currentStep == 2 ? Textbox({name: "key", id: "inline-key", value: inputs.dataAcctID, disabled: false, label: "Key", handleChange}) : null}
          {currentStep == 2 ? Textbox({name: "secret", id: "inline-secret", value: inputs.dataAcctID, disabled: false, label: "Secret", handleChange}) : null}
          <form className="w-full" onSubmit={handleSubmit} id="submit">
            {currentStep == 1 ? distributorCheckboxes : null}
            <button
                className="shadow bg-red focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded float-right"
                type="submit">
              Validate
            </button>
          </form>
          {loading ? <div className="spinner"></div> : <div>{resultMessage}</div>}
        </div>

      </div>
  )
}
