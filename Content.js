// Global cache to store data
let cachedDurations = null;
let cachedChannelHandle = "";

// This is our new helper function to create a styled button

function createSortChip(text, onClick) {
    const chipBar = document.getElementById('chips');
    if (!chipBar) return null; // Exit if the bar isn't there

    // 1. Find the first chip inside the bar to use as a template
    const chipTemplate = chipBar.querySelector('yt-chip-cloud-chip-renderer');
    if (!chipTemplate) return null; // Exit if no template is found

    // 2. Create a deep copy
    const newChip = chipTemplate.cloneNode(true);

    // 3. Find the inner div that holds the text
    const textElement = newChip.querySelector('.ytChipShapeChip');

    if (textElement) {
        // 4. Change the text
        textElement.textContent = text;
        // 5. Change the classes to make it look "unselected"
        textElement.classList.remove('ytChipShapeActive');
        textElement.classList.add('ytChipShapeInactive');
    }

    // 6. Add the click listener
    newChip.addEventListener('click', onClick);
    return newChip;

}

function onStart() {
    const chipBar = document.getElementById('chips');
    if (!chipBar) {
        console.log("Button bar not found, skipping.");
        return;
    }

    const shortestChip = createSortChip('Shortest', (event) => handleSortClick('shortest', event));
    const longestChip = createSortChip('Longest', (event) => handleSortClick('longest', event));

    if (shortestChip && longestChip) {
        chipBar.appendChild(shortestChip);
        chipBar.appendChild(longestChip);
    }
}

async function handleSortClick(sortType, event) {

    // update the button highlighting
    // 1. Get the button bar
    const chipBar = document.getElementById('chips');
    if (!chipBar) return;

    // 2. De-select ALL buttons (including YouTube's)

    const allChipTextElements = chipBar.querySelectorAll('.ytChipShapeChip');

    allChipTextElements.forEach(el => {
        el.classList.remove('ytChipShapeActive');
        el.classList.add('ytChipShapeInactive');
    });


    // 3. Select the button that was just clicked
    // 'event.currentTarget' is the <yt-chip-cloud-chip-renderer> that was clicked

    const clickedChipText = event.currentTarget.querySelector('.ytChipShapeChip');

    if (clickedChipText) {
        clickedChipText.classList.add('ytChipShapeActive');
        clickedChipText.classList.remove('ytChipShapeInactive');
    }

    const currentUrl = window.location.href;

    // index 3 contains the channel @
    const channelHandle = currentUrl.split('/')[3];
    let durations = null;

    // check if the API needs doesnt need to run all the API calls to fetch the duration info
    // (already been cached for the correct channel

    if (cachedChannelHandle == channelHandle && cachedDurations != null) {
        durations = cachedDurations;
    }

    else {
        cachedChannelHandle = channelHandle;
        durations = await main();
        cachedDurations = durations;
    }

    // chooses sort order based on sortType
    // sorts durations in O(nlogn) <3

    if (sortType == 'shortest') { // ASCENDING, SHORTEST FIRST
        durations.sort((a,b) => {
            return a[1] - b[1];
            })
    }


    else { // DESCENDING, LONGEST FIRS
        durations.sort((a,b) => {
            return b[1] - a[1];

        })
    }


    // print sorted durations along w/ ids
    /*
    durations.forEach(function(element) {
        console.log(JSON.stringify(element, null, 2))
    });
    */
    console.log("Finished sorting.");

    // use the id-duration & manipulate DOM to show new order
    displaySortedPage(durations);
    console.log("Display Updated.");

}



async function main() {

/*  
    process:
    url -> channel @
    channel @ -> getChannelData() -> get channel meta data -> "channel uploads" playlist id
    uploads id -> getUploadedVideos() -> get list of all videos in uploads folder

    allVideos [list] -> getVideoDuration() -> get list of all [id, durations] of videos in allVideos called "durations" AND
                                        -> populates a hash table with key = videoId, value = viewCounts for rendering

    sort durations w/ built in sort function, and then makes a hash map out of the 2D array
    render in displaySortedPage
    */

try {

    const currentUrl = window.location.href;

    // index 3 contains the channel @
    const channelHandle = currentUrl.split('/')[3];

    // get uploads ID from channel data

    const channelData = await getChannelData(channelHandle);
    const uploadsId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
    console.log("Uploads ID: " + uploadsId);

    // print out playlist of uploads
    const allVideos = await getUploadedVideos(uploadsId);
    console.log("Total videos fetched: ", allVideos.length);
    //console.log("First video:");
    //console.log(JSON.stringify(allVideos[0], null, 2)); // prints first one
    // get list of video IDs and durations
    const durations = await getVideoDuration(allVideos);
    console.log("Durations array length:", durations.length);

    // return back to handleSortClick
    return durations;
}

catch (error) {
    console.error("error detected: ", error);
}

}

