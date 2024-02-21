
export default function Textbox(props: { name: string, id: string, value: string, label: string, handleChange: React.ChangeEventHandler<HTMLInputElement> }): JSX.Element {
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
                    className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-black leading-tight focus:outline-none focus:bg-white focus:border-red"
                    name={props.name} id={props.id} type="text" value={props.value} onChange={props.handleChange}
                    placeholder={`Input ${props.label}...`}
                />
            </div>
        </div>
    )
}