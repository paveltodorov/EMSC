const fileName = "EMSC STATISTICS UPDATED.xlsx"

// var cheerio = require('cheerio');
// const jsonToTable = require("json-excel-style")
import xlsxPkg from 'xlsx';
const { readFile, utils } = xlsxPkg;
import axios from "axios"
import xlsx from "json-as-xlsx";
import { name } from 'country-emoji';
import { scoreGridData } from './ScoreGrids.js';
import fetch from "node-fetch";

let countryName = (abbr) => {
    if (abbr == 'uk') return 'United Kingdom';
    if (abbr == 'mr') return "Morocco";
    if (abbr == 'ru') return "Russia";
    if (abbr == 'tr') return "Türkiye";
    if (abbr == 'gg') return "Georgia";
    if (abbr == 'md') return "Moldova";
    if (abbr == 'nn') return "North Macedonia";
    return name(abbr);
}

let numberToEditionName = edNum => {
    const year = Math.floor(edNum / 5) + 21;
    const edInYear = edNum % 5;
    const edName = year + "0" + edInYear;
    return edName;
}

let getServerData = async link => {
    // const finalJuryHtml = await axios.get(link);
    const html = await axios.request({
        method: 'GET',
        url: link,
        responseType: 'json',
        reponseEncoding: 'utf-8'
    });

    const finalJuryHtmlData = html.data;
    const start = finalJuryHtmlData.search('{"wiz"');
    const end = finalJuryHtmlData.search('`;');
    const serverString = decodeURI(finalJuryHtmlData.substring(start, end).replace(/\\\\u/g, "\\u")).replaceAll('\\\\"', '');
    const serverData = JSON.parse(serverString);
    return serverData;
}

// let login  = asy
let getLinks = edition => {
    const edName = numberToEditionName(edition);
    const grids = scoreGridData[0].contents;

    const edGrids = grids.filter(x => x.title.includes(edName));

    const finalLink = edGrids.find(x => {
        const title = x.title.toLowerCase();
        return title.includes("final") && !title.includes("tele");
    }).data.menu.view;
    const teleLink = edGrids.find(x => {
        const title = x.title.toLowerCase();
        return title.includes("final") && title.includes("tele");
    }).data.menu.view;
    const semi1Link = edGrids.find(x => {
        const title = x.title.toLowerCase();
        return title.includes("semi final 1");
    }).data.menu.view;
    const semi2Link = edGrids.find(x => {
        const title = x.title.toLowerCase();
        return title.includes("semi final 2");
    }).data.menu.view;

    const links = {finalLink, teleLink, semi1Link, semi2Link}
    return links;
}

let getEntryData = p => {
    const regex = /(.+) \((\w+)\) - (.+)/
    const m = p[1].name.match(regex);
    const country = countryName(p[1].flag);

    if (!m) {
        console.log("Failed to get entry");
    }
    const entryData = {country, artist: m[1], song : m[3]};

    return entryData;
}
let fillEntryDataSemi = (stats, p, idx, sf) => {
    const entry = getEntryData(p);
    stats.set(entry.country, {
        edition: "",
        name: "",
        country : entry.country,
        artist: entry.artist,
        song : entry.song,
        sf : sf,
        placeFinal : 0,
        scoreFinal: 0,
        placeSemi : 0,
        scoreSemi: 0,
        hod : "",
        hodShortName: "",
        juryScore : 0,
        teleScore : 0,
        runningSemi: idx + 1,
        runningFinal : "",
        isFinalist : "",
        numOfIndivVotesFinal : "",
        numOfIndivVotesSemi : "",
        isDqFinal : false,
        isDqSemi : false,
        finalPointsFrom : [],
        semiPointsFrom : []
    });
}

let fillEntryDataFinal = (stats, p, idx) => {
    const entry = getEntryData(p);

    if (!stats.has(entry.country)) {
        // add automatic qualifier
        stats.set(entry.country, {
            edition: "",
            name: "",
            country : entry.country,
            artist: entry.artist,
            song : entry.song,
            sf : "F",
            placeFinal : 0,
            scoreFinal: 0,
            placeSemi : "",
            scoreSemi: "",
            hod : "",
            hodShortName: "",
            juryScore : 0,
            teleScore : 0,
            runningSemi: "",
            runningFinal : idx + 1,
            isFinalist : true,
            numOfIndivVotesFinal : "",
            numOfIndivVotesSemi : "",
            isDqFinal : false,
            isDqSemi : false,
            finalPointsFrom : [],
            semiPointsFrom : []
        });
    }
    else {
        stats.get(entry.country).runningFinal = idx + 1;
    }
}

