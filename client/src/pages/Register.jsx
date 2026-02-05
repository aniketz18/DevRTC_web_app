import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";


const Register = () => {
    const [formData, setFormData] = useState({
        fullname: "",
        username: "",
        email: "",
        password: "",
    });
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const res = await register(formData);
            if (res.success) {
                toast.success("Registration successful!");
                navigate("/");
            } else {
                setError(res.message);
                toast.error(res.message);
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
            <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
                <div className="flex justify-center mb-6">
                    <h1 className="text-3xl font-bold font-mono tracking-tight flex items-center gap-2">
                        <span className="text-white">Dev</span>
                        <span className="text-purple-500">RTC</span>
                    </h1>
                </div>
                <h2 className="text-xl font-semibold text-center mb-6 text-gray-300">Create your account</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1">Full Name</label>
                        <input
                            type="text"
                            name="fullname"
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-purple-500"
                            value={formData.fullname}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Username</label>
                        <input
                            type="text"
                            name="username"
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-purple-500"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-purple-500"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-purple-500"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-purple-600 py-2 rounded hover:bg-purple-700 transition disabled:bg-purple-800 disabled:cursor-not-allowed">
                        {isLoading ? "Registering..." : "Register"}
                    </button>
                </form>
                <p className="mt-4 text-center text-gray-400">
                    Already have an account? <Link to="/login" className="text-purple-400">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
