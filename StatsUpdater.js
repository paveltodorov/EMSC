const fileName = "EMSC STATISTICS UPDATED.xlsx"

const xlsx = require('xlsx');
// const jsonToTable = require("json-excel-style")
const jsonToTable = require("json-as-xlsx")
const axios = require("axios");
var cheerio = require('cheerio');
const {name} = require('country-emoji');

// table with id sheet
// div id = "full ranking"

let countryName = (abbr) => {
    if (abbr == 'uk') return 'United Kingdom';
    if (abbr == 'mr') return "Morocco";
    if (abbr == 'ru') return "Russia";
    if (abbr == 'tr') return "Türkiye";
    if (abbr == 'gg') return "Georgia";
    if (abbr == 'md') return "Moldova";
    return name(abbr);
}

let getServerData = async link => {
    // const finalJuryHtml = await axios.get(link);
    const finalJuryHtml = await axios.request({
        method: 'GET',
        url: link,
        responseType: 'json',
        reponseEncoding: 'utf-8'
    });

    const finalJuryHtmlData = finalJuryHtml.data;
    const start = finalJuryHtmlData.search('{"wiz"');
    const end = finalJuryHtmlData.search('`;');
    const serverString = finalJuryHtmlData.substring(start, end).replaceAll('\\\\"', '');
    const serverData = JSON.parse(serverString);
    return serverData;
}

let getEntryData = p => {
    const regex = /([\w\d?¿'!¡\\/&., ]+) \((\w\w\w)\) - ([\w\d?¿'!¡\\//&., ]+)/
    const m = p[1].name.match(regex);
    const country = countryName(p[1].flag);

    return {country, artist: m[1], song : m[3]};
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
        hod: "",
        juryScore : 0,
        teleScore : 0,
        runningSemi: idx + 1,
        runningFinal : "",
        isFinalist : "",
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
            hod: "",
            juryScore : 0,
            teleScore : 0,
            runningSemi: "",
            runningFinal : idx + 1,
            isFinalist : true,
            finalPointsFrom : [],
            semiPointsFrom : []
        });
    }
    else {
        stats.get(entry.country).runningFinal = idx + 1;
    }
}


