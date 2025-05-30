import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { CircleUserRound, MenuIcon, Settings } from "lucide-react";
import { Button } from "./Button";
import logo from "../../assets/ibedc-logo.png";

function Navigation() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const menuButtonRef = useRef<HTMLButtonElement | null>(null);
    const location = useLocation();

    useEffect(() => {
        const isLoggedIn = localStorage.getItem("loggedIn") === "true";
        setLoggedIn(isLoggedIn);

        if (location.pathname === "/" || location.pathname === "/register") {
            localStorage.removeItem("loggedIn");
            setLoggedIn(false);
        } else {
            setLoggedIn(isLoggedIn);
        }

        const handleMenuClickOutside = (e: MouseEvent) => {
            if (menuRef.current && 
                !menuRef.current.contains(e.target as Node) && 
                menuButtonRef.current && 
                !menuButtonRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener("mousedown", handleMenuClickOutside);
        } else {
            document.removeEventListener("mousedown", handleMenuClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleMenuClickOutside);
        }
    
    }, [menuOpen, location.pathname]);

    return (
        <>
            {/* Mobile Screens */}
            <div className="lg:hidden">
            <nav
                className="border-0 bg-white w-full top-0 z-10 fixed flex justify-between h-14 items-center lg:hidden px-2 pl-4">
                    <Link to="/" onClick={() => setMenuOpen(false)}>
                        <img src={logo} alt="IBEDC Logo" className="h-8 mb-1" />
                    </Link>
                    
                    <button onClick={() => setMenuOpen(!menuOpen)} ref={menuButtonRef}>
                    <MenuIcon className="w-7 h-7 mr-4 text-primary-blue" />
                    </button>
                </nav>

                {menuOpen && (
                    <div ref={menuRef} className="fixed min-w-screen top-14 bg-primary-orange items-center text-white shadow-md border-solid border-primary-blue z-20 flex flex-col">
                        {/* Refactor this to change when auth is confirmed */}
                        {loggedIn && (
                            
                        <>

                            <div className="hover:bg-primary-blue hover:text-white w-full">
                                <Link 
                                    to="/login" 
                                    className="block w-full text-center py-2 px-4 font-medium" 
                                    onClick={() => setMenuOpen(false)}
                                > 
                                    Login
                                </Link>
                            </div>

                            <div className="hover:bg-primary-blue hover:text-white w-full">
                                <Link 
                                    to="/register" 
                                    className="block w-full text-center py-2 px-4 font-medium"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Register
                                </Link>
                            </div>

                        </>
                        )}
                        
                        {/* Refactor this to change when auth is confirmed */}
                        {!loggedIn && (
                            <div>
                                <div className="hover:bg-primary-blue hover:text-white w-full">
                                    <Link 
                                        to="/dashboard" 
                                        className="block w-full text-center py-2 px-4 font-medium"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link 
                                        to="/profile" 
                                        className="block w-full text-center py-2 px-4 font-medium"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Profile
                                    </Link>
                                    <Link 
                                        to="/settings" 
                                        className="block w-full text-center py-2 px-4 font-medium"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Settings
                                    </Link>
                                </div>
                            </div>
                        )
                        }
                    </div>
                )}

            </div>

            {/* Large Screens */}
            <div className="hidden lg:flex">
                <nav className="border-0 bg-white w-full top-0 z-10 flex justify-between h-10 items-center px-10 py-10 fixed">
                    <Link to="/" onClick={() => setMenuOpen(false)}>
                        <img src={logo} alt="IBEDC Logo" className="h-10 mb-1" />
                    </Link>
                    

                    {/* Refactor this to change when auth is confirmed */}
                    {loggedIn && (
                        <div>
                            <Link to="/login" className=" font-semibold mr-4" onClick={() => setMenuOpen(false)}>
                            <Button text="Login" variant="outline" size="large" />
                            </Link>

                            <Link to="/register" className="text-charcoal text-lg font-semibold">
                            <Button text="Register"  variant="solid" size="large" />
                            </Link>
                        </div>
                    )}

                    {!loggedIn && (
                        <div className="flex gap-4">
                            <Link to="/dashboard">
                                <CircleUserRound className="w-8 h-8 text-primary-blue hover:text-primary-orange cursor-pointer" />
                            </Link>
                            <Link to="/settings">
                                <Settings className="w-8 h-8 text-primary-blue hover:text-primary-orange cursor-pointer" />
                            </Link>
                        </div>
                    )}
                </nav>
                
            </div>
        </>

    )
}

export default Navigation;