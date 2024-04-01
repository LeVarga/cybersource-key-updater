import Label from "./Label.tsx";

export default function Textbox(props: { name: string, id: string, value: string, label: string, handleChange: React.ChangeEventHandler<HTMLInputElement>, disabled: boolean }): JSX.Element {
    return (
        <div className="mb-4 ml-4 flex-grow mr-4">
            {Label({text: props.label, for: props.id})}
            <div>
                <input
                    className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-black leading-tight focus:outline-none focus:bg-white focus:border-red"
                    name={props.name} id={props.id} type="text" value={props.value} onChange={props.handleChange}
                    disabled={props.disabled}
                    placeholder={`Input ${props.label}...`}
                />
            </div>
        </div>
    )
}