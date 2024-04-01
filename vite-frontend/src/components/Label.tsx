export default function Label(props: { for: string, text: string, }): JSX.Element {
    return (
        <div className="mb-4 ml-4 flex-grow mr-4">
            <label className="block text-gray-500 font-bold mb-1 text-left"
                   htmlFor={props.for}>
                {props.text}
            </label>
        </div>
    )
}