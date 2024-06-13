const fileName = "EMSC-Draw.xlsx"

import xlsxPkg from 'xlsx';
const { readFile, utils } = xlsxPkg;
import { question } from "readline-sync";
import { getPotDigit } from "./countryStats.js";
// let renameProperty = (o, oldKey, newKey) => delete Object.assign(o, {[newKey]: o[oldKey] })[oldKey];

const workbook = readFile(fileName);
let workbook_sheet = workbook.SheetNames;
let excelStats = utils.sheet_to_json(
    workbook.Sheets[workbook_sheet[0]]
);
excelStats = excelStats.filter(x => x.hasOwnProperty("__EMPTY_4"))


let drawData = new Map()
for (let i = 1; i < excelStats.length; i++) {
    let entry = excelStats[i]
    let obj = {}
    obj.participant = entry["__EMPTY_1"]
    obj.homeCountry = entry["__EMPTY_2"]
    // obj.drawnCountry
    // obj.drawnSemi
    obj.priorities = []
    for (let i = 0; i < 5; i++) { // 6
        if (!entry.hasOwnProperty("__EMPTY_"+(i+4))) {
            console.log("entry not defined for" + i + " " + obj.participant)
            continue
        }
        const breakpoint = /[ -]/
        obj.priorities[i] = entry["__EMPTY_"+(i+4)].split(breakpoint)[0]
    }

    drawData.set(entry["__EMPTY_1"], obj)
}

let takenCountries = new Set()
let players = Array.from( drawData.keys() )

let getPlayer = (shortname) => {
    return players.filter(x => x.toLowerCase().startsWith(shortname.toLowerCase()))
}

// renameProperty(stats, "__EMPTY_1", 'Patricipant')


console.log(drawData)

for (let i = 0 ; ; i++) { //drawData.length
    const drawnPlayerShortName = question('Player? ');
    if (drawnPlayerShortName == "end") break

    let potentialPlayers = getPlayer(drawnPlayerShortName)
    let drawnPlayer
    if (potentialPlayers.length == 1) {
        drawnPlayer = potentialPlayers[0]
    }
    else {
        console.log(potentialPlayers)
        continue
    }

    console.log(drawnPlayer)
    if (!drawData.get(drawnPlayer)) {
        console.log("Player not found")
        continue;
    }
    let data = drawData.get(drawnPlayer)

    for (let i = 0; i < 5; i++) { // 6!!
        let priority = data.priorities[i]
        console.log(`${i + 1}. ${priority}`);
        console.log("");
        if (!takenCountries.has(priority)) {
            data.drawnCountry = priority
            takenCountries.add(priority)
            let pot = getPotDigit(priority)
            console.log(`${data.participant} gets ${priority}, drawn from pot ${pot}`);
            break
        }
    }

}

console.log(drawData)
// console.log('Your name is', name);