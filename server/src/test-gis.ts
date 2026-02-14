
// @ts-ignore
import gis from 'g-i-s';

async function test() {
    try {
        console.log("Searching for 'India mountains' with g-i-s...");
        gis('India mountains', (error: any, results: any[]) => {
            if (error) {
                console.error("Search failed:", error);
            } else {
                console.log("Results found:", results.length);
                if (results.length > 0) {
                    console.log("First image:", results[0]);
                }
            }
        });
    } catch (error) {
        console.error("Test error:", error);
    }
}

test();
