// channels.list and request content details (get youtube handle)

// example json:
 /*

{
  "kind": "youtube#channelListResponse",
  "etag": "NIgZt3tsfVthRS1m7mu00F6SEU0",
  "pageInfo": {
    "totalResults": 1,
    "resultsPerPage": 5
  },
  "items": [
    {
      "kind": "youtube#channel",
      "etag": "TzgBSpjqi34O3-u4sntCnIx51m0",
      "id": "UC_x5XG1OV2P6uZZ5FSM9Ttw",
      "snippet": {
        "title": "Google for Developers",
        "description": "Subscribe to join a community of creative developers and learn the latest in Google technology — from AI and cloud, to mobile and web.\n\nExplore more at developers.google.com\n\n",
        "customUrl": "@googledevelopers",
        "publishedAt": "2007-08-23T00:34:43Z",
        "thumbnails": {
          "default": {
            "url": "https://yt3.ggpht.com/2eI1TjX447QZFDe6R32K0V2mjbVMKT5mIfQR-wK5bAsxttS_7qzUDS1ojoSKeSP0NuWd6sl7qQ=s88-c-k-c0x00ffffff-no-rj",
            "width": 88,
            "height": 88
          },
          "medium": {
            "url": "https://yt3.ggpht.com/2eI1TjX447QZFDe6R32K0V2mjbVMKT5mIfQR-wK5bAsxttS_7qzUDS1ojoSKeSP0NuWd6sl7qQ=s240-c-k-c0x00ffffff-no-rj",
            "width": 240,
            "height": 240
          },
          "high": {
            "url": "https://yt3.ggpht.com/2eI1TjX447QZFDe6R32K0V2mjbVMKT5mIfQR-wK5bAsxttS_7qzUDS1ojoSKeSP0NuWd6sl7qQ=s800-c-k-c0x00ffffff-no-rj",
            "width": 800,
            "height": 800
          }
        },
        "localized": {
          "title": "Google for Developers",
          "description": "Subscribe to join a community of creative developers and learn the latest in Google technology — from AI and cloud, to mobile and web.\n\nExplore more at developers.google.com\n\n"
        },
        "country": "US"
      },
      "contentDetails": {
        "relatedPlaylists": {
          "likes": "",
          "uploads": "UU_x5XG1OV2P6uZZ5FSM9Ttw"
        }
      },
      "statistics": {
        "viewCount": "403255089",
        "subscriberCount": "2530000",
        "hiddenSubscriberCount": false,
        "videoCount": "6734"
      }
    }
  ]
}
 */

  async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }

  let tab = getCurrentTab()

  if (tab != undefined) {
    
  }