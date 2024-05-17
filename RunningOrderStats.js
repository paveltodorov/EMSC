const fileName = "EmscFullStats.xlsx"

import xlsxPkg from 'xlsx';
const { readFile, utils } = xlsxPkg;
import axios from "axios"
import xlsx from "json-as-xlsx";
import { name } from 'country-emoji';
// import { scoreGridData } from './ScoreGrids.js';

const workbook = readFile(fileName);
let workbook_sheet = workbook.SheetNames;
let stats = utils.sheet_to_json(
    workbook.Sheets[workbook_sheet[0]]
);

// final running
let finalRunningStats = [...Array(25).keys()].map(runn => Object({
    runningFinal : runn + 1,
    sumPoints : 0,
    avgPoints : 0,
    sumPositions : 0,
    avgPosition : 0,
    // stats for semi
    wins : 0,
    second : 0,
    third : 0,
    top3 : 0,
    top5 : 0,
    top10 : 0,
    top15 : 0,
    top20 : 0,
    last : 0,
    sf1 : 0,
    sf2 : 0,
    aqs : 0,
    editionsPlayed : 0
}));

stats.forEach(x => {
    if (!x['Place Final']
        || x['Place Final'] == 'WITHDRAWN'
        || x['Place Final'] == 'DISQUALIFIED') return;

    const running = x['Running Final'] - 1;
    if (!finalRunningStats[running]) {
        console.log("error");
    }
    finalRunningStats[running].sumPoints += x['Points Final'];
    // finalRunningStats[running].sumPoints += x['Points Final'];

    const rank = x['Place Final'];
    finalRunningStats[running].sumPositions += rank;

    finalRunningStats[running].editionsPlayed += 1;

    if (rank == 1) finalRunningStats[running].wins += 1;
    if (rank == 2) finalRunningStats[running].second += 1;
    if (rank == 3) finalRunningStats[running].third += 1;
    if (rank <= 3) finalRunningStats[running].top3 += 1;
    if (rank <= 5) finalRunningStats[running].top5 += 1;
    if (rank <= 10) finalRunningStats[running].top10 += 1;
    if (rank <= 15) finalRunningStats[running].top15 += 1;
    if (rank <= 20) finalRunningStats[running].top20 += 1;
    if (rank == 25) finalRunningStats[running].last += 1;

    const sf = x.SF;
    if (sf == 1) finalRunningStats[running].sf1 += 1;
    else if (sf == 2) finalRunningStats[running].sf2 += 1;
    else if (sf == 'F') finalRunningStats[running].aqs += 1;
    else console.log("Not clear from which semi this entry is");
});

finalRunningStats.forEach(runn => {
    runn.avgPoints = runn.sumPoints / runn.editionsPlayed;
    runn.avgPosition = runn.sumPositions / runn.editionsPlayed;
})

const finalKeys = Object.keys(finalRunningStats[0]).map(x => {
    let obj = {};
    obj.label = x.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    obj.value = x;
    return obj;
});

// semis running
let semiRunningStats = new Map();

[...Array(22).keys(), ...[...Array(22).keys()].map(x => -x)].forEach(runn => semiRunningStats.set(runn, {
    runningFinal : runn,
    sumPoints : 0,
    avgPoints : 0,
    sumPositions : 0,
    avgPosition : 0,
    editionsQualified : 0,
    editionsPlayed : 0,
    qualifRate : 0,
    wins : 0,
    second : 0,
    third : 0,
    top3 : 0,
    top5 : 0,
    top10 : 0,
    top15 : 0,
    last : 0
    // top20 : 0,
}));

const lastEdition = stats[stats.length - 1].Edition;
const semiParticipantsPerEdition = [...Array(lastEdition + 1).keys()].map(x => [0, 0, 0]);

stats.forEach(x => {
    const sf = x.SF;
    if (sf == 1 || sf == 2) semiParticipantsPerEdition[x.Edition][sf] += 1;
})
stats.forEach(x => {
    const edition = x["Edition"];
    const runn = x['Running Semi'];
    const patricipantsInSemi = semiParticipantsPerEdition[x.Edition][x.SF];
    const runnCountedFromLast = runn - patricipantsInSemi - 1;
    const keys = [runn, runnCountedFromLast];

    keys.forEach(key => {
        if (!x['Place Semi']
        || x['Place Semi'] == 'WITHDRAWN'
        || x['Place Semi'] == 'DISQUALIFIED') return;

        semiRunningStats.get(key).sumPoints += x['Points Semi'];
        const rank = x['Place Semi'];
        semiRunningStats.get(key).sumPositions += rank;
        if (rank <= 12) semiRunningStats.get(key).editionsQualified += 1;

        semiRunningStats.get(key).editionsPlayed += 1;

        if (rank == 1) semiRunningStats.get(key).wins += 1;
        if (rank == 2) semiRunningStats.get(key).second += 1;
        if (rank == 3) semiRunningStats.get(key).third += 1;
        if (rank <= 3) semiRunningStats.get(key).top3 += 1;
        if (rank <= 5) semiRunningStats.get(key).top5 += 1;
        if (rank <= 10) semiRunningStats.get(key).top10 += 1;
        if (rank <= 15) semiRunningStats.get(key).top15 += 1;
        if (rank == patricipantsInSemi) semiRunningStats.get(key).last += 1;
    });
});

[...semiRunningStats.entries()].forEach(entry => {
    const runn = entry[0];
    semiRunningStats.get(runn).avgPoints = entry[1].sumPoints / entry[1].editionsPlayed;
    semiRunningStats.get(runn).avgPosition = entry[1].sumPositions / entry[1].editionsPlayed;
    semiRunningStats.get(runn).qualifRate = entry[1].editionsQualified / entry[1].editionsPlayed;
})

const semiStatsArray = [...semiRunningStats.entries()].filter(x => x[0] != 0).map(x => x[1]);

const semiKeys = Object.keys(semiRunningStats.get(0)).map(x => {
    let obj = {};
    obj.label = x.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    obj.value = x;
    return obj;
});

let runningAndEditionPoints = []
for (let i = 0; i <= 25; i++) {
    for (let j = 0; j <= 17; j++) {
        if (!runningAndEditionPoints[i]) runningAndEditionPoints[i] = {};
        runningAndEditionPoints[i][j] = 0
    }
 }
stats.forEach(x => {
    if (x && x['Running Final'])  runningAndEditionPoints[x['Running Final']][x.Edition] = x['Points Final']
})
let runningAndEditionKeys = [...Array(18).keys()].map(x => {
    let obj = {};
    obj.label = x.toString();
    obj.value = x.toString();
    return obj;
})

let data = [
    {
        sheet: "Final",
        columns: finalKeys,
        content: finalRunningStats,
    },
    {
        sheet: "Semis",
        columns: semiKeys,
        content: semiStatsArray
    },
    {
        sheet: "RunningAndEditionPoints",
        columns: runningAndEditionKeys,
        content: runningAndEditionPoints
    },
];

let settings = {
    fileName: "Running Order Stats", // Name of the resulting spreadsheet
    extraLength: 1, // A bigger number means that columns will be wider
    writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
    writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
    RTL: false, // Display the columns from right-to-left (the default value is false)
}

xlsx(data, settings)

