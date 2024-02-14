import { calculateCountryRanking } from "./countryStats.js";
import xlsxPkg from 'xlsx';
const {readFile, utils} = xlsxPkg;
import xlsx from "json-as-xlsx";

const fileName = "UNSC Used Songs..xlsx"

const workbook = readFile(fileName);
let workbook_sheet = workbook.SheetNames;

console.log(workbook);

let statsUnscFormat = utils.sheet_to_json(
    workbook.Sheets[workbook_sheet[0]]
);

let stats = [];
let country = "";

statsUnscFormat.forEach(entry => {
    if (entry.COUNTRY && !entry.ARTIST) {
        country = entry.COUNTRY
    }
    else if (!entry.FINAL || !entry['SEMI FINAL']) {
        console.log("Invalid entry");
        return;
    }
    else {
        let newEntry = {};
        newEntry.Edition = parseInt(entry.EDITION);
        newEntry.Name = parseInt(entry.EDITION);
        newEntry.Country = country;
        newEntry.Artist = entry.ARTIST;
        newEntry.Song = entry.SONG;

        if (entry['SEMI FINAL'] == "---") {
            newEntry['Place Semi'] = "";
            newEntry['Points Semi'] = "";
        } else if (entry['SEMI FINAL'] == "AQ") {
            newEntry['Place Semi'] = "";
            newEntry['Points Semi'] = "";
        } else if ((entry['SEMI FINAL']).includes("isq") || (entry['SEMI FINAL']).includes("ISQ")) {
            newEntry['Place Semi'] = "DISQUALIFIED";
            newEntry['Points Semi'] = "DISQUALIFIED";
        } else if ((entry['SEMI FINAL']).includes("ith")) {
            newEntry['Place Semi'] = "WITHDRAWN";
            newEntry['Points Semi'] = "WITHDRAWN";
        } else {
            newEntry['Place Semi'] = parseInt(entry['SEMI FINAL']);
            newEntry['Points Semi'] = parseInt(entry['POINTS_1']);
        }

        if (entry.FINAL == "---") {
            newEntry['Place Final'] = "";
            newEntry['Points Final'] = "";
        } else if (entry.FINAL.toLowerCase().includes("isq")) {
            newEntry['Place Final'] = "DISQUALIFIED";
            newEntry['Points Final'] = "DISQUALIFIED";
            newEntry['Place Semi'] = "DISQUALIFIED";
            newEntry['Points Semi'] = "DISQUALIFIED";
        } else if (entry.FINAL.toLowerCase().includes("ith")) {
            newEntry['Place Final'] = "WITHDRAWN";
            newEntry['Points Final'] = "WITHDRAWN";
            newEntry['Place Semi'] = "WITHDRAWN";
            newEntry['Points Semi'] = "WITHDRAWN";
        } else {
            newEntry['Place Final'] = parseInt(entry.FINAL);
            newEntry['Points Final'] = parseInt(entry['POINTS']);
        }

        stats.push(newEntry);
    }
})

console.log(statsUnscFormat);

const countryStats = calculateCountryRanking(stats, 1, 30, 10, true);

let data = [
    {
        sheet: "CountryRanking",
        columns: countryStats.keys,
        content: countryStats.ranking,
    },
    {
        sheet: "CountryPositions",
        columns: countryStats.positionsKeys,
        content: countryStats.positionsStats,
    },
    {
        sheet: "CountryPositionsSemi",
        columns: countryStats.positionsSemiKeys,
        content: countryStats.positionsSemiStats,
    },
];

let settings = {
    fileName: "UNSC-Country-Ranking", // Name of the resulting spreadsheet
    extraLength: 1, // A bigger number means that columns will be wider
    writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
    writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
    RTL: false, // Display the columns from right-to-left (the default value is false)
  }

xlsx(data, settings) // uncomment to save to file


// calculateCountryRanking(1, 28);
// calculateCountryRanking