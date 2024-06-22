import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
const App = () => {
    const dispatch = useDispatch();
    const logs = useSelector(state => state.files);
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            dispatch({ type: 'ADD_LOG_LINE', payload: data });
        };
        return () => ws.close();
    }, [dispatch]);
    return (React.createElement("div", null, Object.keys(logs).map(filePath => (React.createElement("div", { key: filePath },
        React.createElement("h2", null, filePath),
        logs[filePath].map((line, index) => React.createElement("p", { key: index }, line)))))));
};
export default App;