let getHods = () => {
    const hodFileName = "EMSC-HoD-Country-Ranking.xlsx";
    const workbook = readFile(hodFileName);
    let workbook_sheet = workbook.SheetNames;

    let hodStats = utils.sheet_to_json(
        workbook.Sheets[workbook_sheet[0]]
    );

    let hods = [];
    hodStats.forEach(row => {
        if (row.__EMPTY_5) hods.push(row.__EMPTY_5);
    });

    return hods;
}

let getHodFullName = (shortName, hods) => {
    if (shortName == "") return "???";
    if (shortName == "Michael") return "Michalis Terzis";
    if (shortName == "The Lady Cru") return "Keiron Lynch";

    shortName = shortName.replace(".", "");
    let splitNames = shortName.split(" ");

    let potentialFullName = hods.find(fullName => fullName.startsWith(shortName));
    if (potentialFullName) return potentialFullName;

    let serachSplitName = (splitName) => hods.find(fullName => fullName.startsWith(splitName));

    if (splitNames[0]) potentialFullName = serachSplitName(splitNames[0]);
    if (potentialFullName) return potentialFullName;

    if (splitNames[2]) potentialFullName = serachSplitName(splitNames[2]);
    if (potentialFullName) return potentialFullName;

    if (splitNames[1]) potentialFullName = serachSplitName(splitNames[1]);
    if (potentialFullName) return potentialFullName;

    return "??? " + shortName;
}


