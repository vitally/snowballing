import he from 'he';

// modules/resultProcessor.js
const propertyMap = {
    'DOI': 'doi',
    'article-title': 'title'
};

const propertiesToRetain = ['title', 'doi', 'abstract', 'year', 'id'];

export function processPaperData(paperData) {
    if (!paperData) {
        console.error('No paper data to process');
        return null;
    }
    renameProperties(paperData, propertyMap);
    // Extract required information from the paperData
    // For example: title, authors, year, etc.
    const processedData = {
        id: paperData.paperId,
        title: paperData.title,
        year: paperData.year,
        abstract: paperData.abstract,
        // authors: paperData.authors.map(author => author.name),
        doi: paperData.externalIds?.DOI,
        // citations: paperData.citations
        // Add more fields as needed
    };

    return processedData;
}

export function analyzeResults(processedPapers) {
    // Implement any specific analysis you need on the processed papers
    // For example: count papers per year, find most frequent authors, etc.

    // This is just a placeholder for whatever analysis you need
    return {
        totalPapers: processedPapers.length,
        // Other analysis results
    };
}

export function mergeReferences(referencesFromSemanticScholar, referencesFromCrossref) {
    const mergedReferences = [];
    const seenTitles = new Set();
    const seenDois = new Set();

    const semanticScholarRefs = Array.isArray(referencesFromSemanticScholar) ? referencesFromSemanticScholar : [];
    const crossrefRefs = Array.isArray(referencesFromCrossref) ? referencesFromCrossref : [];

    [...semanticScholarRefs, ...crossrefRefs].forEach(ref => {
        const { normalizedTitle, normalizedDoi } = normalizeReference(ref);
        
        if ((normalizedTitle && !seenTitles.has(normalizedTitle)) ||
            (normalizedDoi && !seenDois.has(normalizedDoi))) {
            if (normalizedTitle) seenTitles.add(normalizedTitle);
            if (normalizedDoi) seenDois.add(normalizedDoi);
            mergedReferences.push(ref);
        }
    });

    return mergedReferences;
}


function renameProperties(obj, nameMap) {
    Object.keys(nameMap).forEach(oldProp => {
        if (obj.hasOwnProperty(oldProp)) {
            const newProp = nameMap[oldProp];
            obj[newProp] = obj[oldProp];
            delete obj[oldProp];
        }
    });
}

function moveChildPropertiesToParent(obj, childPropertyName) {
    if (obj[childPropertyName] && typeof obj[childPropertyName] === 'object') {
        Object.assign(obj, obj[childPropertyName]); // Move child properties to parent
        delete obj[childPropertyName]; // Delete the original child property
    }
}

function deleteProperties(obj, propertiesToDelete) {
    propertiesToDelete.forEach(prop => {
        if (obj.hasOwnProperty(prop)) {
            delete obj[prop];
        }
    });
}

function retainProperties(obj, propertiesToRetain) {
    Object.keys(obj).forEach(prop => {
        if (!propertiesToRetain.includes(prop)) {
            delete obj[prop];
        }
    });
}


function normalizeProperty(ref, property) {
    if (ref.hasOwnProperty(property) && ref[property]) {
        let value = he.decode(ref[property]);
        value = value.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
        return value.toLowerCase().replace(/[^a-z0-9]/g, ''); 
    }
    return '';
}

function normalizeReference(ref) {
    return {
        normalizedTitle: normalizeProperty(ref, 'title'),
        normalizedDoi: normalizeProperty(ref, 'doi')
    };
}