/*
    Makes a request to YouTube's API to fetch channel details given a channel ID
    (retrieved from the current URL)
*/ 
async function getChannelData(channelHandle) {

    // build API url
    const apiUrl = `https://youtube.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${channelHandle}&key=${apiKey}`;

    // await server response
    const response = await fetch(apiUrl); // gets a Response obj

    // await json conversion response
    const data = await response.json(); // converts Response into useable JSON

    //console.log(JSON.stringify(data, null, 2));
    return data;
}

/*
    Returns a list of all uploaded videos by a youtube channel
    given the playlist id of their uploads
*/
async function getUploadedVideos(uploadsId) {
    
    let allVideos = [];
    const baseApiUrl = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=contentDetails%2Csnippet&playlistId=${uploadsId}&key=${apiKey}`;    
    let nextPageToken = undefined;

    do {
        // reseting apiUrl to default
        let apiUrl = baseApiUrl;

        // if nextPageToken exists, add to apiUrl for query
        if (nextPageToken) {
            apiUrl += `&pageToken=${nextPageToken}`;
        }
        
        //console.log(apiUrl);
        // fetching and parsing video playlist into JSON 
        const response = await fetchWithRetry(apiUrl);
        const data = await response.json();

        // looping through the paginated data (all vids on a page) and storing ALL vid data in arr    
        for (const video of data.items) {
            allVideos.push(video); 
        }

        // update nextPageToken
        nextPageToken = data.nextPageToken;

    } while (nextPageToken) // stops when null

    return allVideos;
}

/*
    Returns a list of video lengths (in seconds) for a given list of videos
    Also populates a hash table with key = video id, value = video duration
*/
async function getVideoDuration(allVideos) {
    let ids = [];
    let durations = [];
    //fetch req: `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&id=Ks-_Mh1QhMc%2Cc0KYU2j0TM4%2CeIho2S0ZahI&key=[YOUR_API_KEY]`
    
    // store all ids
    for (let j = 0; j < allVideos.length; j++) {
        const id = allVideos[j].snippet.resourceId.videoId;
        ids.push(id);
    }

    // make requests, send a batch of requests and update duration count
    for (let i = 0; i < ids.length; i+=50) {
        let apiBatchString = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&id=`;
        let endcheck = Math.min(ids.length, i+50);
        //console.log(endcheck);
        let ids_subset = ids.slice(i, endcheck);
        const idString = ids_subset.join(`%2C`);

        apiBatchString += `${idString}&key=${apiKey}`;

        //console.log(JSON.stringify(apiBatchString, null, 2));
        
        // make request
        const request = await fetchWithRetry(apiBatchString);
        const data = await request.json();
        //console.log(JSON.stringify(data.items[0], null, 2));
        //console.log(JSON.stringify(data.items[0].contentDetails.duration, null, 2));

        // get duration data and store inside durations

        for (let k = i; k < endcheck; k++) {
            //id, duration
            if (ids[k] != data.items[k-i].id) {
                throw new Error("something wrong in order of ID parsing and video/duration parsing");
            }

            const ISO_duration = data.items[k-i].contentDetails.duration;
            //console.log("checking");
            //console.log(ISO_duration);
            const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/; // using regex to parse duration info
            const time_arr = ISO_duration.match(regex);

            // storing duration in seconds
            // For "PT1H2M3S", matches will be: ["PT1H2M3S", "1", "2", "3"]
            // For "PT21M3S",  matches will be: ["PT21M3S", undefined, "21", "3"]

            const hours = (parseInt(time_arr[1]) || 0);
            const minutes = (parseInt(time_arr[2]) || 0);
            const seconds = (parseInt(time_arr[3]) || 0);
            const duration = 3600 * hours + 60 * minutes + seconds;

            //console.log(ids[k] + " " + duration);
            durations.push([ids[k], duration]);
        }
    }

    return durations;
}

/*
    Given the correct sorted, order of videoIDs, will reorder the elements on the
    YT video page to match the sorted order!
*/

