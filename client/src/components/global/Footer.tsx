import { Heart } from "lucide-react";

function Footer() {
    return (
        <footer className="bg-white text-primary-orange py-6 justify-center items-center flex w-full">
            <span>Made with</span><Heart className="mx-1" /><span>by <a href="https://www.linkedin.com/in/ifeoluwafolami" target="_blank" className="underline">Ifeoluwa Folami</a></span>
        </footer>
    )
}

export default Footer;