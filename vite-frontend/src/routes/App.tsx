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
    merchantID: '',
  });

  const [result, setResult] = useState<Array<any>>([])
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [_error, setError] = useState(Error);
  const [currentStep, setStep] = useState(0);
  const [selectedDistributors, setSelectedDistributors] = useState(new Set());


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prevState => ({
      ...prevState,
      [name]: value
    }));
  };


  // handleDistributorChange and distributorButtons dynamically show what distributors 
  // the user has chosen
  // TODO: integrate with functionality
  const handleDistributorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStep(2);
    const distID = e.target.name;
    setSelectedDistributors(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(distID)) {
        newSelected.delete(distID);
      } else {
        newSelected.add(distID);
      }
      return newSelected;
    });
  };

  const distributorButtons = Array.from(selectedDistributors).map((distID:any) => (
    <button key={distID} className="border bg-lightGray-200 rounded px-4 py-1 text-sm font-semibold cursor-pointer focus:outline-none">
      {distID}
    </button>
  ));


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
                //console.log(json.data);
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

      // handled with -handleDistributorChange-, TODO: integrate it with the step logic 
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

  /*

  let distributorCheckboxes = result.map(function(item) {
     return (
        <div className='bg-emerald-900 mb-4'>
          <input type="checkbox" id={item?.sk + item?.distID} name={item?.distID} data-sk={item?.sk} data-distID={item?.distID}/>
          <label htmlFor={item?.sk + item?.distID}> {item?.distID}</label>
        </div>
      );
  });
  {currentStep == 1 ? distributorCheckboxes : null}
            {currentStep == 2 ?
              <div className='grid grid-cols-2 items-start my-4'>
                <span className='bg-lightGray-300 mx-4 w-auto p-1 rounded font-bold'>Merchant ID: {inputs.merchantID}</span>
                <span className='bg-lightGray-200 mx-4 w-auto p-1 rounded'>Distributors: {inputs.distIDs.toString()}</span>
              </div> : null}
          {currentStep == 2 ? Textbox({
                name: "key",
                id: "inline-key",
                value: inputs.key, disabled: false, label: "Key", handleChange}) : null}
          {currentStep == 2 ? Textbox({
            name: "secret",
            id: "inline-secret",
            value: inputs.secret, disabled: false, label: "Secret", handleChange}) : null}
        
  */
  const ClientComponent = (props: { accountId: string, sk: string, distributors: any}) => {
    return (
      <div className="p-4 rounded-sm flex flex-col">
          <div className="bg-red text-white p-4 rounded-tl rounded-tr  font-semibold text-left">
              <h2>Client: {props.accountId}</h2>
          </div>
          <div className="bg-white border-2 border-slate-400">
              <div className="text-left bg-gray-400 m-5 rounded-lg flex  text-sm justify-center font-semibold gitw-2/5">
                  Sort Key: {props.distributors[0].sk}
              </div>
              <div className="ml-5">
                  {props.distributors.map((item: any) => (
                    <div className="flex space-x-4 items-center ">
                      <input 
                      type="checkbox" 
                      id={item?.sk + item?.distID} 
                      name={item?.distID} 
                      data-sk={item?.sk} 
                      data-distID={item?.distID}
                      onChange={handleDistributorChange}
                      checked={selectedDistributors.has(item?.distID)}
                    />
                    <div className='bg-lightGray-200 mb-4 rounded-lg w-2/4 font-semibold cursor-pointer' key={item?.sk + item?.distID}>
                          <label htmlFor={item?.sk + item?.distID}>Distributor  {item?.distID}</label>
                    </div>
                    </div>
                  ))}
              </div>
          </div>
      </div>
    );
  };
  
    return (
      <div className=' bg-white grid grid-cols-7'>
        <Sidebar/>
        {/*  left side  */}
        <div className='col-span-3'>
          {/* menu title */}
          <h1 className='text-2xl text-left font-bold text-black mb-4 mt-4 ml-4'>Payment Configuration Update</h1>
          <form className="w-full" onSubmit={handleSubmit} id="submit">
              <div className='flex flex-row space-x-1 bg-white items-center px-4 py-2'>
              {Textbox({
                name: "dataAcctID",
                id: "inline-dataAcctID",
                value: inputs.dataAcctID, disabled: currentStep != 0, label: "Data Account ID", handleChange
              })}
              <button
                  className="shadow bg-red focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
                  type="submit">
                Find
              </button>
            </div>
          </form>

          {/* show client component when input is filled */}
          {currentStep == 1 || currentStep == 2? <ClientComponent accountId={inputs.dataAcctID} sk={inputs.sk} distributors={result}/> : null}
        
          {/* Loading indicator / API message */}
          {loading ? <div className="spinner"></div> : <div>{resultMessage}</div>}
          
        </div>

        {/*  right side, step 2 */}
        <div className="col-span-3">
          {currentStep == 2 ?     
            <div className='flex justify-center flex-grow bg-w'>
            <div className="mb-4 mt-20">
              <h1 className="text-xl font-semibold mb-3">Payment Key Validation</h1>
              <div className="flex space-x-4 mb-6">
              {distributorButtons.length > 0 ? distributorButtons : (
                <span></span>
              )}
              </div>
              <div className="mb-4">
                {Textbox({
                  name: "keyId",
                  id: "inline-dataAcctID",
                  value: "", disabled: false, label: "Key ID", handleChange
                })}
              </div>
              <div className="mb-6">
                {Textbox({
                  name: "keyId",
                  id: "inline-dataAcctID",
                  value: "", disabled: false, label: "Key Secret", handleChange
                })}
              </div>
              <div className="flex items-center justify-between">
                <button className="bg-red text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
                  Validate
                </button>
              </div>
            </div>
            
          </div> : null}
        </div>
   
      </div>
  )
}
