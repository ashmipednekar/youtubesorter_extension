const currentUrl = window.location.href;
//const urlParts = currentUrl.split('/');
// index 3 contains the channel @

const channelHandle = currentUrl.split('/')[3];

async function main() {
    const channelData = getChannelData();
}

// makes a request to YouTube's API to fetch channel details given a channel ID
async function getChannelData() {

    // build API url
    const apiUrl = `https://youtube.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${channelHandle}&key=${apiKey}`;

    // await server response
    const response = await fetch(apiUrl); // gets a Response obj

    // await json conversion response
    const data = await response.json(); // converts Response into useable JSON

    console.log(data);
    return data;
} 

main();