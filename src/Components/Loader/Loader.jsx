import React from "react";

export const Loader = () => {
    return (
        <div id="spinner" className="spinner-wrapper justify-content-center align-items-center">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );
};
