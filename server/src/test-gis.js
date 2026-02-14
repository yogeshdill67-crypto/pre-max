
const gis = require('g-i-s');

console.log("Searching for 'India mountains' with g-i-s (node)...");
gis('India mountains', (error, results) => {
    if (error) {
        console.error("Search failed:", error);
    } else {
        console.log("Results found:", results ? results.length : 0);
        if (results && results.length > 0) {
            console.log("First image:", results[0]);
        }
    }
});
