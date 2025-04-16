document.addEventListener("DOMContentLoaded", () => {
    let filterBtn = document.getElementById("filterBtn");
    let keywordInput = document.getElementById("keyword");
    let resultsDiv = document.getElementById("results");
    let nextBtn = document.getElementById("nextBtn");
    let prevBtn = document.getElementById("prevBtn");

    function sendMessageToContentScript(action, keyword = null) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) return; // No active tab found
            chrome.tabs.sendMessage(tabs[0].id, { action, keyword });
        });
    }

    filterBtn.addEventListener("click", () => {
        let keyword = keywordInput.value.trim();
        if (!keyword) {
            alert("Please enter a keyword!");
            return;
        }

        // Clear previous results
        resultsDiv.innerHTML = "<p>Searching...</p>";

        // Send keyword to content script for filtering
        sendMessageToContentScript("filter", keyword);
    });

    nextBtn.addEventListener("click", () => sendMessageToContentScript("next"));
    prevBtn.addEventListener("click", () => sendMessageToContentScript("prev"));

    // Listen for updates from content.js
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === "updateResults") {
            resultsDiv.innerHTML = `<p>🔍 Found ${request.count} matching comments:</p>`;
            if (request.comments && request.comments.length) {
                resultsDiv.innerHTML += request.comments
                    .map(c => `<p class="comment-preview">📝 ${c}</p>`)
                    .join("");
            } else {
                resultsDiv.innerHTML += "<p>No comments found.</p>";
            }
        }
    });

    // Request stored comments when popup opens
    chrome.storage.local.get("comments", (data) => {
        if (data.comments && data.comments.length) {
            resultsDiv.innerHTML = `<p>Previously found ${data.comments.length} comments.</p>`;
            resultsDiv.innerHTML += data.comments
                .map(c => `<p class="comment-preview">📝 ${c}</p>`)
                .join("");
        }
    });
});
