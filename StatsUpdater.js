const fileName = "EMSC STATISTICS UPDATED.xlsx"

// var cheerio = require('cheerio');
// const jsonToTable = require("json-excel-style")
import xlsxPkg from 'xlsx';
const { readFile, utils } = xlsxPkg;
import axios from "axios"
import xlsx from "json-as-xlsx";
import { name } from 'country-emoji';
import { scoreGridData } from './ScoreGrids.js';
import { getCountries } from './countryStats.js';

/*
POST
url : https://scorewiz.eu/register.html
title: tt
folder: 0:126650
system: classic
votingMethod: manual
rsvpNumber: 50

Request URL:
https://scorewiz.eu/saveOptions/participants
Request Method:
POST

data
{
sid: 669973
pass: F8PY65Vv
__flag1: French Guiana
flag1: fg
name1: fgsdagffd
sponsor1:
__flag2: France
flag2: fr
name2: ffgdafg
sponsor2:
__flag3: Barbados
flag3: bb
name3:
sponsor3:
}

$.post("https://scorewiz.eu/saveOptions/participants",
    {
    sid: 669973,
    pass: 'F8PY65Vv',

    __flag1: 'French Guiana',
    flag1: 'fg',
    name1: 'fgsdagffd'
    })
*/

let makeTelevotePostBody = (stats) => {
    let body = {
        sid: 692246,
        pass: "4ubK8uhF",
        enable : "on"
    };

    [...stats.entries()].filter(x => x[1].isFinalist).forEach(x => {
        const propertyName = `televote-${x[1].runningFinal}`;
        const propertyValue = x[1].teleScore;
        body[propertyName] = propertyValue;
    })

    return body;
}

let countryName = (abbr) => {
    if (abbr == 'uk') return 'United Kingdom';
    if (abbr == 'us') return 'United States';
    if (abbr == 'ym') return 'Mauritius';
    if (abbr == 'mr') return "Morocco";
    if (abbr == 'ru') return "Russia";
    if (abbr == 'tr') return "Türkiye";
    if (abbr == 'ja') return "Jamaica";
    if (abbr == 'ty') return "Türkiye";
    if (abbr == 'ko') return "South Korea";
    if (abbr == 'mf') return "Myanmar";
    if (abbr == 'gg') return "Georgia";
    if (abbr == 'md') return "Moldova";
    if (abbr == 'nn') return "North Macedonia";
    if (abbr == 'mk') return "North Macedonia";
    if (abbr == 'le') return "Lebanon";
    if (abbr == 'tu') return "Tunisia"; //
    if (abbr == 'zh') return "Czechia";
    if (abbr == 'ch') return "Switzerland";

    let countryName = name(abbr)
    if (!countryName) {
        console.log(`Can't find country for abbr ${abbr}`);
        if (countryName == "") return "Switzerland"; // assuming that this is the error in edition 2104 with the swiss flag
        if (countryName == "zz") {
            return "";
        }
        return abbr;
    }
    return countryName;
}

let numberToEditionName = edNum => {
    const year = Math.floor((edNum - 1)/ 5) + 21;
    const edInYear = edNum % 5 ? edNum % 5 : 5;
    const edName = year + "0" + edInYear;
    return edName;
}

export let getServerData = async link => {
    // const finalJuryHtml = await axios.get(link);
    const html = await axios.request({
        method: 'GET',
        url: link,
        responseType: 'json',
        reponseEncoding: 'utf-8'
    }).catch(err => {/*console.log(err)*/});

    if (!html || !html.data) {
        console.log(`Cannot get data for ${link}`);
        return {};
    }
    const finalJuryHtmlData = html.data;
    const start = finalJuryHtmlData.search('{"wiz"');
    const end = finalJuryHtmlData.search('`;');
    const serverString = decodeURI(finalJuryHtmlData.substring(start, end).replace(/\\\\u/g, "\\u")).replaceAll('\\\\"', '').replaceAll("&amp;", "&");
    const serverData = JSON.parse(serverString);
    return serverData;
}

// let login  = asy

export let getGridListFromScoreGridData = (scoreGridData) => {
    const grids = scoreGridData[0].contents
        .filter(x => !x.hasOwnProperty("contents"));
    grids.push(...scoreGridData[0].contents[0].contents); // push grids from the EMSC folder
    return grids;
}

