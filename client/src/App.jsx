import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Footer from "./components/Footer";


function App() {
    const { user } = useContext(AuthContext);

    return (
        <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100 font-sans">
            <Toaster position="top-center" reverseOrder={false} />

            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
                    <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                    <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
                </Routes>
            </main>

            <Footer />
        </div>
    );
}

export default App;
