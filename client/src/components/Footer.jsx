import { Github } from "lucide-react";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-gray-900 border-t border-gray-800 py-6 mt-auto">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">

                {/* Brand & Tagline */}
                <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
                    <span className="text-purple-500 font-bold font-mono text-lg tracking-wider">DevRTC</span>
                    <span className="opacity-75">See the smile. feel the moment ✨</span>
                </div>

                {/* Copyright */}
                <div className="mb-4 md:mb-0">
                    &copy; {currentYear} DevRTC. All rights reserved.
                </div>

                {/* Links */}
                <div className="flex items-center gap-6">
                    <a href="#" className="hover:text-purple-400 transition-colors">Privacy</a>
                    <a href="#" className="hover:text-purple-400 transition-colors">Terms</a>
                    <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                        <Github size={16} />
                        GitHub
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
