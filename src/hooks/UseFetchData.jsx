import { useState, useEffect, useRef } from "react";

const UseFetchData = (url) => {
    const [data, setData] = useState([]);
    const [loader, setLoader] = useState(true);
    const [error, setError] = useState(null);
    const controllerRef = useRef(new AbortController());

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoader(true);
                const response = await fetch(`/Db/encrypted_quizzes.json`);
                const data = await response.json();
                setData(data);
            } catch (error) {
                setError(error);
            } finally {
                setLoader(false);
            }
        };

        const controller = controllerRef.current; // Copy the reference to a local variable
        fetchData();

        return () => controller.abort();
    }, [url]);

    return { data, loader, error };
};

export default UseFetchData;
