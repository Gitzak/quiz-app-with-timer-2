import React from "react";
import images from "../../Constants/images";

export const JoinScreen = ({ start }) => {
    return (
        <section className="py-5 bg-dark vh-100">
            <div className="container px-4 px-lg-5 my-5">
                <div className="row gx-4 gx-lg-5 align-items-center">
                    <div className="col-md-6">
                        <img className="mb-5 mb-md-0 img-fluid" width="80%" src={images.image_1_gif} alt="..." />
                    </div>
                    <div className="col-md-6">
                        <h1 className="display-5 fw-bolder text-white">Want to test your knowledge?</h1>
                        <p className="lead text-white">
                            Challenge your knowledge with over 1200 thought-provoking questions in this interactive and engaging learning experience.
                            <br />
                            Test and improve your skills!
                        </p>
                        <div className="d-flex">
                            <button onClick={start} className="btn btn-primary btn-lg rounded-pill px-4 flex-shrink-0" type="button">
                                Get started
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
