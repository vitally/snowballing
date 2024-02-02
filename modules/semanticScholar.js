// modules/semanticScholar.js
import axios from 'axios';
import dotenv from 'dotenv';
import Bottleneck from 'bottleneck';

dotenv.config();

const API_BASE_URL = 'https://api.semanticscholar.org/v1/paper/';
const GRAPH_API_URL = 'https://api.semanticscholar.org/graph/v1/paper/';

const API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY;

const batchLimiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1000 // 1 request per second
});

const generalLimiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 100 // 10 requests per second
});

export async function fetchPaperData(paperId, type) {
    return generalLimiter.schedule(() => makeApiRequest(paperId, type));
}

export async function fetchSemanticScholarReferences(paper){ 
    return generalLimiter.schedule(() => makeReferenceApiRequest(paper.id));
}

export async function fetchMultiplePapaerData(papaers){
    const paperIds = papaers.map(identifierObj => `${identifierObj.type}:${identifierObj.id}`);
    return batchLimiter.schedule(() => makeBatchApiRequest(paperIds));
}

export async function enrichReferences(references) {
    if (references && Array.isArray(references)) {
        const referencesWithDOI = references.filter(ref => ref.doi && !ref.id).map(ref => `DOI:${ref.doi}`);
        const referencesWithoutDOI = references.filter(ref => !ref.doi && ref.title && !ref.id);

        // Continue with batch processing for references with DOI
        const enrichedWithDOI = referencesWithDOI.length > 0 ? await batchLimiter.schedule(() => makeBatchApiRequest(referencesWithDOI)) : [];

        // Process references without DOI individually
        const enrichedWithoutDOI = referencesWithoutDOI.length > 0 ? await Promise.all(referencesWithoutDOI.map(ref => makeApiRequest(ref.title, 'Title'))) : [];

        // Combine results
        return [...enrichedWithDOI, ...enrichedWithoutDOI];
    }
    return [];
}


async function makeBatchApiRequest(paperIds) {
    try {
        const fields = 'title,year,externalIds,abstract';
        const response = await axios.post(
            `${GRAPH_API_URL}batch?fields=${encodeURIComponent(fields)}`,
            { ids: paperIds },
            { headers: { 'x-api-key': API_KEY } }
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching batch paper data:', error.message);
        return null;
    }
}

async function makeReferenceApiRequest(paperId) {
    try {
        const url = `${GRAPH_API_URL}${encodeURIComponent(paperId)}/references?fields=title,year,externalIds,abstract`;
        const response = await axios.get(url, {
            headers: { 'x-api-key': API_KEY }
        });
        return response.data?.data || []; // Return references, or an empty array if none exist
    } catch (error) {
        console.error(`Error fetching references for paper (${paperId}):`, error.message);
        return null;
    }
}


async function makeApiRequest(paperId, type) {
    try {
        let url;
        switch (type) {
            case 'DOI':
                url = `${API_BASE_URL}${encodeURIComponent(paperId)}`;
                break;
            case 'CorpusId':
                url = `${API_BASE_URL}CorpusID:${paperId}`;
                break;
            case 'arXivId':
                url = `${API_BASE_URL}arXiv:${encodeURIComponent(paperId)}`;
                break;
            case 'Title':
                url = `${GRAPH_API_URL}search?query=${encodeURIComponent(paperId)}&limit=1&fields=title,year,externalIds,abstract`;
                const response = await axios.get(url, {
                    headers: { 'x-api-key': API_KEY }
                });
                const data = response.data?.data;
                if (data && data.length > 0 && data[0].title.toLowerCase() === paperId.toLowerCase()) {
                    return data[0]; // Return the first paper if the title matches
                }
                return {title: paperId}; 
            default:
                throw new Error(`Unknown paper ID type: ${type}`);
        }

        const response = await axios.get(url, {
            headers: { 'x-api-key': API_KEY }
        });
        return response.data?.data;
    } catch (error) {
        console.error(`Error fetching paper data (${paperId}):`, error.message);
        return null;
    }
}
