import Label from "./Label.tsx";

export default function DropDownMenu(props: { name: string, id: string, value: string, label: string, options: Array<any>, handleChange: React.ChangeEventHandler<HTMLInputElement>, disabled: boolean }): JSX.Element {
    return (
        <div className="mb-4 ml-4 flex-grow mr-4">
            {Label({text: props.label, for: props.id})}
            <div>
                <select name={props.name} id={props.id} value={props.value}>
                    {props.options.map(option => {
                        return (
                            <option value={option}>{option}</option>
                        )
                    })}
                </select>
            </div>
        </div>
    )
}