async function calculateEditionStats(edition) {
    const hods = getHods();
    const links = getLinks(edition);

    const serverData = await getServerData(links.finalLink);
    const teleServerData = await getServerData(links.teleLink);
    const semi1ServerData = await getServerData(links.semi1Link);
    const semi2ServerData = await getServerData(links.semi2Link);

    let stats = new Map();
    const edRegex = /[EMSC ]+(\d\d)(\d\d) - GRAND FINAL/;
    const match = serverData.wiz.title.match(edRegex);
    let editionName = "EMSC " + match[1] + match[2];

    Object.entries(semi1ServerData.participants).forEach((p, idx) => fillEntryDataSemi(stats, p, idx, 1));
    Object.entries(semi2ServerData.participants).forEach((p, idx) => fillEntryDataSemi(stats, p, idx, 2));
    Object.entries(serverData.participants).forEach((p, idx) => fillEntryDataFinal(stats, p, idx, 2));

    // calculate semi points
    let calculateSemiPoints = (juror, data) => {
        const jurorCountry = countryName(juror[1].flag);
        stats.get(jurorCountry).hodShortName = juror[1].name;

        juror[1].votes.forEach((ptsAndSong) => {
            const participant = data.participants[ptsAndSong[1]];
            const flag = participant.flag;
            const country = countryName(flag);
            stats.get(country).scoreSemi += ptsAndSong[0];
            stats.get(country).semiPointsFrom.push({points: ptsAndSong[0], hodShortName: juror[1].name, country: jurorCountry});
        });

        if (data.televote) {
            data.televote.forEach(ptsAndSong => {
                const participant = data.participants[ptsAndSong[1]];
                const flag = participant.flag;
                const country = countryName(flag);
                stats.get(country).isDqSemi = true;
            })
        }
    }
    Object.entries(semi1ServerData.juries).forEach(juror => calculateSemiPoints(juror, semi1ServerData));
    Object.entries(semi2ServerData.juries).forEach(juror => calculateSemiPoints(juror, semi2ServerData));

    let fillSfPlaces = sf => [...stats.entries()]
    .filter(x => x[1].sf == sf )
    .sort((x,y) => {
        if (x[1].isDqSemi) return 1;
        if (y[1].isDqSemi) return -1;
        if (y[1].scoreSemi != x[1].scoreSemi) return y[1].scoreSemi - x[1].scoreSemi;
        if (y[1].semiPointsFrom.length != x[1].semiPointsFrom.length) return y[1].semiPointsFrom.length - x[1].semiPointsFrom.length;

        let ptsDiff = (x,y,pts) => y[1].semiPointsFrom.filter(z => z.points == pts).length - x[1].semiPointsFrom.filter(z => z.points == pts).length;
        let ptsSystem = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

        for (let i = 0; i < ptsSystem.length; i++) {
            const diff = ptsDiff(x,y,ptsSystem[i]);
            console.log("Deciding by tiebreaker rule by # of " + ptsSystem[i] + " pts, countries : " + x[1].country + " " + y[1].country)
            if (diff) return diff;
        }

        console.log("Add a tie braking rule");
        return 0;
    })
    .forEach((x,idx) => {
        x[1].placeSemi = idx + 1;
        const isFinalist = (idx + 1 <= 12) ? true : false;
        x[1].isFinalist = isFinalist;
        if (!isFinalist) {
            x[1].juryScore = '';
            x[1].teleScore = '';
            x[1].scoreFinal = '';
            x[1].placeFinal = '';
        }
    })

    fillSfPlaces(1);
    fillSfPlaces(2);

    // calculate final points
    Object.entries(serverData.juries).forEach(juror => {
        const jurorCountry = countryName(juror[1].flag);
        stats.get(jurorCountry).hodShortName = juror[1].name; // needed only for the automatic qualifier

        juror[1].votes.forEach((ptsAndSong) => {
            const participant = serverData.participants[ptsAndSong[1]];
            const flag = participant.flag;
            const country = countryName(flag);
            stats.get(country).juryScore += ptsAndSong[0];
            stats.get(country).scoreFinal += ptsAndSong[0];
            stats.get(country).finalPointsFrom.push({points: ptsAndSong[0], hodShortName: juror[1].name, country: jurorCountry});
        });

        serverData.televote.forEach(ptsAndSong => {
            if (ptsAndSong[0] >= 0) return;
            const participant = serverData.participants[ptsAndSong[1]];
            const flag = participant.flag;
            const country = countryName(flag);
            stats.get(country).isDqFinal = true;
        });
    });

    Object.entries(teleServerData.juries).forEach(juror => {
        const jurorCountry = countryName(juror[1].flag);
        juror[1].votes.forEach((ptsAndSong) => {
            const participant = teleServerData.participants[ptsAndSong[1]];
            const flag = participant.flag;
            const country = countryName(flag);
            stats.get(country).teleScore += ptsAndSong[0];
            stats.get(country).scoreFinal += ptsAndSong[0];
            stats.get(country).finalPointsFrom.push({points: ptsAndSong[0], hodShortName: juror[1].name, country: jurorCountry});
        });
    });

    [...stats.entries()]
    .filter(x => x[1].isFinalist)
    .sort((x,y) => {
        if (x[1].isDqFinal) return -1;
        if (y[1].isDqFinal) return 1;
        if (y[1].scoreFinal != x[1].scoreFinal) return y[1].scoreFinal - x[1].scoreFinal;
        if (y[1].finalPointsFrom.length != x[1].finalPointsFrom.length) return y[1].finalPointsFrom.length - x[1].finalPointsFrom.length;

        let ptsDiff = (x,y,pts) => y[1].finalPointsFrom.filter(z.points == pts).length - x[1].finalPointsFrom.filter(z.points == pts).length;
        let ptsSystem = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

        for (let i = 0; i < ptsSystem.size; i++) {
            const diff = ptsDiff(x,y,ptsSystem[i]);
                console.log("Deciding by tiebreaker rule by # of " + ptsSystem[i] + " pts, countries : " + x[1].country + " " + y[1].country)
                if (diff) return diff;
            }

            console.log("Add a tie braking rule");
            return 0;
        })
        .forEach((x,idx) => x[1].placeFinal = idx + 1);

        let statsForExcel = [...stats.entries()]
        .map(x => {
            x[1].edition = edition;
            x[1].name = editionName;
            x[1].hod = getHodFullName(x[1].hodShortName, hods);
            if (x[1].isFinalist) x[1].numOfIndivVotesFinal = x[1].finalPointsFrom.length;
            if (x[1].sf != 'F') x[1].numOfIndivVotesSemi = x[1].semiPointsFrom.length;
            if (x[1].isDqSemi) x[1].placeSemi = "DISQUALIFIED";
            if (x[1].isDqFinal) x[1].placeFinal = "DISQUALIFIED";
            return x[1];
        })
        .sort((x,y) => {
            if (x.isFinalist && y.isFinalist) return x.placeFinal - y.placeFinal;
            if (x.isFinalist) return -1;
            if (y.isFinalist) return +1;
            if (x.sf != y.sf) return x.sf - y.sf;
            return x.placeSemi - y.placeSemi;
        });

        return statsForExcel;
    }

