
import xlsxPkg from 'xlsx';
const { readFile, utils } = xlsxPkg;
import { question } from "readline-sync";
import xlsx from "json-as-xlsx";

import { getPotDigit } from "./countryStats.js";
// let renameProperty = (o, oldKey, newKey) => delete Object.assign(o, {[newKey]: o[oldKey] })[oldKey];

const fileName = "EMSC-Draw.xlsx"
const altCountryNames = new Map();
altCountryNames.set("UK", "United Kingdom")
altCountryNames.set("Utd. Kingdom", "United Kingdom")
altCountryNames.set("Bosnia - H.", "Bosnia and Herzegovina")
altCountryNames.set("N.Macedonia", "North Macedonia")
const outputFileName = "Draw-Output"
// const testAlgorithm = true

let drawnPlayers = new Set()
let takenCountries = new Set()
let takenCountriesByPot = [
    {firstDrawnSemi: 0, taken : new Set()},
    {firstDrawnSemi: 0, taken : new Set()},
    {firstDrawnSemi: 0, taken : new Set()},
    {firstDrawnSemi: 0, taken : new Set()},
    {firstDrawnSemi: 0, taken : new Set()},
    {firstDrawnSemi: 0, taken : new Set()},
    {firstDrawnSemi: 0, taken : new Set()}
]
let potsWithAtLeastOneTakenCountry = 0 // excluding not pretaken

let parseCountryAndPot = (countryAndPot) => {
    const breakpoint = / - /
    const split = countryAndPot.split(breakpoint)

    if (split.length < 2 || !split[0] || !split[1]) {
        console.log(`Failed to parse country and pot data: ${countryAndPot}`)
        return undefined
    }
    let country = split[0]

    if (altCountryNames.has(country)) {
        country = altCountryNames.get(country)
    }
    const pot = parseInt(split[1])
    const realPot = getPotDigit(country)

    if (getPotDigit(country) != pot) {
        console.log(`Provided pot ${pot} for country ${country} doesn not match its real pot ${realPot}`)
    }

    return {country, pot}
}

let takeCountry = (data, priority) => {
    data.drawnCountry = priority.country
    data.drawnCountryPot = priority.pot
    drawnPlayers.add(data.participant)

    takenCountries.add(priority.country)
    takenCountriesByPot[priority.pot].taken.add(priority.country)

    const countriesAlreadyDrawnFromPot = takenCountriesByPot[priority.pot].taken.size
    if (countriesAlreadyDrawnFromPot == 1) {
        potsWithAtLeastOneTakenCountry += 1
        const drawnSemi = (potsWithAtLeastOneTakenCountry % 2 == 0) ? 2 : 1
        data.drawnSemi = drawnSemi
        takenCountriesByPot[priority.pot].firstDrawnSemi = drawnSemi
    } else {
        data.drawnSemi = (takenCountriesByPot[priority.pot].firstDrawnSemi + countriesAlreadyDrawnFromPot + 1) % 2 == 0 ? 2 : 1
    }

    console.log(`${data.participant} gets ${priority.country}, number ${countriesAlreadyDrawnFromPot} drawn from pot ${priority.pot}`);
    console.log(`${priority.country} will compete is semi final ${data.drawnSemi}`);
    console.log(`${takenCountries.size} country/countries has/have already been taken`);
    console.log(takenCountriesByPot)
}

let writeOutputDrawData = (drawData) => {
    let settings = {
        fileName: outputFileName, // Name of the resulting spreadsheet
        extraLength: 1, // A bigger number means that columns will be wider
        writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
        writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
        RTL: false, // Display the columns from right-to-left (the default value is false)
    }

    let drawDataList = [...drawData.values()]
    let statsForExcelKeys = [
        { label: 'Drawn Order', value: 'drawnOrder' },
        { label: 'Participant', value: 'participant' },
        { label: 'Home Country', value: 'homeCountry' },
        { label: 'SEMI 1/2', value: 'drawnSemi' },
        { label: 'Country', value: 'drawnCountry' }
    ]
    // [...countryRanking.entries()]
    // const statsForExcelKeys = Object.keys(drawDataList[0]).map(x => {
    //     let obj = {};
    //     obj.label = x.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    //     obj.value = x;
    //     return obj;
    // });

    for (let i = 0; i < 6; i++) {
        console.log(i)
        statsForExcelKeys.push({
            label : `Prio ${i + 1}`,
            value : (row) => {
                if (row.priorities[i]) {
                    return row.priorities[i].country + " - " + row.priorities[i].pot
                } else {
                    return ""
                }
            }
       })
    }

    let dataForExcel = [
        {
            sheet: "Draw",
            columns: statsForExcelKeys,
            content: drawDataList,
        }
    ]

    xlsx(dataForExcel, settings)
}

