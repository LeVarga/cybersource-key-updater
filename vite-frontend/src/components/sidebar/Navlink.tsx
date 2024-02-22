export default function Navlink({ text }: { text: string }) {
    return (
        <a className="block">
            <div className="py-4 px-4 text-xl w-full text-left">
                {text}
            </div>
        </a>
    )
}