async function main() {
    let allEditionsData = [];

    let editionsToCalculate = [/*5, 6, 7,*/ 9, 10, 11, 12, 13, 14];
    for (let i = 0; i < editionsToCalculate.length; i++) {
        let edData = await calculateEditionStats(editionsToCalculate[i]);
        allEditionsData.push(...edData);
    }
    // editionsToCalculate.map(await e => {
    //     let edData = await calculateEditionStats(e);
    //     allEditionsData.push(...edData);
    // })
    const statsForExcelKeys = Object.keys(allEditionsData[0]).map(x => {
        let obj = {};
        obj.label = x.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        obj.value = x;
        return obj;
    });

    // await axios.get("https://scorewiz.eu/logout");

    let data = [
        {
            sheet: "Statistics",
            columns: statsForExcelKeys,
            content: allEditionsData,
        },
    ];

    let settings = {
        fileName: "EMSC Stats Test 5", // Name of the resulting spreadsheet
        extraLength: 1, // A bigger number means that columns will be wider
        writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
        writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
        RTL: false, // Display the columns from right-to-left (the default value is false)
    }

    xlsx(data, settings)
}

main();

 // $.getJSON('ScoreGrids.json', function(json) {
    //     console.log(json); // this will show the info it in firebug console
    // });
    // fetch('../ScoreGrids.json')
    // .then((response) => response.json())
    // .then((json) => console.log(json));
    // PHPSESSID=6qt4qhkfop24sp0q3k343ad947; _gid=GA1.2.1292894849.1698074111;
    // userid=NONE; hash=NONE; _gat_gtag_UA_110571612_1=1; _ga_HGGEH7V61S=GS1.1.1698080348.50.1.1698083971.0.0.0; _ga=GA1.1.100058024.1666286758

    // const promise = await axios.request({
    //     method: 'POST',
    //     url: 'https://scorewiz.eu/login',
    //     responseType: 'json',
    //     reponseEncoding: 'utf-8',
    //     // data: { email: "lutz.bleckmann@netlog.de", password: "1.FCKoeln:"}
    //     data: { email: "pavel.todorov93@gmail.com", pass: "u!h6i2pBg4Qptn8"}
    // });

    // let promise = await axios.post("https://scorewiz.eu/login", { email: "pavel.todorov93@gmail.com", pass: "u!h6i2pBg4Qptn8"} )

    // // const html = await axios.get("https://scorewiz.eu/my/scoreboards");
    // // headers: {
    // //     Cookie: "cookie1=value; cookie2=value; cookie3=value;"
    // // }
    // const html = await axios.request({
    //     method: 'GET',
    //     url: "https://scorewiz.eu/my/scoreboards",
    //     responseType: 'json',
    //     reponseEncoding: 'utf-8',
    //     headers: {
    //         Cookie: "PHPSESSID=6qt4qhkfop24sp0q3k343ad947; _gid=GA1.2.1292894849.1698074111; userid=NONE; hash=NONE; _gat_gtag_UA_110571612_1=1; _ga_HGGEH7V61S=GS1.1.1698080348.50.1.1698086659.0.0.0; _ga=GA1.1.100058024.1666286758;"
    //     }
    // });
    // const htmlData = html.data;
    // const start = htmlData.search('{"uniqId"');
    // const end = htmlData.search('}\\];');
    // const serverString = htmlData.substring(start, end);//.replace(/\\\\u/g, "\\u")).replaceAll('\\\\"', '');
    // const serverData = JSON.parse(serverString);
    // return serverData;