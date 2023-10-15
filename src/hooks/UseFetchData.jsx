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
                const response = await fetch(url);
                const data = await response.json();
                setData(data);
            } catch (error) {
                setError(error);
            } finally {
                setLoader(false);
            }
        };
        fetchData();

        return () => controllerRef.current.abort();
    }, [url]);

    return { data, loader, error };
};

export default UseFetchData;
