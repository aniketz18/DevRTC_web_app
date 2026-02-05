import { useEffect, useState, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../utils/api";
import Peer from "simple-peer";
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, Camera } from "lucide-react";
import toast from "react-hot-toast";

const Dashboard = () => {
    const { user, logout, socket } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);

    // Call State
    const [stream, setStream] = useState(null);
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");
    const [callerSignal, setCallerSignal] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState("");
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [mediaError, setMediaError] = useState(null);
    const [callStatus, setCallStatus] = useState("idle"); // idle, calling, ringing, connected

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        // Fetch all users
        const fetchUsers = async () => {
            try {
                const { data } = await API.get("/auth/users");
                setUsers(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchUsers();

        if (socket) {
            socket.on("getOnlineUsers", (users) => {
                setOnlineUsers(users);
            });

            socket.on("callUser", (data) => {
                setReceivingCall(true);
                setCaller(data.from);
                setName(data.name);
                setCallerSignal(data.signal);
                setCallStatus("ringing");
            });

            socket.on("callRejected", () => {
                toast.error("Call Declined");
                cleanupMedia();
                setCallAccepted(false);
                setReceivingCall(false);
                setCaller("");
                setCallerSignal(null);
                setName("");
                setCallStatus("idle");
            });

        }
    }, [socket]);

    const cleanupMedia = () => {
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
            });
            setStream(null);
        }
        if (myVideo.current) myVideo.current.srcObject = null;
        if (userVideo.current) userVideo.current.srcObject = null;
    };

    const initializeMedia = async () => {
        try {
            setMediaError(null);
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            setStream(currentStream);
            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }
            return currentStream;
        } catch (err) {
            console.error("Error accessing media devices:", err);
            let errorMessage = "Failed to access media devices.";

            if (err.name === 'NotReadableError') {
                errorMessage = "Camera/Mic is busy. Close other apps (Zoom, Teams) and try again.";
                setMediaError({ type: 'in_use', message: errorMessage });
            } else if (err.name === 'NotAllowedError') {
                errorMessage = "Permission denied. Allow camera/mic access in browser settings.";
                setMediaError({ type: 'denied', message: errorMessage });
            } else {
                setMediaError({ type: 'other', message: errorMessage });
            }

            toast.error(errorMessage);
            throw err;
        }
    };

    const callUser = async (id) => {
        try {
            const currentStream = await initializeMedia();
            setCallStatus("calling");

            const peer = new Peer({
                initiator: true,
                trickle: false,
                stream: currentStream,
                config: {
                    iceServers: [
                        { urls: "stun:stun.l.google.com:19302" },
                        { urls: "stun:global.stun.twilio.com:3478" }
                    ]
                }
            });

            peer.on("signal", (data) => {
                socket.emit("callUser", {
                    userToCall: id,
                    signalData: data,
                    from: user._id,
                    name: user.fullname,
                });
            });

            peer.on("stream", (remoteStream) => {
                if (userVideo.current) {
                    userVideo.current.srcObject = remoteStream;
                }
            });

            socket.on("callAccepted", (signal) => {
                setCallAccepted(true);
                setCallStatus("connected");
                peer.signal(signal);
            });

            connectionRef.current = peer;
        } catch (err) {
            // Handled in initializeMedia
            setCallStatus("idle");
        }
    };

    const answerCall = async () => {
        try {
            const currentStream = await initializeMedia();
            setCallAccepted(true);
            setCallStatus("connected");

            const peer = new Peer({
                initiator: false,
                trickle: false,
                stream: currentStream,
                config: {
                    iceServers: [
                        { urls: "stun:stun.l.google.com:19302" },
                        { urls: "stun:global.stun.twilio.com:3478" }
                    ]
                }
            });

            peer.on("signal", (data) => {
                socket.emit("answerCall", { signal: data, to: caller });
            });

            peer.on("stream", (remoteStream) => {
                if (userVideo.current) {
                    userVideo.current.srcObject = remoteStream;
                }
            });

            peer.signal(callerSignal);
            connectionRef.current = peer;
        } catch (err) {
            // Handled in initializeMedia
        }
    };

    const rejectCall = () => {
        socket.emit("rejectCall", { to: caller });

        setReceivingCall(false);
        setCaller("");
        setCallerSignal(null);
        setName("");
        setCallStatus("idle");
    };

    const leaveCall = () => {

        setCallEnded(true);
        if (connectionRef.current) {
            connectionRef.current.destroy();
        }
        cleanupMedia();

        // Reset state
        setCallAccepted(false);
        setReceivingCall(false);
        setCaller("");
        setCallerSignal(null);
        setName("");
        setCallStatus("idle");
        setCallEnded(false);
    };

    const toggleMic = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !micOn;
                setMicOn(!micOn);
            }
        }
    };

    const toggleCamera = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !cameraOn;
                setCameraOn(!cameraOn);
            }
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-7xl">
            {/* Header */}
            <div className="flex justify-between items-center bg-gray-900/50 backdrop-blur-md p-4 rounded-xl border border-gray-800 mb-8 sticky top-4 z-40">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-600/20 p-2 rounded-lg">
                        <Video className="text-purple-500" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold font-mono tracking-tight">
                        <span className="text-white">Dev</span>
                        <span className="text-purple-500">RTC</span>
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm hidden md:inline">Logged in as <span className="text-white font-medium">{user?.fullname}</span></span>
                    <button onClick={logout} className="bg-gray-800 hover:bg-red-900/30 text-gray-300 hover:text-red-400 border border-gray-700 hover:border-red-800 px-4 py-2 rounded-lg transition-all text-sm font-medium">
                        Logout
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {/* User List */}
                <div className="md:col-span-1 bg-gray-900/40 backdrop-blur rounded-2xl border border-gray-800 overflow-hidden flex flex-col max-h-[300px] md:max-h-[700px]">
                    <div className="p-5 border-b border-gray-800 bg-gray-900/60">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            Contacts
                        </h2>
                    </div>
                    {users.length === 0 ? <p className="text-gray-400 p-5">No other users found.</p> : (
                        <ul className="divide-y divide-gray-800 overflow-y-auto">
                            {users.map((u) => {
                                const isOnline = onlineUsers.includes(u._id);
                                return (
                                    <li key={u._id} className="flex justify-between items-center p-4 hover:bg-gray-800/50 transition duration-200">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-purple-400 font-bold border border-gray-600">
                                                    {u.fullname.charAt(0).toUpperCase()}
                                                </div>
                                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${isOnline ? "bg-green-500" : "bg-gray-500"}`}></div>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-200">{u.fullname}</p>
                                                <p className={`text-xs ${isOnline ? "text-green-400" : "text-gray-500"}`}>
                                                    {isOnline ? "Online" : "Offline"}
                                                </p>
                                            </div>
                                        </div>
                                        {isOnline && (
                                            <button onClick={() => callUser(u._id)} disabled={callStatus !== 'idle'} className="bg-purple-600/20 text-purple-400 p-2 rounded-lg hover:bg-purple-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/30" title="Video Call">
                                                <Video size={18} />
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Video Area */}
                <div className="md:col-span-2 bg-black rounded-lg p-4 flex flex-col items-center justify-center relative min-h-[50vh] md:min-h-[600px] border border-gray-800">

                    {/* Status Badge */}
                    {callStatus !== 'idle' && (
                        <div className="absolute top-4 left-4 bg-gray-800/80 px-3 py-1 rounded text-sm font-mono z-20">
                            Status: <span className="text-purple-400 font-bold uppercase">{callStatus}</span>
                        </div>
                    )}

                    {/* My Video (PiP) */}
                    {stream && (
                        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden border-2 border-purple-500 z-10 shadow-lg">
                            <video playsInline muted ref={myVideo} autoPlay className={`w-full h-full object-cover ${!cameraOn ? 'hidden' : ''}`} />
                            {!cameraOn && <div className="w-full h-full flex items-center justify-center text-gray-500"><VideoOff size={20} /></div>}
                        </div>
                    )}

                    {/* Main Video Area */}
                    {callAccepted && !callEnded ? (
                        <div className="w-full h-full flex items-center justify-center relative">
                            <video playsInline ref={userVideo} autoPlay className="w-full h-full max-h-[600px] object-contain" />
                        </div>
                    ) : mediaError ? (
                        <div className="text-red-500 flex flex-col items-center p-6 bg-red-900/20 rounded-lg border border-red-500">
                            <VideoOff size={48} className="mb-4" />
                            <p className="font-bold mb-2">
                                {mediaError.type === 'in_use' ? 'Device in Use' : 'Camera Access Denied'}
                            </p>
                            <p className="text-sm text-center max-w-xs mb-4">
                                {mediaError.type === 'in_use'
                                    ? "Your camera or microphone is being used by another application. Please close it and retry."
                                    : "Please enable camera and microphone permissions in your browser settings to use video chat."}
                            </p>
                            <button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition">
                                Reload App
                            </button>
                        </div>
                    ) : (
                        <div className="text-gray-500 flex flex-col items-center">
                            {callStatus === 'ringing' ? (
                                <div className="animate-pulse flex flex-col items-center">
                                    <Phone size={64} className="mb-4 text-purple-500" />
                                    <p className="text-xl">Incoming Call from {name}...</p>
                                </div>
                            ) : callStatus === 'calling' ? (
                                <div className="animate-pulse flex flex-col items-center">
                                    <Video size={64} className="mb-4 text-purple-500" />
                                    <p className="text-xl">Calling...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-gray-800 p-8 rounded-full mb-6">
                                        <Camera size={48} className="opacity-50" />
                                    </div>
                                    <p className="text-lg">Ready to call</p>
                                    <p className="text-sm text-gray-600 mt-2">Select a contact to start a video chat</p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Incoming Call Prompt */}
                    {receivingCall && !callAccepted && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 p-8 rounded-xl shadow-2xl border border-purple-500 text-center z-50 animate-pulse">
                            <h3 className="text-2xl font-bold mb-6 text-white">{name} is calling...</h3>
                            <div className="flex gap-6 justify-center">
                                <button onClick={answerCall} className="bg-green-600 p-4 rounded-full hover:bg-green-700 transition transform hover:scale-110 shadow-lg" title="Answer Call">
                                    <Phone size={32} />
                                </button>
                                <button onClick={rejectCall} className="bg-red-600 p-4 rounded-full hover:bg-red-700 transition transform hover:scale-110 shadow-lg" title="Decline Call">
                                    <PhoneOff size={32} />
                                </button>
                            </div>
                            <p className="mt-4 text-gray-400 text-sm">Accept or Decline</p>
                        </div>
                    )}


                    {/* Controls Bar */}
                    {callAccepted && !callEnded && (
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 md:gap-6 bg-gray-800/90 px-6 md:px-8 py-3 md:py-4 rounded-2xl backdrop-blur-md border border-gray-700 shadow-2xl z-30 w-[90%] md:w-auto justify-center">
                            <button
                                onClick={toggleMic}
                                className={`p-4 rounded-full transition-all duration-300 ${micOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                title={micOn ? "Mute Microphone" : "Unmute Microphone"}
                            >
                                {micOn ? <Mic size={24} /> : <MicOff size={24} />}
                            </button>

                            <button
                                onClick={leaveCall}
                                className="bg-red-600 p-4 rounded-full hover:bg-red-700 transition-all duration-300 transform hover:scale-110 shadow-lg"
                                title="End Call"
                            >
                                <PhoneOff size={32} />
                            </button>

                            <button
                                onClick={toggleCamera}
                                className={`p-4 rounded-full transition-all duration-300 ${cameraOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                title={cameraOn ? "Turn Camera Off" : "Turn Camera On"}
                            >
                                {cameraOn ? <Video size={24} /> : <VideoOff size={24} />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