async function main() {
    // console.log(finalJuryHtml);
    // const $ = cheerio.load(finalJuryHtml.data)

    // Final - Jury
    const serverData = await getServerData("https://scorewiz.eu/scoreboard/sheet/664031/emsc-2304---grand-final/PsSWRDPW");
    const teleServerData = await getServerData("https://scorewiz.eu/scoreboard/sheet/664032/emsc-2304---grand-final---televote/DF2MBQ8n");
    const semi1ServerData = await getServerData("https://scorewiz.eu/scoreboard/sheet/662125/emsc2304---semi-final-1");
    const semi2ServerData = await getServerData("https://scorewiz.eu/scoreboard/sheet/662782/emsc2304---semi-final-2");

    let stats = new Map();
    const edRegex = /[EMSC ]+(\d\d)(\d\d) - GRAND FINAL/;
    const match = serverData.wiz.title.match(edRegex);
    let editionName = "EMSC" + match[1] + match[2];
    let edition = (parseInt(match[1])- 21) * 5 + parseInt(match[2]);

    Object.entries(semi1ServerData.participants).forEach((p, idx) => fillEntryDataSemi(stats, p, idx, 1));
    Object.entries(semi2ServerData.participants).forEach((p, idx) => fillEntryDataSemi(stats, p, idx, 2));
    Object.entries(serverData.participants).forEach((p, idx) => fillEntryDataFinal(stats, p, idx, 2));

    // calculate semi points
    let calculateSemiPoints = (juror, data) => {
        const jurorCountry = countryName(juror[1].flag);
        stats.get(jurorCountry).hod = juror[1].name;

        juror[1].votes.forEach((ptsAndSong) => {
            const participant = data.participants[ptsAndSong[1]];
            const flag = participant.flag;
            const country = countryName(flag);
            stats.get(country).scoreSemi += ptsAndSong[0];
            stats.get(country).semiPointsFrom.push({points: ptsAndSong[0], hod: juror[1].name, country: jurorCountry});
        });
    }
    Object.entries(semi1ServerData.juries).forEach(juror => calculateSemiPoints(juror, semi1ServerData));
    Object.entries(semi2ServerData.juries).forEach(juror => calculateSemiPoints(juror, semi2ServerData));

    let fillSfPlaces = sf => [...stats.entries()]
        .filter(x => x[1].sf == sf )
        .sort((x,y) => {
            if (y[1].scoreSemi != x[1].scoreSemi) return y[1].scoreSemi - x[1].scoreSemi;
            if (y[1].semiPointsFrom.length != x[1].semiPointsFrom.length) return y[1].semiPointsFrom.length != x[1].semiPointsFrom.length;

            let ptsDiff = (x,y,pts) => y[1].semiPointsFrom.filter(z.points == pts).length - x[1].semiPointsFrom.filter(z.points == pts).length;
            const diff12 = ptsDiff(x,y,12);
            if (diff12) return diff12;

            const diff10 = ptsDiff(x,y,10);
            if (diff10) return diff10;

            const diff8 = ptsDiff(x,y,8);
            if (diff8) return diff8;

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
        stats.get(jurorCountry).hod = juror[1].name; // needed only for the automatic qualifier

        juror[1].votes.forEach((ptsAndSong) => {
            const participant = serverData.participants[ptsAndSong[1]];
            const flag = participant.flag;
            const country = countryName(flag);
            stats.get(country).juryScore += ptsAndSong[0];

            stats.get(country).finalPointsFrom.push({points: ptsAndSong[0], hod: juror[1].name, country: jurorCountry});
        });
    });

    Object.entries(teleServerData.juries).forEach(juror => {
        const jurorCountry = countryName(juror[1].flag);
        juror[1].votes.forEach((ptsAndSong) => {
            const participant = teleServerData.participants[ptsAndSong[1]];
            const flag = participant.flag;
            const country = countryName(flag);
            stats.get(country).finalPointsFrom.push({points: ptsAndSong[0], hod: juror[1].name, country: jurorCountry});
        });
    });


    Object.entries(serverData.televote).forEach(ptsAndSong => {
        const pts = ptsAndSong[1][0];
        const song = ptsAndSong[1][1];
        const flag = serverData.participants[song].flag;
        const country = countryName(flag);
        stats.get(country).teleScore += pts;
        stats.get(country).scoreFinal += pts + stats.get(country).juryScore;
        // stats[country].placeFinal =
    });

    [...stats.entries()]
        .filter(x => x[1].isFinalist)
        .sort((x,y) => {
            if (y[1].scoreFinal != x[1].scoreFinal) return y[1].scoreFinal - x[1].scoreFinal;
            if (y[1].finalPointsFrom.length != x[1].finalPointsFrom.length) return y[1].finalPointsFrom.length != x[1].finalPointsFrom.length;

            let ptsDiff = (x,y,pts) => y[1].finalPointsFrom.filter(z.points == pts).length - x[1].finalPointsFrom.filter(z.points == pts).length;
            const diff12 = ptsDiff(x,y,12);
            if (diff12) return diff12;

            const diff10 = ptsDiff(x,y,10);
            if (diff10) return diff10;

            const diff8 = ptsDiff(x,y,8);
            if (diff8) return diff8;

            console.log("Add a tie braking rule");
            return 0;
        })
        .forEach((x,idx) => x[1].placeFinal = idx + 1);

    let statsForExcel = [...stats.entries()]
        .map(x => {
            x[1].edition = edition;
            x[1].name = editionName;
            return x[1];
        })
        .sort((x,y) => {
            if (x.isFinalist && y.isFinalist) return y.scoreFinal - x.scoreFinal;
            if (x.isFinalist) return -1;
            if (y.isFinalist) return +1;
            if (x.sf != y.sf) return x.sf - y.sf;
            return y.scoreSemi - x.scoreSemi
        });

    const statsForExcelKeys = Object.keys(statsForExcel[0]).map(x => {
        let obj = {};
        obj.label = x.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        obj.value = x;
        return obj;
    });

    let data = [
        {
          sheet: "Statistics",
          columns: statsForExcelKeys,
          content: statsForExcel,
        },
    ];

    let settings = {
        fileName: "EMSC Stats Test 2", // Name of the resulting spreadsheet
        extraLength: 1, // A bigger number means that columns will be wider
        writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
        writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
        RTL: false, // Display the columns from right-to-left (the default value is false)
    }

    jsonToTable(data, settings)
}

main();



    // stats

    // const $ = cheerio.load(dddd); // html finalJuryHtml

    // // const rankingTable = html.getElementById("full-ranking");
    // console.log($.name);
    // const selected = $("div");
    // // const selected = $('title');
    // // selected.data

    // // table#sheet tr th 1st line + 1st column of each line
    // // "table#sheet tr td" points

    // // const rows = selected[0].childNodes
    // //     .forEach(x => x.childNodes
    // //       .forEach(y => console.log(y.childNodes)));
    // //         // .forEach(z => console.log(z))));
    // // let a = selected.contents();

    // let temp = $("table#sheet tr th[class='sheet-participant'] span");

    // // get from HTML
    // let finalParticipants = Array(...$("table#sheet tr th[class='sheet-participant'] span").contents()).forEach(x => console.log(x.data));
    // let juryHods = Array(...$("table#sheet tr th[class='sheet-jury sheet-sortable'] span")).forEach(x => console.log(x.attribs.title));
    // // sheet-jury-score sheet-score pts
    // // sheet-televote-score sheet-score pts
    // let totalScores = Array(...$("table#sheet tr td[class='sheet-total-score sheet-score pts']").contents()).forEach(x => console.log(x.data));
    // // console.log(a);

    // old
    // console.log(selected[0].childNodes);
    // console.log(html("div[id='full-ranking']"));
    // console.log(pageHtml.data);
    // const xhr = new XMLHttpRequest();
    // xhr.open("GET", "https://scorewiz.eu/scoreboard/sheet/664031/emsc-2304---grand-final/PsSWRDPW");
    // xhr.send();
    // xhr.responseType = "json";
    // xhr.onload = () => {
    //   if (xhr.readyState == 4 && xhr.status == 200) {
    //     const data = xhr.response;
    //     console.log(data);
    //   } else {
    //     console.log(`Error: ${xhr.status}`);
    //   }
    // };
// {wiz: {…}, juries: {…}, participants: {…}, televote: Array(25)}
  // const serverData = JSON.parse(serverJson);
// serverData