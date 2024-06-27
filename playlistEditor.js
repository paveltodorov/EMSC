// import fetch from "node-fetch";
import {countries} from "country-data"
import axios from "axios";
import dotenv from 'dotenv';

let countryMap = new Map();
countries.all.forEach(countryEntry => {
    let country = countryEntry.name;
    if (country == "Russian Federation") country = "Russia";
    else if (country == "Czech Republic") country = "Czechia";
    else if (country == "Turkey") country = "Türkiye";
    else if (country == "Macedonia, The Former Yugoslav Republic Of") country = "North Macedonia";
    countryEntry.name = country; // set if we want to use a different name or the name has changed
    countryMap.set(country, countryEntry);
});

// alpha2:
// 'AT'
// alpha3:
// 'AUT'
// countryCallingCodes:
// (1) ['+43']
// currencies:
// (1) ['EUR']
// emoji:
// '🇦🇹'
// ioc:
// 'AUT'
// languages:
// (1) ['deu']
// name:
// 'Austria'
// status:
// 'assigned'
// [[Prototype]]:
// Object

let parseTitle = (title, videoOwner) => {
    // let regex = /([^-–|]+)[ ]*[-–|][ ]*([\p{Latin}\wЁёА-я ]+).+/;
    let regex = /([^-–|[•]+)[ ]*[-–|[•][ ]*([^-–|()\[•]+).*/;

    let m = title.match(regex);
    if (!m || !m[1] || !m[2]) {
        // assuming the title is the songname
        return {artist: title, song: videoOwner};
    }
    const artist = m[1].slice(-1) == ' ' ? m[1].slice(0, -1) : m[1];
    const song = m[2].slice(-1) == ' ' ? m[2].slice(0, -1) : m[2];
    let parsed = {artist, song};

    return parsed;
}

let parsePlaylistDescription = description => {
    const parts = description.split("\n");
    let regex = /\d+.[ ]*([\w\. ]+).*/;
    const countryList = parts
        .filter(x => x != "" && !x.includes("Running"))
        .map(x => {
            const m = x.match(regex);
            if (!m) return "";

            let countryName = m[1].slice(-1) == ' ' ? m[1].slice(0, -1) : m[1];
            if (countryName == "Utd. Kingdom") return "United Kingdom";

            return countryName;
        })
    return countryList;
}

let constructScorewizEntry = (songData) => {
    const scoreziwEntry = `${songData.artist} (${songData.iocCountryAbbr}) - ${songData.song}`;
    return scoreziwEntry;
}

let updateScoregridParticpants = (gridId, pass, songsData) => {
    // songsData.sort(() => Math.random() - 0.5);
    let body = { sid : gridId, pass : pass };
    songsData.forEach((entry, idx) => {
        body["flag" + (idx + 1)] = songsData[idx].alpha2CountryAbbr;
        body["__flag" + (idx + 1)] = songsData[idx].country;
        body["name" + (idx + 1)] = songsData[idx].scoreziwEntry;
        body["sponsor" + (idx + 1)] = "";
    })
    console.log(body);
    // $.post("https://scorewiz.eu/saveOptions/participants", body)

    // axios.post('https://scorewiz.eu/saveOptions/participants', body, { headers: {
    //     'content-type': 'text/json'
    //   }})
    //     .then((response) => {
    //         console.log(response.status, response.data);
    //     })
    //     .catch((error) => console.log(error));
    // response
}

// $.post("https://scorewiz.eu/saveOptions/participants", body)
async function main() {
    const conf = dotenv.config().parsed;
    const key = conf['GOOGLE_API_TOKEN'];
    const playlistItemsApi = "https://www.googleapis.com/youtube/v3/playlistItems";
    // const playlistId = "PL2X_tHrqOyT3pjbXvov_QPLImsqZHX2gj";
    const playlistId = "PL2X_tHrqOyT3LfDylJohyqgpsC05icQIy"

    const itemsUri = `${playlistItemsApi}?key=${key}&part=snippet&playlistId=${playlistId}&maxResults=50`;
    let html = await axios.get(itemsUri);
    const items = html.data.items;
    const songsData = items
        .map(x => parseTitle(x.snippet.title, x.snippet.videoOwnerChannelTitle));

    const playlistsApi = "https://www.googleapis.com/youtube/v3/playlists";
    const playlistsUri = `${playlistsApi}?key=${key}&id=${playlistId}&part=snippet`;
    const playlistHtml = await axios.get(playlistsUri);
    const playlistDesc = playlistHtml.data.items[0].snippet.localized.description;
    const countryList = parsePlaylistDescription(playlistDesc);

    if (songsData.length != countryList.length) console.log("Songs size is different from country size");
    songsData.forEach((element, idx) => {
        let countryName = countryList[idx];

        element.country = countryName;
        const countyEntry = countryMap.get(countryName);
        if (countyEntry) {
            element.iocCountryAbbr = countyEntry.ioc ? countyEntry.ioc : countyEntry.alpha2;
            element.alpha2CountryAbbr = countyEntry.alpha2.toLowerCase();
        }
        else {
            console.log(`Failed to get abbreviations for ${countryName}`);
            element.iocCountryAbbr = "";
            element.alpha2CountryAbbr = "";
        }
        element.scoreziwEntry = constructScorewizEntry(element);
    });

    // create scoreboard
    // await axios.post("https://scorewiz.eu/register.html", { title: 'Test-9-11-02',
    //     folder: '0:126650',
    //     system: 'classic',
    //     votingMethod: 'rsvp',
    //     rsvpNumber: 50
    // }).then((response) => {
    //     console.log(response);
    //   }, (error) => {
    //     console.log(error);
    //   });
    // // 'PHPSESSID=91pm0e0eu38tthn022k71qoaa3; path=/'
    updateScoregridParticpants(729833, "GEXdjjgD", songsData);

    // songsData;
    // countries;
    // callingCountries
    // countries;
}

// "https://www.googleapis.com/youtube/v3/playlistItems?key=AIzaSyCj8X-CF_yxBNhBaknX4yIbCeDqrBmBoX8&part=snippet&playlistId=PL2X_tHrqOyT12zqFunXhK1mMhXh5nt0sm"
// "https://www.googleapis.com/youtube/v3/playlistItems?key=AIzaSyCj8X-CF_yxBNhBaknX4yIbCeDqrBmBoX8&part=contentDetails&playlistId=PL2X_tHrqOyT12zqFunXhK1mMhXh5nt0sm"

await main();
