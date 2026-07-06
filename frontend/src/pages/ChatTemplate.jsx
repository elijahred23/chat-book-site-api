import {useEffect, useState, useSyncExternalStore} from 'react';

const ChatTemplate = () => {
    const [template, setTemplate] = useState("");
    const [variables, setVariables] = useState([]);


    function extractWordsInBrackets(text) {
        const regex = /\[(.*?)\]/g; // Capture group with non-greedy matching
        return text.match(regex) || []; // Return empty array if no matches
    }

    function convertPhrasesToVariableNames(phrases) {
        return phrases.map(phrase => {
            // Remove special characters and spaces, replace with underscores
            const cleanPhrase = phrase.replace(/[^a-zA-Z0-9_]/g, '_');

            // Make sure the first character is a letter or underscore
            const validName = cleanPhrase.replace(/^([^a-zA-Z_]+)/, '_$1');

            // Return the converted variable name
            return validName;
        });
    }

    const addTemplate = () => {

    }

    useEffect(()=>{
        let vars = extractWordsInBrackets(template);
        if(vars.length > 0){
            let cleanVariables = convertPhrasesToVariableNames(vars);
            setVariables(cleanVariables);
        } else {
            setVariables([])
        }
        
    }, [template])

    return (<>
    <div>
        <h2>Chat Template</h2>
        <p>
            <input onChange={event=>{
                setTemplate(event.target.value);
            }} placeholder='Template'/>
            <ul>
                {variables?.map(variable=>{
                    return (<>
                        <li>{variable}</li>   
                    </>)
                })}
            </ul>
            <button disabled={!variables || variables?.length < 1} onClick={addTemplate}>Add Template</button>

        </p>
    </div> 
    </>)
}


export default ChatTemplate;