function makeDraw() {
    const workbook = readFile(fileName);
    let workbook_sheet = workbook.SheetNames;
    let excelStats = utils.sheet_to_json(
        workbook.Sheets[workbook_sheet[0]]
    );
    excelStats = excelStats.filter(x => x.hasOwnProperty("__EMPTY_4"))

    // fill in draw data
    let drawData = new Map()
    for (let i = 1; i < excelStats.length; i++) {
        let entry = excelStats[i]
        let obj = {}
        obj.drawnOrder = 0
        obj.participant = entry["__EMPTY_1"]
        obj.homeCountry = entry["__EMPTY_2"]
        obj.drawnSemi = undefined
        obj.drawnCountry = undefined
        obj.drawnCountryPot = undefined
        obj.isAq = undefined
        obj.votesAsAqInSemi = undefined
        obj.priorities = []

        let hasPreChosen = false

        if (entry["EMSC2403 - Oslo / Norway"] && entry["EMSC2403 - Oslo / Norway"].includes("-")) {
            const drawnData = parseCountryAndPot(entry["EMSC2403 - Oslo / Norway"])
            obj.drawnCountry = drawnData.country
            obj.drawnCountryPot = drawnData.pot
            hasPreChosen = true
            // continue
        }

        if (!hasPreChosen) {
            let takenPots = [0, 0, 0, 0, 0, 0, 0]
            for (let i = 0; i < 6; i++) {
                if (!entry.hasOwnProperty("__EMPTY_"+(i+4))) {
                    console.log("entry not defined for" + i + " " + obj.participant)
                    continue
                }

                const drawnData = parseCountryAndPot(entry["__EMPTY_"+(i+4)])
                if (!drawnData) {
                    hasPreChosen = true
                    break; // assuming no valid priorities, most likely the HoD has pre-chosen a country
                }
                obj.priorities[i] = drawnData
                takenPots[drawnData.pot]++
            }

            // verify prioriy list
            for (let i = 1; i <= 6; i++) {
                if (takenPots[i] != 1) {
                    console.log(`${obj.participant}'s priotities are not valid. Pot ${i} is represented ${takenPots[i]} in his/her list`)
                }
            }
        }

        drawData.set(entry["__EMPTY_1"], obj)
    }

    let players = Array.from( drawData.keys() )

    let getPlayer = (shortname) => {
        return players.filter(x => x.toLowerCase().startsWith(shortname.toLowerCase()))
    }

    // renameProperty(stats, "__EMPTY_1", 'Patricipant')

    console.log(drawData)

    let drawPretaken = false
    let drawnOrder = 0

    for (let i = 0; ; i++) { // drawData.length
        const drawnPlayerShortName = question('Player? ');
        if (drawnPlayerShortName == "end") break
        if (drawnPlayerShortName == "pretaken") {
            drawPretaken = true
            continue
        }

        let potentialPlayers = getPlayer(drawnPlayerShortName)
        let drawnPlayer
        if (potentialPlayers.length == 1) {
            drawnPlayer = potentialPlayers[0]
        }
        else if (potentialPlayers.length == 0) {
            console.log(`There is no player named ${drawnPlayerShortName}`)
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
        if (drawnPlayers.has(drawnPlayer)) {
            console.log(`Player ${drawnPlayer} has already been drawn.`)
            continue
        }
        let data = drawData.get(drawnPlayer)

        if (drawPretaken) {
            const cntryAndPot = {country: data.drawnCountry, pot: data.drawnCountryPot}
            console.log(cntryAndPot)
            drawnOrder++
            data.drawnOrder = drawnOrder
            takeCountry(data, cntryAndPot)
            continue;
        }

        for (let i = 0; i < 6; i++) {
            let priority = data.priorities[i]
            if (!priority) {
                console.log(`Can't get priority list, likely the player has pre-chosen`);
                break
            }
            console.log(`${i + 1}. ${priority.country}`);
            console.log("");

            const countryIsFree = !takenCountries.has(priority.country)
            if (countryIsFree) {
                drawnOrder++
                data.drawnOrder = drawnOrder
                takeCountry(data, priority)
                break;
            }
        }
        console.log("");
    }

    console.log(drawData)

    let semi1Count = 0
    let semi2Count = 0
    drawData.forEach((value) => {
        if (value.drawnCountry && value.drawnCountryPot && value.drawnSemi) {
            console.log(value)
            if (value.drawnSemi == 1) semi1Count++
            else if (value.drawnSemi == 2) semi2Count++
        }
    });


    drawData

    console.log(`Countries in semi 1 ${semi1Count}`)
    console.log(`Countries in semi 2 ${semi2Count}`)
    writeOutputDrawData(drawData)
}

makeDraw()

