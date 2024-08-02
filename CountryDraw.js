
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
let potsWithAtLeastOneTakenCountry = 0 // excluding pretaken

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

let takeCountry = (data, priority, drawnPriority = 0) => {
    data.drawnCountry = priority.country
    data.drawnCountryPot = priority.pot
    data.drawnPriority = drawnPriority
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

function drawRandomly(notDrawnPlayers) {
    if (notDrawnPlayers.length == 0) return "end"

    const randomIndex = Math.floor(Math.random() * notDrawnPlayers.length)
    const randomPlayer = notDrawnPlayers[randomIndex]
    notDrawnPlayers.splice(randomIndex, 1)

    return randomPlayer
}

function makeDraw(useUserInput = true) {
    drawnPlayers.clear()
    takenCountries.clear()
    for(let i = 0; i <= 6; i++) {
        takenCountriesByPot[i].firstDrawnSemi = 0
        takenCountriesByPot[i].taken.clear()
    }
    potsWithAtLeastOneTakenCountry = 0

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
        obj.drawnPriority = 0
        obj.isAq = undefined
        obj.votesAsAqInSemi = undefined
        obj.priorities = []

        let hasPreChosen = false

        if (entry["EMSC2404 - Manchester / UK"] && entry["EMSC2404 - Manchester / UK"].includes("-")) {
            const drawnData = parseCountryAndPot(entry["EMSC2404 - Manchester / UK"])
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

    let players = Array.from(drawData.keys())
    let notDrawnPlayers = Array.from(drawData.keys())

    let getPlayer = (shortname) => {
        return players.filter(x => x.toLowerCase().startsWith(shortname.toLowerCase()))
    }

    // renameProperty(stats, "__EMPTY_1", 'Patricipant')

    console.log(drawData)

    let pretakenMode = false
    let drawnOrder = 0

    for (let i = 0; ; i++) { // drawData.length
        let drawnPlayerShortName 
        if (useUserInput) {
            drawnPlayerShortName = question('Player? ');
        } else {
            drawnPlayerShortName = drawRandomly(notDrawnPlayers)
        }

        if (drawnPlayerShortName == "end") break
        if (drawnPlayerShortName == "pretaken") {
            pretakenMode = true
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

        if (pretakenMode) {
            const cntryAndPot = {country: data.drawnCountry, pot: data.drawnCountryPot}
            console.log(cntryAndPot)
            drawnOrder++
            data.drawnOrder = drawnOrder
            takeCountry(data, cntryAndPot)
            continue;
        }

        for (let j = 0; j < 6; j++) {
            let priority = data.priorities[j]
            if (!priority) {
                console.log(`Can't get priority list, likely the player has pre-chosen`);
                break
            }
            console.log(`${j + 1}. ${priority.country}`);
            console.log("");

            const countryIsFree = !takenCountries.has(priority.country)
            if (countryIsFree) {
                drawnOrder++
                data.drawnOrder = drawnOrder
                takeCountry(data, priority, j)
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
    if (useUserInput) writeOutputDrawData(drawData)

    return drawData
}

let drawSimulationCount = 10
let accumulatedDrawData = new Map()
let accumulatedTakeCountries = new Map()

let firstDrawData = makeDraw(0)
firstDrawData.forEach(data => {
    let accData = {}
    accData.drawnOrders = [data.drawnOrder]
    accData.participant = data.participant
    accData.homeCountry = data.homeCountry
    accData.drawnSemi = data.drawnSemi
    accData.homeCountry = [data.drawnCountry]
    accData.drawnCountryPot = [data.drawnCountryPot]
    // accData.isAq = undefined
    // accData.votesAsAqInSemi = undefined
    accData.priorities = data.priorities  

    accData.accDrawnPriorities = [0, 0, 0, 0, 0, 0, 0]
    accData.accDrawnPriorities[data.drawnPriority]++

    accumulatedDrawData.set(data.participant, accData)
})
// accumulatedDrawData

for (let i = 1; i < drawSimulationCount; i++) {
    let drawnData = makeDraw(0)
    drawnData.forEach(data => {
        // let accData = {}
        // accData.drawnOrders [data.drawnOrder]
        // accData.participant = data.participant
        // accData.homeCountry = data.homeCountry
        // accData.drawnSemi = data.drawnSemi
        // accData.homeCountry = [data.drawnCountry]
        // accData.drawnCountryPot = [data.drawnCountryPot]
        // accData.isAq = undefined
        // accData.votesAsAqInSemi = undefined
        // accData.priorities = data.priorities  
    
        // accData.accDrawnPriorities = [0, 0, 0, 0, 0, 0, 0]
        accumulatedDrawData.get(data.participant).accDrawnPriorities[data.drawnPriority]++
    })

    // combine accumulated datas
}

console.log(accumulatedDrawData)

// user input
// makeDraw(1)


