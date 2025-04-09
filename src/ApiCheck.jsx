import { useState, useEffect } from 'react';

import { hostname } from './utils/hostname';
const baseURL = hostname;

export default function ApiCheck() {
    const [apiMessage, setApiMessage] = useState('');
    const [success, setSuccess] = useState(false);

    const getMessageFromAPI = async () => {
        await fetch(`${baseURL}/api/check`).then(res => res.json()).then(res => {
            setSuccess(true);
            let message = res?.message ?? 'MESSAGE NOT SENT AS RESPONSE';
            setApiMessage(message);
        }).catch(error => {
            window.alert(JSON.stringify(error))
            window.alert(baseURL)
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