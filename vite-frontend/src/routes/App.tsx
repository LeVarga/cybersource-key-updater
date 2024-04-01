import { useState } from 'react'
import Textbox from '../components/Textbox';
import Sidebar from "../components/sidebar/Sidebar";
import './App.css'
import Label from "../components/Label.tsx";

export default function App() {

  const [inputs, setInputs] = useState({
    dataAcctID: '',
    sk: '',
    distID: Array<String>(),
  });

  const [distributorsFound, setDistributorsFound] = useState<Array<any>>([]);
  const [accountObject, setAccount] = useState<Object>({});
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [_error, setError] = useState(Error);
  const [currentStep, setStep] = useState(0);


  // handles client id changes
  const handleCidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prevState => ({
      ...prevState,
      [name]: value
    }));
  };


  // handles changes to the configuration fields
  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name
    setAccount(prevState => {
      let copy = JSON.parse(JSON.stringify(prevState))
      name.split('.')
          .reduce((o, p, i) =>
              o[p] = name.split('.').length === ++i ?
                  (e.target.type == "checkbox" ? e.target.checked : e.target.value) : o[p] || {}, copy)
      return copy;
    });
  };


  // handleDistributorChange and distributorButtons dynamically show what distributors 
  // the user has chosen
  const handleSelectedAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const distID = e.target.name;
    inputs.sk = e.target.parentElement?.parentElement?.parentElement?.id || "UNDEFINED";
    const newSelected = new Set(inputs.distID);
    if (newSelected.has(distID)) {
      newSelected.delete(distID);
    } else {
      newSelected.add(distID);
    }
    setInputs(prevState => ({
      ...prevState,
      distID: Array.from(newSelected),
    }));
    if (newSelected.size === 0) {
      setStep(1);
      return;
    }
    const url = new URL('https://yf6zmmg1j0.execute-api.us-west-1.amazonaws.com/Prod/retrieveAccount');
    url.searchParams.set('dataAcctID', inputs.dataAcctID);
    url.searchParams.set('sk', inputs.sk);
    fetch(url, {
      method: 'GET',
    })
        .then((response) => {
          response.json().then((json) => {
            if (!json?.error) {
              setAccount(json.data);
              setResultMessage("");
              setStep(2);
            }
            else {
              setResultMessage(json.message);
              setError(json.error);
            }
            console.log(json.data);
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
  };


  const distributorButtons = inputs.distID.map((distID:any) => (
    <button key={distID} className="border bg-lightGray-200 rounded px-4 py-1 text-sm font-semibold cursor-pointer focus:outline-none">
      {distID}
    </button>
  ));


  // TODO: cleanup
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
                setDistributorsFound(json.data);
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
    } else if (currentStep == 2) { // step 2 is getting the key/secret and submitting the update
      console.log(JSON.stringify(accountObject));
      fetch('https://yf6zmmg1j0.execute-api.us-west-1.amazonaws.com/Prod/saveAccount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({accountData: accountObject}),
      })
          .then((response) => { // TODO: refactor this into a named function (it's mostly the same as step 0)
            response.json().then((json) => {
              if (!json?.error) {
                //setStep(1);
                setResultMessage(json.message);
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

  // TODO: make entire client selectable
  const ClientComponent = (props: { accountId: string, sk: string, distributors: any}) => {
    return (
      <div className="p-4 rounded-sm flex flex-col">
          <div className="bg-red text-white p-4 rounded-tl rounded-tr  font-semibold text-left">
              <h2>Client: {props.accountId}</h2>
          </div>
          <div className="bg-white border-2 border-slate-400">
            <div id={props.distributors[0].sk}>
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
                          onChange={handleSelectedAccountChange}
                          checked={inputs.distID.includes(item?.distID)}
                      />
                      <div className='bg-lightGray-200 mb-4 rounded-lg w-2/4 font-semibold cursor-pointer'
                           key={item?.sk + item?.distID}>
                        <label htmlFor={item?.sk + item?.distID}>Distributor {item?.distID}</label>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
      </div>
    );
  };

  const paymentConfigFields = (account: Object, path = "") => {
    return Array.from(Object.keys(account)).map(key => {
      if (["dataAccountId", "sk", "lastUpdated"].includes(key)) return null;
      const value = account[key as keyof typeof account];
      const pathKey = (path === "") ? key : (path + "." + key);
      // TODO: design
      switch (typeof value) {
        case "string":
          return Textbox({
            name: pathKey,
            id:pathKey,
            value: value, disabled: false, label: key,
            handleChange: handleConfigChange
          })
        case "boolean":
          return (
              <div className="mb-4 ml-4 flex-grow mr-4">
                <input
                    type="checkbox"
                    name={pathKey}
                    id={pathKey}
                    onChange={handleConfigChange}
                    checked={value}
                />
                <label htmlFor={pathKey}>{key}</label>
              </div>
          )
        case "object":
          if (Array.isArray(value)) {
            // TODO: array type handling
            return null;
          } else {
            return (
                <div>
                  {Label({for: key, text: key + ":"})}
                  {paymentConfigFields(value, pathKey).map(subcomp => subcomp)}
                </div>
            )
          }
        default:
          return null;
      }
    })
  };

  const paymentConfigSection = () => {
    return (
        <form className="w-full" onSubmit={handleSubmit} id="submitKeys">
          <div className='flex justify-center flex-grow bg-w'>
            <div className="mb-4 mt-20">
              <h1 className="text-xl font-semibold mb-3">Payment Key Validation</h1>
              <div className="flex space-x-4 mb-6">
                {distributorButtons.length > 0 ? distributorButtons : (
                    <span></span>
                )}
              </div>
              <div className="mb-4">
                {paymentConfigFields(accountObject).map((comp) => (comp))}
              </div>
              <div className="flex items-center justify-between">
                <button className="bg-red text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit" disabled={loading}>
                  {loading ? "Processing..." : "Validate"}
                </button>
              </div>
            </div>
          </div>
        </form>
    )
  }

  return (
      <div className=' bg-white grid grid-cols-7'>
        <Sidebar/>
        {/*  left side  */}
        <div className='col-span-3'>
          {/* menu title */}
          <h1 className='text-2xl text-left font-bold text-black mb-4 mt-4 ml-4'>Payment Configuration Update</h1>
          <form className="w-full" onSubmit={handleSubmit} id="submit">
            <div className="w-full">
              <div className='flex flex-row space-x-1 bg-white items-center px-4 py-2'>
                {Textbox({
                  name: "dataAcctID",
                  id: "inline-dataAcctID",
                  value: inputs.dataAcctID,
                  disabled: currentStep != 0,
                  label: "Data Account ID",
                  handleChange: handleCidChange,
                })}
                <button
                    disabled={loading}
                    className="shadow bg-red focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
                    type="submit">
                  {loading ? "Processing..." : "Find"}
                </button>
              </div>
            </div>
          </form>

          {/* show client component when input is filled */}
          {currentStep == 1 || currentStep == 2 ?
              <ClientComponent accountId={inputs.dataAcctID} sk={inputs.sk} distributors={distributorsFound}/> : null}

          {/* Loading indicator / API message */}
          {loading ? <div className="border-gray-300 h-20 w-20 animate-spin rounded-full border-8 border-t-blue-600"/> :
              <div>{resultMessage}</div>}
        </div>


        {/*  right side, step 2 */}
        <div className="col-span-3">
          {currentStep == 2 ? paymentConfigSection() : null}

        </div>

      </div>
  )
}
