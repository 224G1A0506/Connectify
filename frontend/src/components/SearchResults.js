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

            fetch(`/search?q=${query}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`, // Pass token if required
                },
            })
                .then((res) => res.json())
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
                            <Link to={`/user/${user._id}`} className="user-name">
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
