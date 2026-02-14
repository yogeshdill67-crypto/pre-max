
// @ts-ignore
import { searchImages } from 'duck-duck-scrape';

async function test() {
    try {
        console.log("Searching for 'India mountains' (no options)...");
        const response = await searchImages("India mountains");
        console.log("Results found:", response.results.length);
        if (response.results.length > 0) {
            console.log("First image:", response.results[0].title);
        }
    } catch (error) {
        console.error("Search failed:", error);
    }
}

test();
