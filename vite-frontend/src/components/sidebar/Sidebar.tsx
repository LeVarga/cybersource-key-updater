import Navlink from "./Navlink"
export default function Sidebar() {
    const links = ["URL List", "Calendar", "Maintenance", "Install/Upgrades", "Onsales", "Pixel", "Clients", "Evenue Settings", "Customizations", "Dashboard", "Admin", "Payment Keys"]
    return (
        <div className="bg-black text-white h-screen w-1/3">
            <div className="m-4 w-3/4">
                <img src="./logo.webp" alt="Paciolan Logo" />
            </div>
            {/* now display all the routes */}
            <nav className="bg-darkGray my-4">
                {links.map(link => <Navlink text={link} key={link + "-link"} />)}
            </nav>
        </div>
    )
}