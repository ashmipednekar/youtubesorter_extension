async function main() {

    try {
        const currentUrl = window.location.href;

        // index 3 contains the channel @
        const channelHandle = currentUrl.split('/')[3];

        // get uploads ID from channel data
        const channelData = await getChannelData(channelHandle);
        const uploadsId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
        //console.log("Uploads ID: " + uploadsId);

        // print out playlist of uploads
        const allVideos = await getUploadedVideos(uploadsId);
        console.log("First video:");
        console.log(JSON.stringify(allVideos[0], null, 2)); // prints first one

        // get list of video IDs and durations (will merge sort later)
        const durations = await getVideoDuration(allVideos);
        console.log(JSON.stringify(durations[0], null, 2)); // prints ID and duration of first

        // sorts in O(nlogn) <3
        durations.sort((a,b) => {
            return a[1] - b[1]; // sorts ascending
        })

        
    }
    catch (error) {
        console.error("error detected: ", error);
    }
}

// makes a request to YouTube's API to fetch channel details given a channel ID
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

// returns a list of all uploaded videos by a youtube channel
async function getUploadedVideos(uploadsId) {
    
    let allVideos = [];
    const baseApiUrl = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=contentDetails%2Csnippet&playlistId=${uploadsId}&key=${apiKey}`;    
    let nextPageToken = undefined;

    do {
        // reseting apiUrl to default
        let apiUrl = baseApiUrl;

        // if nextPageToken exists, add to apiUrl
        if (nextPageToken) {
            apiUrl += `&pageToken=${nextPageToken}`;
        }
        
        //console.log(apiUrl);
        // fetching and parsing video playlist into JSON 
        const response = await fetch(apiUrl);
        const data = await response.json();

        // looping through the paginated data and storing ALL vid data in arr    
        for (const video of data.items) {
            allVideos.push(video);
        }

        // update nextPageToken
        nextPageToken = data.nextPageToken;

    } while (nextPageToken)

    return allVideos;
}

async function getVideoDuration(allVideos) {
    let ids = [];
    let durations = [];
    let curIdBatch = [];
    //fetch req: `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&id=Ks-_Mh1QhMc%2Cc0KYU2j0TM4%2CeIho2S0ZahI&key=[YOUR_API_KEY]`
    
    // store all ids
    for (i = 0; i < allVideos.length; i++) {
        const id = allVideos[i].snippet.resourceId.videoId;
        ids.push(id);
    }

    // make requests, send the batch and update duration count
    for (i = 0; i < ids.length; i+=50) {
        let apiBatchString = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&id=`;
        let endcheck = Math.min(ids.length, i+50);
        //console.log(endcheck);
        ids_subset = ids.slice(i, endcheck);
        const idString = ids_subset.join(`%2C`);

        apiBatchString += `${idString}&key=${apiKey}`;

        //console.log(JSON.stringify(apiBatchString, null, 2));
        
        // make request
        const request = await fetch(apiBatchString);
        const data = await request.json();
        console.log(JSON.stringify(data.items[0], null, 2));
        console.log(JSON.stringify(data.items[0].contentDetails.duration, null, 2));

        // get duration data and store inside durations

        for (k = i; k < endcheck; k++) {
            //id, duration
            if (ids[k] != data.items[k-i].id) {
                throw new Error("something wrong in order of ID parsing and video/duration parsing");
            }

            const ISO_duration = data.items[k-i].contentDetails.duration;
            //console.log("checking");
            //console.log(ISO_duration);
            const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/; // using regex to parse
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

main();