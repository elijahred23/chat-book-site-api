import { useState, useEffect } from 'react';
import { hostname } from './utils/hostname';
import { getGeminiModel, updateGeminiModel } from './utils/callGemini';
const baseURL = hostname;

export default function ApiCheck() {
    const [apiMessage, setApiMessage] = useState('');
    const [success, setSuccess] = useState(false);

    const [geminiModel, setGeminiModel] = useState('');
    const [geminiModelInput, setGeminiModelInput] = useState('');

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
        const storedModel = localStorage.getItem('geminiModel');

        const fetchData = async () => {
            getMessageFromAPI();
            let newModel = await getGeminiModel();
            console.log({ newModel })
            if(newModel) {
                setGeminiModel(newModel);

                // Check local storage and update if different
                if (storedModel && storedModel !== newModel) {
                    try {
                        await updateGeminiModel(storedModel);
                        setGeminiModel(storedModel);
                    } catch (error) { /* Handle update error */ }
                }
            }
        }
        fetchData();
    }, []); // Empty dependency array means this effect runs once on mount

    return (<><div>
        <h2>API Check</h2>
        <p style={{ color: success ? 'green' : 'red' }}>{apiMessage}</p>
        <h3>Gemini Model</h3>
        <p style={{ color: success ? 'green' : 'red' }}>{geminiModel}</p>
        <input placeholder='Update Gemini Model' type="text" value={geminiModelInput} onChange={(e) => setGeminiModelInput(e.target.value)} />
        <button onClick={async () => {
            await updateGeminiModel(geminiModelInput);
            setGeminiModel(geminiModelInput);
            setGeminiModelInput('');
        }
        }>Update</button>
    </div></>)
}