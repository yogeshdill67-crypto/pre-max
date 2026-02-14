
import { image_search } from 'duck-duck-scrape';

async function test() {
    try {
        console.log("Searching for images...");
        const results = await image_search({ query: "India mountains", moderate: true });
        console.log("Results found:", results.length);
        if (results.length > 0) {
            console.log("First image:", results[0]);
        }
    } catch (error) {
        console.error("Search failed:", error);
    }
}

test();