function displaySortedPage(sortedDurations) {
    // get the container
    const container = document.getElementById("contents");

    if (!container) {
        console.error("no container found");
    }

    // taking first video
    const templateVideo = container.querySelector('ytd-rich-item-renderer');

    if (!templateVideo) {
        // means there are no videos, can skip rendering entirely
        return;
    }

    // make a Map storing video IDs and elements in the page (display for video chunk)
    let videoElementMap = new Map();
    const videoElements = container.querySelectorAll('ytd-rich-item-renderer');

    for (const element of videoElements) {
        // 1. Find the title link inside the element
        const titleLink = element.querySelector('#video-title-link');
        
        if (titleLink) {
            // 2. Get its 'href' attribute (which looks like "/watch?v=ABC123...")
            const href = titleLink.getAttribute('href');
            
            // 3. We can parse that 'href' to get just the video ID
            const videoId = new URLSearchParams(href.split('?')[1]).get('v');
            
            // 4. Now we have the key and value to build our map
            videoElementMap.set(videoId, element);
        }
    }

    // rendering the videos in the sorted allVideos
    for (const item of sortedDurations) {
        let videoId = item[0];
        const elementToMove = videoElementMap.get(videoId);
        if (elementToMove) {
            container.appendChild(elementToMove);
        }
    }
}

// This function will try to fetch a URL.
// If it fails, it will wait and try again (up to 3 times).
async function fetchWithRetry(url, retries = 3, delay = 1000) {
    try {
        // Try to fetch
        return await fetch(url);
    } catch (error) {
        // If we still have retries left...
        if (retries > 0) {
            console.log(`Fetch failed, retrying in ${delay}ms...`);
            // Wait for the delay
            await new Promise(resolve => setTimeout(resolve, delay));
            // Try again, with one less retry and a longer delay
            return fetchWithRetry(url, retries - 1, delay * 2);
        } else {
            // No more retries, give up and throw the error
            console.error("Max retries reached. Fetch failed.");
            throw error;
        }
    }
}

// Listen for YouTube's navigation event
document.addEventListener('yt-navigate-finish', () => {

    // This fires every time you click a link (e.g., Home -> Videos)
    if (window.location.href.match(/@.*\/videos$/)) {
        onStart();  
    }
    });

// And run it once in case the user lands directly on the /videos page
if (window.location.href.match(/@.*\/videos$/)) {
    onStart();
}

/*
// This function checks if we're on the right page and if the buttons need to be added
function checkAndRun() {
    if (window.location.href.match(/@.*\/videos$/)) {
        // Make sure our styles are on the page
        injectStyles();
        // Run onStart() to check if buttons need to be added
        onStart();
        // Start watching the grid for resizes/rebuilds
        observeGrid();
    }
}

// Create an observer to watch for page navigation
const navObserver = new MutationObserver(() => {
    checkAndRun();
});

// Start observing the main <body> for when child elements are added or removed
navObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// --- NEW OBSERVER FOR GRID RESIZE ---
const gridObserver = new MutationObserver((mutations) => {
    // We only care if nodes were added to the grid
    if (mutations.some(m => m.addedNodes.length > 0)) {
        // If our sort is active, re-apply it
        if ((currentActiveSort === 'shortest' || currentActiveSort === 'longest') && cachedDurations) {
            console.log('Grid rebuilt, re-applying sort...');
            // We must re-sort the cache in case the user changed sort order
            if (currentActiveSort === 'shortest') {
                cachedDurations.sort((a, b) => a[1] - b[1]);
            } else {
                cachedDurations.sort((a, b) => b[1] - a[1]);
            }
            displaySortedPage(cachedDurations);
        }
    }
});

// We need a function to start this observer, because 'contents' might not exist on page load
function observeGrid() {
    // First, stop observing to avoid duplicates
    gridObserver.disconnect();
    
    const grid = document.getElementById('contents');
    if (grid) {
        gridObserver.observe(grid, { childList: true });
    }
}

// Injects our custom CSS for the loading effect
function injectStyles() {
    // Check if the style is already injected
    if (document.getElementById('video-sorter-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'video-sorter-styles';
    
    // This CSS will dim the video grid when we add the 'videos-loading' class
    style.textContent = `
        #contents.videos-loading {
            opacity: 0.5;
            pointer-events: none;
            transition: opacity 0.2s ease-in-out;
        }
    `;
    
    document.head.appendChild(style);
}

*/
