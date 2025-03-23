import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import "./SearchResults.css";

const SearchResults = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();

    // Get the search query from the URL
    const query = new URLSearchParams(location.search).get("q");

    useEffect(() => {
        if (query) {
            setLoading(true);
            setError(null);

            fetch(`/api/search?q=${query}`, {  // Ensure the correct API endpoint is used
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`, // Pass token if required
                },
            })
                .then((res) => {
                    if (!res.ok) {
                        throw new Error("Failed to fetch results");
                    }
                    return res.json();
                })
                .then((data) => {
                    if (data.error) {
                        setError(data.error);
                    } else {
                        setUsers(data);
                    }
                    setLoading(false);
                })
                .catch((err) => {
                    setError("Failed to fetch results. Please try again.");
                    setLoading(false);
                    console.error("Fetch error:", err);
                });
        }
    }, [query]);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (users.length === 0) {
        return <div className="no-results">No users found for "{query}".</div>;
    }

    return (
        <div className="search-results">
            <h2>Search Results for "{query}"</h2>
            <ul>
                {users.map((user) => (
                    <li key={user._id} className="user-item">
                        <img src={user.Photo || "default-avatar.png"} alt={user.name} className="user-avatar" />
                        <div className="user-details">
                        <Link to={`/profile/${user._id}`} className="user-name">
    {user.name}
</Link>
                            <p className="user-email">{user.email}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SearchResults;