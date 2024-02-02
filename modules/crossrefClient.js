// modules/crossrefClient.js
import axios from 'axios';
import dotenv from 'dotenv';

const API_BASE_URL = 'https://api.crossref.org/works/';
const POLITE_EMAIL = process.env.CROSSREF_EMAIL;

export async function fetchCrossrefReferences(doi) {
    const url = `${API_BASE_URL}${encodeURIComponent(doi)}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': `SnowballingAssistant/1.0 (mailto:${POLITE_EMAIL})`
                // Include headers if needed, for example, an API key
                // 'Authorization': `Bearer ${YOUR_API_KEY}`
            }
        });

        const references = response.data.message.reference;
        return references;
    } catch (error) {
        console.error('Error fetching data from Crossref:', error.message);
        return null;
    }
}
