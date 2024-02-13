import { useState, useEffect } from 'react';

const baseURL = 'http://localhost:3000';


export default function ApiCheck() {
    const [apiMessage, setApiMessage] = useState('');
    const [success, setSuccess] = useState(false);

    const getMessageFromAPI = async () => {
        await fetch(`${baseURL}/`).then(res => res.json()).then(res => {
            setSuccess(true);
            let message = res?.message ?? 'MESSAGE NOT SENT AS RESPONSE';
            setApiMessage(message);
        }).catch(error => {
            setSuccess(false);
            setApiMessage(error?.message ?? 'NO ERROR MESSAGE PROVIDED BY API');
        })
    }

    useEffect(() => {
        getMessageFromAPI();
    }, []);

    return (<><div>
        <h2>API Check</h2>
        <p style={{ color: success ? 'green' : 'red' }}>{apiMessage}</p>
    </div></>)
}