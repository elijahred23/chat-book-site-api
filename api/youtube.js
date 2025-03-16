import { YoutubeTranscript } from 'youtube-transcript';

export const fetchTranscript = async (url) => {
    let response = await YoutubeTranscript.fetchTranscript(url);
    let transcript = response?.reduce((previousValue, currentValue)=>{
        let text = currentValue?.text;
        return `${previousValue} ${text} `
    }, "")
    return transcript
}



