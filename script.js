import { EnhancedTable } from './table.js';
let pad = 50;
// implied "MUST NOT", "SHOULD NOT", "SHALL NOT", since those are musts, shoulds, and shalls
let words = ["MUST", "REQUIRED", "SHALL", "SHOULD", "RECOMMENDED",  "MAY", "OPTIONAL"];
function init() {
    document.querySelector("#submit").addEventListener("click", 
        async e => {
            document.querySelector("#status").textContent = "Reading the spec...";
            
            let inputUrl = document.querySelector("#url").value;
            if (inputUrl.trim() == "") {
                document.querySelector("#status").textContent = "Invalid URL";
                return;
            }
            let data = await processUrl(inputUrl);
            if (data.length > 0) {
                document.querySelector("#status").textContent = "Found RCF 2119 terms!";
            }
            else {
                document.querySelector("#status").textContent = "No RFC 2119 terms found";
            }
            displayResults(data, inputUrl);
            document.querySelector("#copyJson").addEventListener("click", async e => {
                await navigator.clipboard.writeText(JSON.stringify(data));
            });
            document.querySelector("#copyText").addEventListener("click", async e => {
                let str = data.map((item, idx) => `${idx+1}. ${item.word}\n\n"...${item.context}..."\n\n${item.url}`).join('\n\n');
                str = str.replace()
                await navigator.clipboard.writeText(str);
            });
        }
    );
}

async function processUrl(inputUrl) {
    let url = new URL(inputUrl);
    
    let response = await fetch(url);
    if (response.status != 200) {
        document.querySelector("#status").textContent = "Error; response said " + response.status;
        return;
    }
    let html = await response.text();
    let parser = new DOMParser();
	let doc = parser.parseFromString(html, 'text/html');
    let searchElement;
    if (url.hash) {
        console.log("Restricting search to portion", url.hash);
        searchElement = doc.querySelector(url.hash);
    }
    else {
        searchElement = doc.querySelector("body");
    }

    
    let data = words.map(word => {
        let results = findInstances(word, searchElement, inputUrl);
        return results;
    }).flat();
    return data;

}

function findInstances(word, searchElement, inputUrl, parentSection = null) {
    let results = [];
    if (
            searchElement.tagName == "BODY" ||
            (searchElement.tagName == "SECTION" 
                && !searchElement.classList.contains("informative") 
                && !searchElement.classList.contains("introductory")
            )
        ) {
        Array.from(searchElement.children).map(child => {
            results = results.concat(findInstances(word, child, inputUrl, searchElement));
        });
    }
    else {
        if (["NAV", "SECTION", "BODY"].indexOf(searchElement.tagName) == -1) {
            let textContent = cleanUpString(searchElement.textContent);
            let idxs = findIndicesOf(word, textContent, true);
            for(let idx of idxs) {
                let start = idx - pad > 0 ? idx - pad : 0;
                let end = idx + pad < textContent.length ? idx + pad : textContent.length - 1;
                let context = textContent.slice(start, end);
                let sectionId = parentSection.id;
                let url = new URL(`#${sectionId}`, inputUrl).href;
                let sectionTitle = parentSection.children[0]?.textContent;
                sectionTitle = sectionTitle.length > 50 ? sectionTitle.slice(0, 50) + "..." : sectionTitle;
                results.push({word, context, url, sectionTitle});
            }
        }
    }
    
    return results;

}
function displayResults(data, inputUrl) {
    let tbody = document.querySelector("#results-table tbody");
    tbody.innerHTML = ''; // clear any old results
    data.map(result => {
        
        let tr = document.createElement("tr");
        let tdWord = document.createElement("td");
        tdWord.textContent = result.word;

        let tdContext = document.createElement("td");
        tdContext.textContent = "..." + result.context + "...";

        let tdLink = document.createElement("td");
        tdLink.innerHTML = `<a href="${result.url}">${result.sectionTitle}</a>`;

        tr.appendChild(tdWord);
        tr.appendChild(tdContext);
        tr.appendChild(tdLink);
        tbody.appendChild(tr);
    });
    let numMusts = data.filter(item => item.word == "MUST").length;
    let numShoulds = data.filter(item => item.word == "SHOULD").length;
    let numMays = data.filter(item => item.word == "MAY").length;
    document.querySelector("#table-caption").textContent = 
        `${words
            .filter(word => data.filter(item => item.word == word).length > 0)
            .map(word => `${data.filter(item => item.word == word).length} ${word}s`)
        .join(", ")}`;
    
    let tableElm = document.querySelector("#results-table");
    let tableControlsElm = document.querySelector("#table-controls");
    let enhancedTable = new EnhancedTable(tableElm, tableControlsElm);
    
    enhancedTable.enableFilters([
        {
            label: "Filter",
            pathFn: r => r.querySelector(`td:nth-child(1)`).textContent
        }
    ]);
}

function cleanUpString(str) {
    let retval = str.replace(/\t/g, '');
    retval = retval.replace(/\n/g, ' ');
    retval = retval.replace(/\[\[/g, '');
    retval = retval.replace(/\]\]/g, '');
    return retval;
}

function findIndicesOf(searchStr, str, caseSensitive) {
    var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
        return [];
    }
    var startIndex = 0, index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

export { init };