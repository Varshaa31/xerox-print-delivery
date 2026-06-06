import React, { useState, useEffect } from "react";
import axios from "axios";
import './App.css';

function Auth({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [role, setRole] = useState("user"); // or "producer"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignup) {
        await axios.post("http://127.0.0.1:5000/api/signup", { role, username, password });
        setMessage("Signup successful! Please login.");
        setIsSignup(false);
      } else {
        const res = await axios.post("http://127.0.0.1:5000/api/login", { role, username, password });
        onLogin(res.data); // pass user info to parent
      }
    } catch (e) {
      setMessage(e.response?.data?.error || "Error occurred");
    }
  };

  return (
    <div className="container">
      <h1>{isSignup ? "Sign Up" : "Login"}</h1>

      <div className="button-group">
        <button onClick={() => setRole("user")} className={role === "user" ? "active" : ""}>User</button>
        <button onClick={() => setRole("producer")} className={role === "producer" ? "active" : ""}>Producer</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required />
        </div>

        <button type="submit">{isSignup ? "Sign Up" : "Login"}</button>
      </form>

      <p style={{ marginTop: "1rem", textAlign: "center", cursor: "pointer", color: "#2563eb" }}
         onClick={() => { setIsSignup(!isSignup); setMessage(""); }}>
        {isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}
      </p>

      {message && <p style={{ color: "red", textAlign: "center" }}>{message}</p>}
    </div>
  );
}


function App() {
  const [auth, setAuth] = useState(null); // {username, role}
  const [orders, setOrders] = useState([]);
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [printOptions, setPrintOptions] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (auth) fetchOrders();
  }, [auth]);

  const fetchOrders = async () => {
    const res = await axios.get("http://127.0.0.1:5000/api/orders");
    setOrders(res.data);
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    const data = new FormData();
    data.append("file", selectedFile);
    const res = await axios.post("http://127.0.0.1:5000/api/upload", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setFileUrl(res.data.file_url);
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    await axios.post("http://127.0.0.1:5000/api/orders", {
      user: auth.username,
      file_url: fileUrl,
      print_options: printOptions,
      address,
    });
    setFile(null);
    setFileUrl("");
    setPrintOptions("");
    setAddress("");
    fetchOrders();
  };

  const handleStatusChange = async (id, status) => {
    await axios.patch(`http://127.0.0.1:5000/api/orders/${id}`, { status });
    fetchOrders();
  };

  const handleLogout = () => {
    setAuth(null);
    setOrders([]);
  };

  if (!auth) {
    return <Auth onLogin={setAuth} />;
  }

  return (
    <div className="container">
      <h1>Xerox Online Print Delivery</h1>
      <p style={{ textAlign: "center", marginBottom: "1rem" }}>
        Logged in as <strong>{auth.username}</strong> ({auth.role}) <button onClick={handleLogout}>Logout</button>
      </p>

      {/* User View */}
      {auth.role === "user" && (
        <div>
          <h2>Place Print Order</h2>
          <form onSubmit={handleOrder}>
            <div className="form-group file-input-wrapper">
              <label className="file-input-label" htmlFor="file-upload">
                {file ? "Change File" : "Choose File"}
              </label>
              <input
                id="file-upload"
                type="file"
                onChange={handleFileUpload}
                required={!fileUrl}
              />
              {file && (
                <p style={{ marginTop: "8px", fontSize: "0.9rem", color: "#374151" }}>
                  Selected: <strong>{file.name}</strong>
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Print Options</label>
              <input
                type="text"
                placeholder="e.g. Color, 2 copies"
                value={printOptions}
                onChange={(e) => setPrintOptions(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Delivery Address</label>
              <input
                type="text"
                placeholder="Enter delivery address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <button type="submit">Place Order</button>
          </form>
        </div>
      )}

      {/* Producer View */}
      {auth.role === "producer" && (
        <div>
          <h2>Producer Dashboard</h2>
          <ul>
            {orders.map((o) => (
              <li key={o.id}>
                <span>
                  {o.user} - {o.print_options} - {o.status} (
                  <a href={`http://127.0.0.1:5000${o.file_url}`} download>
                    Download File
                  </a>
                  )
                </span>
                {o.status !== "Delivered" && (
                  <select
                    value={o.status}
                    onChange={(e) => handleStatusChange(o.id, e.target.value)}
                  >
                    <option>Placed</option>
                    <option>Printing</option>
                    <option>Ready</option>
                    <option>Out for Delivery</option>
                    <option>Delivered</option>
                  </select>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Order Status List for all roles */}
      <h3>Order Status</h3>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            {o.user} - {o.print_options} - {o.address} - {o.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
