// Post
// https://scorewiz.eu/saveTelevote
// body Format
// sid: 663190
// pass: 4QhVJ4Sx
// televote-1: 52
// televote-2: 5
// televote-3: 0
// televote-4: 4
// televote-5: 7
// televote-6: 10
// televote-7: 9
// televote-8: 8
// televote-9: 2
// televote-10: 8
// enable: on

import xlsxPkg from 'xlsx';
const { readFile, utils } = xlsxPkg;

export let readExcelSheet1 = filename => {
    const workbook = readFile(filename);
    let workbook_sheet = workbook.SheetNames;

    let fileData = utils.sheet_to_json(
        workbook.Sheets[workbook_sheet[0]]
    );

    return fileData;
}

const fullStatsFileName = "EmscFullStats.xlsx";
let fullStats = readExcelSheet1(fullStatsFileName);

const gioStatsFileName = "EMSC STATISTICS UPDATED.xlsx";
let gioStats = readExcelSheet1(gioStatsFileName);

gioStats = gioStats
    // .filter(x => x.Edition >= 6)
    .sort((x,y) => {
        if (x.Edition != y.Edition) return x.Edition - y.Edition;
        if ((x["Place Final"] && y["Place Final"])) return x["Place Final"] - y["Place Final"];
        if (x["Place Final"]) return -1;
        if (y["Place Final"]) return +1;
        if (x.SF != y.SF) return x.SF - y.SF;
        return x["Place Semi"] - y["Place Semi"];
    });

gioStats

let compare = (i,j) => {
    if (i.Edition != j.Edition) {
        console.log(`${i.Edition} ${i.Country} ${j.Edition} ${j.Country}`);
        return;
    }

    if (i.Country != j.Country) {
        console.log(`${i.Edition} ${i.Country} ${j.Edition} ${j.Country}`);
        return;
    }

    if (i["Points Final"] != j["Points Final"]) {
        console.log(`${i.Edition} ${i.Country} ${j.Edition} ${j.Country}`);
        return;
    }

    if (i["Points Semi"] != j["Points Semi"]) {
        console.log(`${i.Edition} ${i.Country} ${j.Edition} ${j.Country}`);
        return;
    }

    if (i["Place Final"] != j["Place Final"]) {
        console.log(`${i.Edition} ${i.Country} ${j.Edition} ${j.Country}`);
        return;
    }

    if (i["Place Semi"] != j["Place Semi"]) {
        console.log(`${i.Edition} ${i.Country} ${j.Edition} ${j.Country}`);
        return;
    }

    if (i["SF"] != j["SF"]) {
        console.log(`${i.Edition} ${i.Country} ${j.Edition} ${j.Country}`);
        return;
    }
    if (i["HOD"] != j["HOD"]) {
        console.log(`${i.Edition} ${i.Country} ${j.Edition} ${j.Country}`);
        return;
    }
}

for (let i = 0; i < fullStats.length; i++) {
    compare(fullStats[i], gioStats[i]);
}






