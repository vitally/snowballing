// app.js
import { readPaperIds } from './modules/fileReader.js';
import { fetchSemanticScholarReferences, fetchMultiplePapaerData, enrichReferences } from './modules/semanticScholar.js';
import { processPaperData, mergeReferences } from './modules/resultProcessor.js';
import { fetchCrossrefReferences } from './modules/crossrefClient.js';
import { saveToFile } from './modules/fileWriter.js';

const PAPER_IDS_FILE = 'paperIds.txt';

async function enrichAndMergeReferences(paper) {
    const semanticScholarReferences = await fetchAndProcessSemanticScholarReferences(paper);
    const crossrefReferences = paper.doi ? await fetchAndProcessCrossrefReferences(paper.doi) : [];
    const mergedReferences = mergeReferences(semanticScholarReferences, crossrefReferences);
    const enrichedReferences = await enrichReferences(mergedReferences);
    return mergeEnrichedReferences(mergedReferences, enrichedReferences);
}

async function fetchAndProcessSemanticScholarReferences(paper) {
    const references = await fetchSemanticScholarReferences(paper);
    return Promise.all(references.map(async ref => {
        if (ref.citedPaper && ref.citedPaper.paperId) { //Sometimes referenences come broken, those records have paperId = null
            return processPaperData(ref.citedPaper);
        }
    })).then(results => results.filter(Boolean)); // filter out undefined results
}

async function fetchAndProcessCrossrefReferences(doi) {
    const references = await fetchCrossrefReferences(doi);
    return references.map(ref => processPaperData(ref)); // Assuming processPaperData can handle CrossRef references
}

function mergeEnrichedReferences(mergedReferences, enrichedReferences) {
    enrichedReferences = Array.isArray(enrichedReferences) ? enrichedReferences.map(ref => processPaperData(ref)) : [];
    mergedReferences.forEach(ref1 => {
        if (ref1 && ref1.doi) {
            const matchingRef = enrichedReferences.find(ref2 => ref2 && ref2.doi === ref1.doi);
            if (matchingRef) {
                Object.assign(ref1, matchingRef);
            }
        }
    });
    return mergedReferences;
}

async function main() {
    const papers = await readPaperIds(PAPER_IDS_FILE);
    const processedPapers = papers.knownIdsWithType 
        ? await fetchMultiplePapaerData(papers.knownIdsWithType) : [];
    const enrichedPapers = await Promise.all(processedPapers.map(async paper => {
        const processedPaper = processPaperData(paper);
        if (processedPaper) {
            processedPaper.references = await enrichAndMergeReferences(processedPaper);
            return processedPaper;
        }
    }));
    saveToFile('processedPapers.json', enrichedPapers.filter(Boolean));
}

main();