let paid = false;
let isExtensionActive = false;
let infoboxId = '';

window.addEventListener('mouseup', async () => {
    const infoText = await getInfoText();
    removeInfobox();
    if (infoText) renderInfobox(infoText);
    return true;
})

const getInfoText = async () => {
    const selectedText = document.getSelection().toString().trim();
    const blank = !selectedText || /^\s*$/.test(selectedText);
    if (blank) return false;
    if (selectedText.length <= 1) return false;
    if (selectedText.length > 32) return false;
    const endpoint  = `https://en.wikipedia.org/w/api.php?action=query&list=search&prop=info&inprop=url&utf8=&format=json&origin=*&srlimit=1&srsearch=${selectedText}`;
    const response = await fetch(endpoint);
    if (!response.ok) {
        return false;
    }
    const json = await response.json();
    let summary = await getContent(json);
    return summary;
};

const getContent = async (searchResult) => {
    let title = searchResult['query']['search'][0].title;
    title = title.replace(/\s+/g, '_');
    let contentUrl = `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&origin=*&titles=${title}`;
    const response = await fetch(contentUrl);
    if (!response.ok) {
        return false;
    }
    const json = await response.json();
    const extract = getExtractFirstSentence(json);
    if (extract.includes("may refer to:")) return false;
    if (extract) return extract;
};

const getExtractFirstSentence = json => {
    try {
        const { query } = json;
        const { pages } = query;
        const pageId = Object.keys(pages)[0];
        const { extract } = pages[pageId];
        let firstSentence = extract.split('. ', 1)[0]
        return firstSentence;
    } catch (error) {
        return false;
    }
};

const renderInfobox = async (infoText) => {
    const div = document.createElement("div"); 
    document.body.appendChild(div); 
    infoboxId = `infobox_${new Date().getTime()}`;
    div.id = infoboxId;
    div.className = 'infobox';
    div.innerHTML = `<img width="16" height="16" src=${chrome.runtime.getURL("lightbulbInfobox.png")}> <p>${infoText}</p>`;

    try {
        let selection = document.getSelection();
        let getRange = selection.getRangeAt(0);
        let selectionRect = getRange.getBoundingClientRect();
        
        div.style.top = selectionRect.top + selectionRect.height + window.scrollY + 10 + 'px';
        // compute left - make sure infobox renders inside the page with no overflow
        const overflow = selectionRect.left + selectionRect.width * 0.5 - div.offsetWidth * 0.5;
        const offset = overflow < 0 ? -overflow : 0;
        div.style.left = selectionRect.left + selectionRect.width * 0.5 + offset + 'px';
    } catch (error) {

    }
};

const removeInfobox = () => {
    const element = document.getElementById(infoboxId);
    if (!element) return;
    element.remove();
    document.getSelection().removeAllRanges();
};
