import { useEffect, useState } from "react";

export const useSessionId = () => {
    const [isSessionId, setIsSessionId] = useState<string | null>(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        setIsSessionId(queryParams.get('sessionId'));
    }, []);

    return isSessionId;
};
