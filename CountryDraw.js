
import xlsxPkg from 'xlsx';
const { readFile, utils } = xlsxPkg;
import { question } from "readline-sync";
import xlsx from "json-as-xlsx";

import { getPotDigit } from "./countryStats.js";
// let renameProperty = (o, oldKey, newKey) => delete Object.assign(o, {[newKey]: o[oldKey] })[oldKey];

const fileName = "EMSC - Draw.xlsx"
const altCountryNames = new Map();
altCountryNames.set("UK", "United Kingdom")
altCountryNames.set("Utd. Kingdom", "United Kingdom")
altCountryNames.set("Bosnia - H.", "Bosnia and Herzegovina")
altCountryNames.set("Bosnia & H.", "Bosnia and Herzegovina")
altCountryNames.set("N.Macedonia", "North Macedonia")
const outputFileName = "Draw-Output"
// const testAlgorithm = true

//commands
//pre-taken
// end

let drawnPlayers = new Set()
let takenCountries = new Set()
let takenCountriesByPot = [
    {firstDrawnSemi: 0, taken : new Set()},
    {firstDrawnSemi: 1, taken : new Set()},
    {firstDrawnSemi: 2, taken : new Set()},
    {firstDrawnSemi: 2, taken : new Set()},
    {firstDrawnSemi: 1, taken : new Set()},
    {firstDrawnSemi: 1, taken : new Set()},
    {firstDrawnSemi: 2, taken : new Set()}
]
// let potsWithAtLeastOneTakenCountry = 0 // excluding pretaken

let parseCountryAndPot = (countryAndPot) => {
    console.log(countryAndPot)
    const breakpoint = / [-–] /
    const split = countryAndPot.split(breakpoint)
    // const match = input.match(regex);

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

let takeCountry = (data, priority, drawnPriority = 0, printInfo = true) => {
    data.drawnCountry = priority.country
    data.drawnCountryPot = priority.pot
    data.drawnPriority = drawnPriority
    drawnPlayers.add(data.participant)

    takenCountries.add(priority.country)
    if (!takenCountriesByPot[priority.pot]) return;
    takenCountriesByPot[priority.pot].taken.add(priority.country)

    const countriesAlreadyDrawnFromPot = takenCountriesByPot[priority.pot].taken.size
    // if (countriesAlreadyDrawnFromPot == 1) {
    //     potsWithAtLeastOneTakenCountry += 1
    //     const drawnSemi = (potsWithAtLeastOneTakenCountry % 2 == 0) ? 2 : 1
    //     data.drawnSemi = drawnSemi
    //     takenCountriesByPot[priority.pot].firstDrawnSemi = drawnSemi
    // } else {
    // }
    data.drawnSemi = (takenCountriesByPot[priority.pot].firstDrawnSemi + countriesAlreadyDrawnFromPot + 1) % 2 == 0 ? 2 : 1

    if (printInfo) {
        console.log(`${data.participant} gets ${priority.country}, number ${countriesAlreadyDrawnFromPot} drawn from pot ${priority.pot}`);
        console.log(`${priority.country} will compete is semi final ${data.drawnSemi}`);
        console.log(`${takenCountries.size} country/countries has/have already been taken`);
        console.log(takenCountriesByPot)
    }
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

function drawRandomly(drawSplit) {
    let drawArray
    if (drawSplit.playersFirstHalf.length > 0) drawArray = drawSplit.playersFirstHalf
    else if (drawSplit.playersSecondHalf.length > 0) drawArray = drawSplit.playersSecondHalf
    else if (drawSplit.top5.length > 0) drawArray = drawSplit.top5
    else return "end"

    const randomIndex = Math.floor(Math.random() * drawArray.length)
    const randomPlayer = drawArray[randomIndex]
    drawArray.splice(randomIndex, 1)

    return randomPlayer
}

const groupBy = (array, fn) => {
    return array.reduce((result, item) => {
      const key = fn(item);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
      return result;
    }, {});
  };

function readDrawSplit() {
    const fileName = "EMSC - Split for Draw.xlsx"
    const participantColumn = "EMSC 2503 - Draw Split "

    const workbook = readFile(fileName);
    let workbook_sheet = workbook.SheetNames;
    let splitStats = utils.sheet_to_json(
        workbook.Sheets[workbook_sheet[0]]
    );

    let groupedArray = groupBy(splitStats, x => x["__EMPTY"])
    let split = {
        playersFirstHalf : [],
        playersSecondHalf : [],
        top5 : []
    }
    split.playersFirstHalf = groupedArray["1st part"].map(x => x[participantColumn])
    split.playersSecondHalf = groupedArray["2nd part"].map(x => x[participantColumn])
    split.top5 = groupedArray["Top5"].map(x => x[participantColumn])
    console.log(split)

    return split
}

function makeDraw(excelstats, useUserInput = true) {
    drawnPlayers.clear()
    takenCountries.clear()
    for (let i = 0; i <= 6; i++) {
        // takenCountriesByPot[i].firstDrawnSemi = 0
        takenCountriesByPot[i].taken.clear()
    }
    // potsWithAtLeastOneTakenCountry = 0

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

        let pretakenData = entry["EMSC2503 - Lisbon / Portugal"] // TODO: fix column name
        if (pretakenData && (pretakenData.includes("-") || pretakenData.includes("–"))) {
            const drawnData = parseCountryAndPot(pretakenData)
            obj.drawnCountry = drawnData.country
            obj.drawnCountryPot = drawnData.pot
            hasPreChosen = true
            takenCountries.add(drawnData.country)
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
            // for (let i = 1; i <= 6; i++) {
            //     if (takenPots[i] != 1) {
            //         console.log(`${obj.participant}'s priotities are not valid. Pot ${i} is represented ${takenPots[i]} in his/her list`)
            //     }
            // }
        }

        drawData.set(entry["__EMPTY_1"], obj)
    }

    let players = Array.from(drawData.keys())
    let drawSplit =  readDrawSplit()

    let getPlayer = (shortname) => {
        if (!shortname) {
            console.log("short name not found")
            return []
        }
        return players.filter(x => x.toLowerCase().startsWith(shortname.toLowerCase()))
    }

    // renameProperty(stats, "__EMPTY_1", 'Patricipant')

    if (useUserInput) console.log(drawData)

    let pretakenMode = false
    let drawnOrder = 0

    for (let i = 0; ; i++) { // drawData.length
        let drawnPlayerShortName
        if (useUserInput) {
            drawnPlayerShortName = question('Player? ');
        } else {
            drawnPlayerShortName = drawRandomly(drawSplit)
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
            takeCountry(data, cntryAndPot, 0, useUserInput)
            continue;
        }

        let countryTaken = false
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
                countryTaken = true
                takeCountry(data, priority, j, useUserInput)
                break;
            }
        }

        if (!countryTaken) {
            console.log(`Player ${drawnPlayer} is not assigned a country since all of his priorities are taken`)
            data.drawnPriority = 6
        }

        if (useUserInput) console.log("");
    }

    if (useUserInput) {
        console.log(drawData)
    }

    let semi1Count = 0
    let semi2Count = 0
    drawData.forEach((value) => {
        if (value.drawnCountry && value.drawnCountryPot && value.drawnSemi) {
            console.log(value)
            if (value.drawnSemi == 1) semi1Count++
            else if (value.drawnSemi == 2) semi2Count++
        }
    });


    if (useUserInput) {
        console.log(`Countries in semi 1 ${semi1Count}`)
        console.log(`Countries in semi 2 ${semi2Count}`)
        writeOutputDrawData(drawData)
    }

    return drawData
}