let getLinks = edition => {
    const edName = numberToEditionName(edition);
    const grids = getGridListFromScoreGridData(scoreGridData);
    const edGrids = grids.filter(x => x.title.includes(edName));

    const finalScoreboard = edGrids.find(x => {
        const title = x.title.toLowerCase();
        return title.includes("final") && !title.includes("tele") && !title.includes("semi");
    });
    const finalLink = finalScoreboard && finalScoreboard.data.menu.view;

    const teleScoreoard = edGrids.find(x => {
        const title = x.title.toLowerCase();
        return title.includes("final") && title.includes("tele");
    });
    const teleLink = teleScoreoard && teleScoreoard.data.menu.view;

    const semi1Scoreboard = edGrids.find(x => {
        const title = x.title.toLowerCase();
        return title.includes("semi final 1");
    })
    const semi1Link = semi1Scoreboard && semi1Scoreboard.data.menu.view;

    const semi2Scoreboard = edGrids.find(x => {
        const title = x.title.toLowerCase();
        return title.includes("semi final 2");
    })
    const semi2Link = semi2Scoreboard.data.menu.view;

    const links = {finalLink, teleLink, semi1Link, semi2Link}
    return links;
}

let getEntryData = p => {
    let regex = /(.+) \((\w+)\)[ ]*- (.+)/
    let m = p[1].name.match(regex);
    let country = countryName(p[1].flag);


    if (!m) {
        regex = /(\w+) \\\/[ ]*(.+) - (.+)/
        m = p[1].name.match(regex);
        if (!m) {
            regex = /\((\w +)\) (.+)[ ]*- (.+)/
            m = p[1].name.match(regex);
            if (!m) {
                regex = /(.+) \((\w+)\)[ ]*/
                m = p[1].name.match(regex);
                if (!m) {
                    console.log("Еrror in parsing entry data");
                    return {country, artist: "", song : ""};
                }
                return {country, artist: m[2], song : p[1].sponsor};
            }
        }
        return {country, artist: m[2], song : m[3]};
    }
    const entryData = {country, artist: m[1], song : m[3]};

    return entryData;
}
let fillEntryDataSemi = (stats, p, idx, sf) => {
    const entry = getEntryData(p);
    if (!entry.country) {
        entry.country = "Switzerland"; //compensation for the mistake in edition 2104
    }
    stats.set(entry.country, {
        edition: "",
        name: "",
        country : entry.country,
        artist: entry.artist,
        song : entry.song,
        SF : sf,
        placeFinal : 0,
        pointsFinal: 0,
        placeSemi : 0,
        pointsSemi: 0,
        HOD : "",
        hodShortName: "",
        juryScore : 0,
        teleScore : 0,
        juryTelePtsDifference : "",
        runningSemi: idx + 1,
        runningFinal : "",
        isFinalist : "",
        numOfIndivVotesFinal : "",
        numOfIndivVotesSemi : "",
        finalSemiPtsDifference : "",
        finalSemiPositionDifference : "",
        sumTop3PtsSemi: 0,
        sumTop5PtsSemi: 0,
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
            SF : "F",
            placeFinal : 0,
            pointsFinal: 0,
            placeSemi : "",
            pointsSemi: "",
            HOD : "",
            hodShortName: "",
            juryScore : 0,
            teleScore : 0,
            juryTelePtsDifference : "",
            runningSemi: "",
            runningFinal : idx + 1,
            isFinalist : true,
            numOfIndivVotesFinal : "",
            numOfIndivVotesSemi : "",
            finalSemiPtsDifference : "",
            finalSemiPositionDifference : "",
            isDqFinal : false,
            isDqSemi : false,
            finalPointsFrom : [],
            semiPointsFrom : []
        });
    }
    else {
        stats.get(entry.country).runningFinal = idx + 1;
        if (!stats.get(entry.country).artist) stats.get(entry.country).artist = entry.artist;
        if (!stats.get(entry.country).song) stats.get(entry.country).song = entry.song;
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
    if (shortName == "Michael" || shortName == "Mike") return "Michalis Terzis";
    if (shortName == "Luís Coelho") return "Luís Coelho";
    if (shortName == "The Lady Cru") return "Keiron Lynch";
    if (shortName == "Christoforos Andrianos" || shortName == "Christoforos"
        || shortName == "Christoph" || shortName == "Christophoros Andrianos") return "Christoforos Andrianos";
    if (shortName == "Jesus" || shortName == "Jesus Santamaria Rodriguez"
        || shortName.includes("Jesús") || shortName == "Jesus Santmaria Rodriguez") return "Jesús Santamaría Rodríguez";
    if (shortName == "Jonathan Zuñiga") return "Jonathan Zuñiga";
    if (shortName == "Richie C") return "Richard Cox";
    if (shortName == "Jose") return "José Mora";
    if (shortName == "Fabio Cuau-Boukentar") return "Fábio Cuau-Boukentar";
    if (shortName == "Fabiomassimo") return "FabioMassimo Falchi";
    if (shortName == "SMOKING" || shortName == "maurice") return "Maurice Dupont";
    if (shortName == "Sven Cheese :-)") return "Sven Van der Lelie";
    if (shortName == "Tom") return "Tomislav Roso"; // in edition 6, 7, 10, 12 is Tomislav Roso
    // in edition 9 is Tom Jan
    if (shortName == "Sven Van der Lelie") return "Sven van der Lelie";
    if (shortName == "Sven") return "Sven van der Lelie";
    if (shortName == "Sve") return "Sven Biwald";
    if (shortName == "joseph cruz") return "Joseph Cruz";
    if (shortName == "Freddie aka Rich C." || shortName == "Richie Cox") return "Richard Cox";
    if (shortName == "john blue") return "John Blue";
    if (shortName == "Chris S.") return "Christian Sandmann";
    if (shortName == "Fabio Cuau Boukentar") return "Fábio Cuau-Boukentar";
    if (shortName == "Stefan") return "Stefano Di Betta";


    shortName = shortName.replace(".", "");
    let splitNames = shortName.split(" ");

    let potentialFullName = hods.find(fullName => fullName.startsWith(shortName));
    if (potentialFullName) return potentialFullName;

    let serachSplitName = (splitName) => hods.find(fullName => fullName.startsWith(splitName));

    if (splitNames[0]) potentialFullName = serachSplitName(splitNames[0]);
    if (potentialFullName) return potentialFullName;

    if (splitNames[2]) potentialFullName = serachSplitName(splitNames[2]);
    if (potentialFullName) return "???" + potentialFullName;

    if (splitNames[1]) potentialFullName = serachSplitName(splitNames[1]);
    if (potentialFullName) return "???" + potentialFullName;

    return "??? " + shortName;
}


