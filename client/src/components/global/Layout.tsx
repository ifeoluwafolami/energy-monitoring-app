import Navigation from "./Navigation";
import Footer from "./Footer";
import type { ReactNode } from "react";

interface LayoutProps {
    children: ReactNode;
}

function Layout({children}: LayoutProps) {
    return (
        <div className="bg-sec-gray font-inter flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-grow mx-4 mt-16 lg:mt-22 min-h-screen">{children}</main>
            <Footer />
        </div>
       
    )   
}

export default Layout;