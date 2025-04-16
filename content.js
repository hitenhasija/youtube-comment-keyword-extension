// Function to fetch all comments
function getComments() {
    let comments = document.querySelectorAll("#content-text");
    let commentArray = Array.from(comments).map(comment => comment.innerText);

    // Store in Chrome storage so popup can access
    chrome.storage.local.set({ comments: commentArray });
}

// Run when the script is injected
getComments();

let filteredComments = [];
let currentIndex = -1;

// Function to detect YouTube's theme (light or dark mode)
function getYouTubeTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Function to reset all highlights
function resetHighlights() {
    document.querySelectorAll("#content-text").forEach(comment => {
        comment.style.backgroundColor = "";
        comment.style.borderRadius = "";
        comment.style.padding = "";
        comment.style.transition = "";
    });

    // Clear stored highlighted comment
    chrome.storage.local.remove("lastHighlightedComment");
}

// Function to scroll and highlight a comment
function scrollToComment(index) {
    if (filteredComments.length === 0) return;

    // Ensure index is within bounds
    currentIndex = (index + filteredComments.length) % filteredComments.length;
    
    const comment = filteredComments[currentIndex];
    comment.scrollIntoView({ behavior: "smooth", block: "center" });

    // Get current theme
    const theme = getYouTubeTheme();

    // Define modern highlight colors
    const highlightColor = theme === "dark" ? "rgba(38, 255, 0, 0.6)" : "rgba(255, 165, 0, 0.6)";

    // Reset all highlights before applying a new one
    resetHighlights();

    // Apply new highlight with a smooth transition
    comment.style.transition = "background-color 0.3s ease-in-out";
    comment.style.backgroundColor = highlightColor;
    comment.style.borderRadius = "6px"; 
    comment.style.padding = "3px 6px";

    // Store the last highlighted comment in Chrome storage
    chrome.storage.local.set({ lastHighlightedComment: comment.innerText });
}

// Function to find comments containing the keyword
function filterComments(keyword) {
    resetHighlights(); // Clear previous highlights before filtering new ones

    const comments = document.querySelectorAll("#content-text");
    filteredComments = [];

    comments.forEach(comment => {
        if (comment.textContent.toLowerCase().includes(keyword.toLowerCase())) {
            filteredComments.push(comment);
        }
    });

    if (filteredComments.length > 0) {
        scrollToComment(0); // Jump to first match

        // Send matching comments to popup.js for display
        let commentTexts = filteredComments.map(c => c.innerText);
        chrome.runtime.sendMessage({
            action: "updateResults",
            count: filteredComments.length,
            comments: commentTexts
        });
    } else {
        alert("No comments found with that keyword.");
    }
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchComments") {
        getComments();
        chrome.storage.local.get("comments", (data) => {
            sendResponse({ comments: data.comments || [] });
        });
        return true; // Keeps message channel open for async response
    } else if (request.action === "resetHighlights") {
        resetHighlights();
    } else if (request.action === "filter" && request.keyword) {
        filterComments(request.keyword);
    } else if (request.action === "next") {
        scrollToComment(currentIndex + 1);
    } else if (request.action === "prev") {
        scrollToComment(currentIndex - 1);
    }
});
