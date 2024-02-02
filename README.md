# Semantic Scholar and CrossRef for Snowballing Reviews

This Node.js application is created to assist with scholarly paper reference retrievals. It utilizes the Semantic Scholar and CrossRef APIs to fetch, process, and consolidate reference data to contain titles and abstracts of references, so that it is easier to pick what's needed for further research.

## Features

- Fetch paper details and references from Semantic Scholar and CrossRef.
- Normalize and merge references from both sources.
- Enrich references with additional data (title, year, abstract, authors, DOI).
- Save the consolidated references to a file.

## Setup and Installation

### Prerequisites

- Node.js
- npm (Node Package Manager)

### Installation

1. Clone the repository:
2. Install the required npm packages: npm install
3. Obtain an API key from semantic scholar: https://www.semanticscholar.org/product/api#api-key-form
4. In the rool directory creare a ".enf" file with two entries:
```
SEMANTIC_SCHOLAR_API_KEY=<your_semantic_scholar_api_key>
CROSSREF_POLITE_EMAIL=<your_email_address_for_polite_crossref_requests>
```

### Usage

Run the application using: node app.js
The app will read paperIds.txt file an make necessary requests to "Semantic Scholar" and "CrossRef" to fill the papers' data and collect references. Currently the file supports DOIs, SemanticScholar CourpusId, and arXivId.
The outputs are stored in processedPapers.json file.

## Contributing

Feel free to fork the repository, make improvements, and submit pull requests. We appreciate your contributions to enhance the functionality and performance of this application.