let writeDrawSimulation = (drawSim) => {
    let drawSimulationFile = "DrawSimulation.xlsx"
    let settings = {
        fileName: drawSimulationFile, // Name of the resulting spreadsheet
        extraLength: 1, // A bigger number means that columns will be wider
        writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
        writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
        RTL: false, // Display the columns from right-to-left (the default value is false)
    }

    let drawSimList = [...drawSim.values()]
    let statsForExcelKeys = [
        { label: 'Participant', value: 'participant', format: "#0.00%"},
    ]

    for (let i = 0; i < 6; i++) {
        console.log(i)
        statsForExcelKeys.push({
            label : `Prio ${i + 1}`,
            value : (row) => {
                if (row.priorities[i]) {
                    return row.priorities[i].country + " - " + parseFloat(row.accDrawnPercentage[i]).toFixed(2) + "%"
                } else {
                    return ""
                }
            },
            format: "#0.00%"
       })
    }

    statsForExcelKeys.push({
        label : "No Drawn Country",
        value : row => row.accDrawnPercentage[6] + "%"
    })

    let dataForExcel = [
        {
            sheet: "DrawSim",
            columns: statsForExcelKeys,
            content: drawSimList,
        }
    ]

    xlsx(dataForExcel, settings)
}

function makeDrawSimulation(excelStats) {
    let drawSimulationCount = 5000
    let accumulatedDrawData = new Map()
    let accumulatedTakeCountries = new Map()

    let firstDrawData = makeDraw(excelStats, false)
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
        accData.accDrawnPriorities[data.drawnPriority] += 1

        accData.accDrawnPercentage = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
        accData.accDrawnPercentage[data.drawnPriority] += (1 / drawSimulationCount) * 100

        accumulatedDrawData.set(data.participant, accData)
    })
    // accumulatedDrawData

    for (let i = 1; i < drawSimulationCount; i++) {
        let drawnData = makeDraw(excelStats, false)
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
            if (data.drawnCountry || data.drawnPriority == 6 ) {
                accumulatedDrawData.get(data.participant).accDrawnPriorities[data.drawnPriority]++
                accumulatedDrawData.get(data.participant).accDrawnPercentage[data.drawnPriority] += (1 / drawSimulationCount) * 100
            } else {
                console.log(`Player ${data.participant} hasn't drawn any country`)
            }
        })

        // combine accumulated datas
    }

    // accumulatedDrawData.forEach((x, key) => {
    //     // console.log(`${x.participant} -> ${x.priorities} - ${x.accDrawnPriorities}`)
    //     console.log(`${x.participant}`)
    //     console.log(x.priorities.map(y => y.country).join(','))
    //     // console.log(x.priorities)
    //     console.log(`${x.accDrawnPriorities}`)
    //     console.log(`${x.accDrawnPercentage}`)
    //     console.log("\n")
    // })

    writeDrawSimulation(accumulatedDrawData)
}

// readDrawSplit()
    // console.log(accumulatedDrawData)

// user input
const workbook = readFile(fileName);
let workbook_sheet = workbook.SheetNames;
let excelStats = utils.sheet_to_json(
    workbook.Sheets[workbook_sheet[0]]
);
excelStats = excelStats.filter(x => x.hasOwnProperty("__EMPTY_4"))


// makeDrawSimulation(excelStats)
makeDraw(excelStats, true)