export async function calculateEditionStats(links, edition, qualifiersCount) {
    const hods = getHods();

    const serverData = await getServerData(links.finalLink);
    const teleServerData = links.teleLink && await getServerData(links.teleLink);
    const semi1ServerData = await getServerData(links.semi1Link);
    const semi2ServerData = await getServerData(links.semi2Link);
    // const serverData = await getServerData("https://scorewiz.eu/scoreboard/sheet/732605/emsc-2403---grand-final/Mx8VNwek")
    // const teleServerData = await getServerData("https://scorewiz.eu/scoreboard/sheet/732607/emsc-2403---grand-final---televote/LSG3cubR")
    // const serverData = await getServerData("https://scorewiz.eu/scoreboard/sheet/743527/emsc-2404---grand-final/QdZefFH4");
    // const teleServerData = await getServerData("https://scorewiz.eu/scoreboard/sheet/743530/emsc-2404---grand-final---televote/R9VVbaTT");
    // const semi1ServerData = await getServerData("https://scorewiz.eu/scoreboard/sheet/742174/emsc-2404---semi-final-1/5fNS9GCS");
    // const semi2ServerData = await getServerData("https://scorewiz.eu/scoreboard/sheet/742175/emsc-2404---semi-final-2/USQcU3dR");

    let stats = new Map();
    let editionName = "EMSC " + numberToEditionName(edition);

    if (semi1ServerData) Object.entries(semi1ServerData.participants).forEach((p, idx) => fillEntryDataSemi(stats, p, idx, 1));
    if (semi2ServerData) Object.entries(semi2ServerData.participants).forEach((p, idx) => fillEntryDataSemi(stats, p, idx, 2));
    if (serverData) Object.entries(serverData.participants).forEach((p, idx) => fillEntryDataFinal(stats, p, idx, 2));

    // calculate semi points
    let calculateSemiPoints = (juror, data) => {
        const jurorCountry = countryName(juror[1].flag);
        if (stats.get(jurorCountry)) {
            stats.get(jurorCountry).hodShortName = juror[1].name;
        }

        juror[1].votes.forEach((ptsAndSong) => {
            const participant = data.participants[ptsAndSong[1]];
            const flag = participant.flag;
            const country = countryName(flag) || "Switzerland";

            if (!stats.get(country)) {
                console.log("Failed to get country stats");
            }

            let semiPts = ptsAndSong[0];
            stats.get(country).pointsSemi += semiPts;
            if (semiPts >= 6) {
                stats.get(country).sumTop5PtsSemi += semiPts;
            }
            if (semiPts >= 8) {
                stats.get(country).sumTop3PtsSemi += semiPts;
            }
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
    if (semi1ServerData) Object.entries(semi1ServerData.juries).forEach(juror => calculateSemiPoints(juror, semi1ServerData));
    if (semi2ServerData) Object.entries(semi2ServerData.juries).forEach(juror => calculateSemiPoints(juror, semi2ServerData));

    let fillSfPlaces = sf => [...stats.entries()]
        .filter(x => x[1].SF == sf )
        .sort((x,y) => {
            if (x[1].isDqSemi) return 1;
            if (y[1].isDqSemi) return -1;
            if (y[1].pointsSemi != x[1].pointsSemi) return y[1].pointsSemi - x[1].pointsSemi;
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
            const isFinalist = (idx + 1 <= qualifiersCount) ? true : false;
            x[1].isFinalist = isFinalist;
            if (!isFinalist) {
                x[1].juryScore = '';
                x[1].teleScore = '';
                x[1].pointsFinal = '';
                x[1].placeFinal = '';
            }
        })

    fillSfPlaces(1);
    fillSfPlaces(2);

    // calculate final points
    if (serverData) {
        Object.entries(serverData.juries).forEach(juror => {
            const jurorCountry = countryName(juror[1].flag);
            if (stats.get(jurorCountry)) {
                stats.get(jurorCountry).hodShortName = juror[1].name; // needed only for the automatic qualifier
            } else {
                console.log("Can't load the country of the juror");
            }

            juror[1].votes.forEach((ptsAndSong) => {
                const participant = serverData.participants[ptsAndSong[1]];
                const flag = participant.flag;
                const country = countryName(flag);

                if (!stats.get(jurorCountry)) {
                    console.log("Can't load the country of the juror");
                }

                if (stats.get(jurorCountry).isFinalist) stats.get(country).juryScore += ptsAndSong[0];
                else stats.get(country).teleScore += ptsAndSong[0];

                stats.get(country).pointsFinal += ptsAndSong[0];
                stats.get(country).finalPointsFrom.push({points: ptsAndSong[0], hodShortName: juror[1].name, country: jurorCountry});
            });

            // add disqualifications (if any) marked as negative televoting points
            if (serverData.televote) {
                serverData.televote.forEach(ptsAndSong => {
                    if (ptsAndSong[0] >= 0) return;
                    const participant = serverData.participants[ptsAndSong[1]];
                    const flag = participant.flag;
                    const country = countryName(flag);
                    stats.get(country).isDqFinal = true;
                });
            }
        });
    }

    // add televote
    if (teleServerData && teleServerData.juries) {
        Object.entries(teleServerData.juries).forEach(juror => {
            const jurorCountry = countryName(juror[1].flag);
            juror[1].votes.forEach((ptsAndSong) => {
                const participant = teleServerData.participants[ptsAndSong[1]];
                const flag = participant.flag;
                const country = countryName(flag);
                stats.get(country).teleScore += ptsAndSong[0];
                stats.get(country).pointsFinal += ptsAndSong[0];
                stats.get(country).finalPointsFrom.push({points: ptsAndSong[0], hodShortName: juror[1].name, country: jurorCountry});
            });
        });
    }

    // set final place
    [...stats.entries()]
        .filter(x => x[1].isFinalist)
        .sort((x,y) => {
            if (x[1].isDqFinal) return 10000;
            if (y[1].isDqFinal) return -10000;
            if (y[1].pointsFinal != x[1].pointsFinal) return y[1].pointsFinal - x[1].pointsFinal;
            if (y[1].finalPointsFrom.length != x[1].finalPointsFrom.length) return y[1].finalPointsFrom.length - x[1].finalPointsFrom.length;

            let ptsDiff = (x,y,pts) => y[1].finalPointsFrom.filter(z => z.points == pts).length - x[1].finalPointsFrom.filter(z => z.points == pts).length;
            let ptsSystem = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

            for (let i = 0; i < ptsSystem.length; i++) {
                const diff = ptsDiff(x,y,ptsSystem[i]);
                    console.log("Deciding by tiebreaker rule by # of " + ptsSystem[i] + " pts, countries : " + x[1].country + " " + y[1].country)
                    if (diff) return diff;
                }

                console.log("Add a tie braking rule");
                return 0;
        })
        .forEach((x,idx) => x[1].placeFinal = idx + 1);

    let statsForExcel = [...stats.entries()].map(x => {
        x[1].edition = edition;
        x[1].name = editionName;
        x[1].HOD = getHodFullName(x[1].hodShortName, hods);
        if (x[1].isFinalist) {
            x[1].numOfIndivVotesFinal = x[1].finalPointsFrom.length;
            x[1].juryTelePtsDifference = x[1].juryScore - x[1].teleScore;
            if (x[1].SF != 'F') {
                x[1].finalSemiPtsDifference = x[1].pointsFinal - x[1].pointsSemi;
                x[1].finalSemiPositionDifference = x[1].placeSemi - x[1].placeFinal;
            }
        }
        if (x[1].SF != 'F') x[1].numOfIndivVotesSemi = x[1].semiPointsFrom.length;
        if (x[1].isDqSemi) x[1].placeSemi = "DISQUALIFIED";
        if (x[1].isDqFinal) x[1].placeFinal = "DISQUALIFIED";
        return x[1];
    })
    .sort((x,y) => {
        if (x.isFinalist && y.isFinalist) return x.placeFinal - y.placeFinal;
        if (x.isFinalist) return -1;
        if (y.isFinalist) return +1;
        if (x.SF != y.SF) return x.SF - y.SF;
        return x.placeSemi - y.placeSemi;
    });

    makeTelevotePostBody(stats);

    return statsForExcel;
}

let pointsToPlace = (points) => {
    if (points == 12) return 1;
    if (points == 10) return 2;
    return 11 - points;
}

let caculateHodPointExchangeStats = (edData) => {
    // initialize HoD exchange map
    let hodExchangeStats = new Map();
    const hods = getHods();
    hods.forEach(leftHod => {
        hodExchangeStats.set(leftHod, new Map());
        hods.forEach(rightHods => {
            hodExchangeStats.get(leftHod).set(rightHods,
                {
                    sumPointsFinal : 0,
                    avgPointsFinal : 0,
                    editionsPossibleExchange: 0,
                    relativePosSum: 0,
                    relativePosAvg: 0,
                })
        })
    });

    let participatingHodsPerEdition = new Object();
    edData.forEach(entry => {
        if (!participatingHodsPerEdition[entry.edition]) {
            participatingHodsPerEdition[entry.edition] = new Set();
        }
        participatingHodsPerEdition[entry.edition].add(entry.HOD);
    });

    // calculate HoD exchange map
    edData.forEach(entry => {
        if (entry.isFinalist) {
            entry.finalPointsFrom.forEach(pointsFrom => {
                const giverHod = getHodFullName(pointsFrom.hodShortName, hods);
                if (entry.HOD === giverHod) {
                    console.log(`The Hod has voted for themselves, hod: ${giverHod}`)
                    return;
                }
                if (!hodExchangeStats.has(entry.HOD)) {
                    console.log(entry.HOD);
                    return;
                }
                if (!hodExchangeStats.get(entry.HOD).has(giverHod)) {
                    console.log(giverHod);
                    return;
                }
                hodExchangeStats.get(entry.HOD).get(giverHod).sumPointsFinal += pointsFrom.points;

                const ptsRespectToOthers = Math.min(entry.placeSemi, 11) - pointsToPlace(pointsFrom.points);
                hodExchangeStats.get(entry.HOD).get(giverHod).relativePosSum += ptsRespectToOthers;
            });

            participatingHodsPerEdition[entry.edition].forEach(hodVotedName => {
                const giverHod = getHodFullName(hodVotedName, hods);
                if (entry.HOD === giverHod) return;
                if (!hodExchangeStats.has(entry.HOD)) {
                    console.log(entry.HOD);
                    return;
                }
                if (!hodExchangeStats.get(entry.HOD).has(giverHod)) {
                    console.log(giverHod);
                    return;
                }
                hodExchangeStats.get(entry.HOD).get(giverHod).editionsPossibleExchange += 1;
            });
        }
    });
    hods.forEach(leftHod => {
        hods.forEach(rightHod => {
            let hodStats = hodExchangeStats.get(leftHod).get(rightHod);
            hodStats.avgPointsFinal = hodStats.editionsPossibleExchange ? hodStats.sumPointsFinal / hodStats.editionsPossibleExchange : 0;
            hodStats.relativePosAvg = hodStats.editionsPossibleExchange ? hodStats.relativePosSum / hodStats.editionsPossibleExchange : 0;
        })
    });

    return [...hodExchangeStats.entries()];
}

let caculateFavoriteCountries = (edData) => {
    let favoriteCountries = new Map();

    const hods = getHods();
    const countries = getCountries();
    hods.forEach(hod => {
        favoriteCountries.set(hod, new Map());
        countries.forEach(c => favoriteCountries.get(hod).set(c, {
            sumPointsFinal : 0,
        }))
    })
    edData.forEach(entry => {
        if (entry.isFinalist) {
            entry.finalPointsFrom.forEach(pointsFrom => {
                const giverHod = getHodFullName(pointsFrom.hodShortName, hods);
                if (!favoriteCountries.has(giverHod)) {
                    console.log(`The following HoD was not found: ${giverHod}`);
                    return;
                }
                favoriteCountries.get(giverHod).get(entry.country).sumPointsFinal += pointsFrom.points;
            })
        }
    });
    return [...favoriteCountries.entries()];
}

async function main() {
    let allEditionsData = [];

    let editionsToCalculate =
        [/*1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
        15, 16, 17, 18, 19, 20, 21, 22*/23];
    for (let i = 0; i < editionsToCalculate.length; i++) {
        const links = getLinks(editionsToCalculate[i]);

        let qualifCount = 12
        if (editionsToCalculate[i] == 20) qualifCount = 10
        let edData = await calculateEditionStats(links, editionsToCalculate[i], qualifCount);
        allEditionsData.push(...edData);
    }
    const statsForExcelKeys = Object.keys(allEditionsData[0]).map(x => {
        let obj = {};
        obj.label = x.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        obj.value = x;
        return obj;
    });

    let data = [
        {
            sheet: "Statistics",
            columns: statsForExcelKeys,
            content: allEditionsData,
        },
    ];

    let settings = {
        // fileName: "Summary of edition 15", // Name of the resulting spreadsheet
        // EMSC Stats Test 6 - 14
        // fileName: "EmscFullStats",
        // fileName: "EMSC2404-Summary",
        fileName: "EMSC2503",
        extraLength: 1, // A bigger number means that columns will be wider
        writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
        writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
        RTL: false, // Display the columns from right-to-left (the default value is false)
    }

    xlsx(data, settings)
    return 0;

    let hodPointExchangeStats = caculateHodPointExchangeStats(allEditionsData);
    let getHodPointExchangeKeys = f => {
        let keys = [{label: "HOD", value : row => row[0]}]
        keys.push(...[...hodPointExchangeStats].map(x => {
            let obj = {};
            obj.label = "From " + x[0];
            obj.value = row => f(row[1].get(x[0]));
            obj.format = "#,#0.0";
            return obj;
        }));
        return keys;
    }

    let favoriteCountries = caculateFavoriteCountries(allEditionsData);
    let favoriteCountriesKeys = [{label : "HOD", value : row => row[0]}]
    // let favoriteCountriesKeys = [];
    favoriteCountriesKeys.push(...[...favoriteCountries[0][1]].map(country => {
        let obj = {};
        obj.label = country[0];
        obj.value = row => row[1].get(country[0]).sumPointsFinal
        // obj.value = row => row[1].sumPointsFinal;
        // obj.format = "#,#0.0";
        return obj;
    }));

    let dataPointExchange = [
        {
            sheet: "PointExchange",
            columns: getHodPointExchangeKeys(x => x.sumPointsFinal),
            content: hodPointExchangeStats
        },
        {
            sheet: "AveragePointExchange",
            columns: getHodPointExchangeKeys(x => x.avgPointsFinal),
            content: hodPointExchangeStats
        },
        {
            sheet: "RelativeSumPointExchange",
            columns: getHodPointExchangeKeys(x => x.relativePosSum),
            content: hodPointExchangeStats
        },
        {
            sheet: "RelativeAveragePointExchange",
            columns: getHodPointExchangeKeys(x => x.relativePosAvg),
            content: hodPointExchangeStats
        },
        {
            sheet: "FavoriteCountries",
            columns: favoriteCountriesKeys,
            content: favoriteCountries
        },
    ];

    let settingsPointExchange = {
        fileName: "PointExchange-TTest",
        // fileName: "EMSC Semi 2",
        extraLength: 1, // A bigger number means that columns will be wider
        writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
        writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
        RTL: false, // Display the columns from right-to-left (the default value is false)
    }
    xlsx(dataPointExchange, settingsPointExchange)
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