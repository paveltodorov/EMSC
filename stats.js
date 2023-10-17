const fileName = "EMSC STATISTICS UPDATED.xlsx"

const xlsx = require('xlsx');
// const jsonToTable = require("json-excel-style")
const jsonToTable = require("json-as-xlsx")
const {flag} = require('country-emoji');

let flagNew = country => {
  if (country == "Türkiye") return flag("Turkey");
  return flag(country);
}

let pretifyPosition = pos => pos <= 25 ? pos : "SF-" + (pos - 13);
// json-excel-style

// import { xlsx } from "xlsx";
// import { jsonExcel } from "json-excel-style";

// sample format format
// [{
//   Edition: 3,
//   Country: 'The Netherlands',
//   Artist: 'Regi with Jake Reese & OT',
//   Song: 'Summer life',
//   SF: 2,
//   'Place Final': 20, // optional
//   'Points Final': 52, // optional
//   'Place Semi': 11,
//   'Points Semi': 51,
//   HOD: 'Sven Van der Lelie'
// }]

const base = 0.9;
const multiplier = 100;
let exponentRankPoints = rank => multiplier * Math.pow(base, rank - 1);
// for (i = 1; i < 50; i++) {
//   console.log(exponentRankPoints(i));
// }

const pot1 = new Set(["France" , "Germany" , "Italy" , "Russia" , "Spain" , "Sweden" , "United Kingdom"]);
const pot2 = new Set(["Australia", "Belgium", "Denmark", "Finland", "Iceland", "Ireland", "Israel", "The Netherlands", "Norway", "Turkey", /*..*/ "Türkiye"]);
const pot3 = new Set(["Andorra", "Austria", "Cyprus", "Greece", "Luxembourg", "Malta", "Monaco", "Portugal", "San Marino", "Switzerland" ]);
const pot4 = new Set(["Croatia", "Estonia", "Hungary", "Latvia", "Lithuania", "Poland", "Romania", "Slovenia", "Serbia", "Ukraine"]);
const pot5 = new Set(["Albania", "Belarus", "Bosnia and Herzegovina", "Bulgaria", "Czechia", "Kazhakstan",  /* ... */ 'Kazakhstan',
  "Moldova", "Montenegro", "North Macedonia", "Slovakia"
]);
const pot6 = new Set(["Algeria", "Armenia", "Azerbaijan", "Egypt", "Georgia", "Jordan", "Lebanon", "Lybia", "Morocco", "Tunesia" , /* ... */ "Tunisia"]);

let getPot = country => { 
    if (pot1.has(country)) return 'pot1';
    if (pot2.has(country)) return 'pot2';
    if (pot3.has(country)) return 'pot3';
    if (pot4.has(country)) return 'pot4';
    if (pot5.has(country)) return 'pot5';
    if (pot6.has(country)) return 'pot6';
    console.log(country);
    return "unknown";
}

let getPotDigit = country => { 
    if (pot1.has(country)) return 1;
    if (pot2.has(country)) return 2;
    if (pot3.has(country)) return 3;
    if (pot4.has(country)) return 4;
    if (pot5.has(country)) return 5;
    if (pot6.has(country)) return 6;
    console.log(country);
    return "unknown";
}

const workbook = xlsx.readFile(fileName);
let workbook_sheet = workbook.SheetNames;

let stats = xlsx.utils.sheet_to_json(
    workbook.Sheets[workbook_sheet[0]]
);

let countryStatsAccumulator = (acc, curr) => {
    if (!acc.has(curr.Country)) { 
        acc.set(curr.Country, {
            pos : 0,
            posMov : "new",
            country: curr.Country,
            flag: flagNew(curr.Country),
            pot: getPotDigit(curr.Country),
            averageExpPoints : 0,
            expPoints : 0, 
            averagePoints : 0,
            sumPoints : 0, 
            editionsPlayed : 0, 
            editionsQualified : 0, 
            qualificationRate : 0,
            bestRank : 1000, 
            bestRankMov : "new",
            bestEdition : "",
            bestHod : "",  
            bestEntry: "",
            wins : 0,
            second : 0,
            third : 0,
            top3 : 0,
            top5 : 0,
            top10 : 0,
            top15 : 0,
            top20 : 0,
            editions: []
        });
    }

    acc.get(curr.Country).editions[curr.Edition] = { rank : undefined, expPoints : undefined,  accAvgExpPoints : 0, accExpPoints : 0, rankAfterEdition : 0, rankMov: "-", bestRank: "", bestRankMov : ""};

    if (curr['Points Semi'] == 'WITHDRAWN') { 
        acc.get(curr.Country).editions[curr.Edition].rank = "withdr.";
        acc.get(curr.Country).editions[curr.Edition].expPoints = "withdr.";
        return acc 
    };
    if (curr['Place Semi'] == 'DISQUALIFIED' || curr['Place Final'] == 'DISQUALIFIED')  { 
        acc.get(curr.Country).editions[curr.Edition].rank = "disq.";
        acc.get(curr.Country).editions[curr.Edition].expPoints = "disq.";
        return acc 
    };

    const qualified = !!curr['Points Final'];
    const pointsToAdd = qualified ? curr['Points Final'] : curr['Points Semi'] / 2;   
    acc.get(curr.Country).sumPoints += pointsToAdd;
    acc.get(curr.Country).editionsPlayed += 1;
    if (qualified) acc.get(curr.Country).editionsQualified += 1;  

    const rank = curr['Place Final'] ? curr['Place Final'] : curr['Place Semi'] - 12 + 25;
    if (rank == 1) acc.get(curr.Country).wins += 1; 
    if (rank == 2) acc.get(curr.Country).second += 1; 
    if (rank == 3) acc.get(curr.Country).third += 1; 
    if (rank <= 3) acc.get(curr.Country).top3 += 1;
    if (rank <= 5) acc.get(curr.Country).top5 += 1;
    if (rank <= 10) acc.get(curr.Country).top10 += 1;
    if (rank <= 15) acc.get(curr.Country).top15 += 1;  
    if (rank <= 20) acc.get(curr.Country).top20 += 1;  

    const expPoints = exponentRankPoints(rank);
    acc.get(curr.Country).expPoints += exponentRankPoints(rank);

    // calculate best rank, entry and HoD
    if (rank < acc.get(curr.Country).bestRank) {
        acc.get(curr.Country).bestRank = rank;
        acc.get(curr.Country).bestEdition = curr.Name;
        acc.get(curr.Country).bestHod = curr.HOD;
        acc.get(curr.Country).bestEntry = curr.Song + " - " + curr.Artist;
    } else if (rank == acc.get(curr.Country).bestRank) {
        acc.get(curr.Country).bestEdition = acc.get(curr.Country).bestEdition + " & " + curr.Name;
        acc.get(curr.Country).bestHod = acc.get(curr.Country).bestHod + " & " + curr.HOD;
        acc.get(curr.Country).bestEntry = acc.get(curr.Country).bestEntry + " && " + curr.Song + " - " + curr.Artist;
    }

    acc.get(curr.Country).editions[curr.Edition].rank = rank;
    acc.get(curr.Country).editions[curr.Edition].expPoints = expPoints;
    
    return acc;
}

let countryStatsSorter = (x,y) => {
    let diff = y[1].averageExpPoints - x[1].averageExpPoints;
    // console.log("diff " + diff); 
    if (diff > 0.001 || diff < -0.001) return diff;

    // console.log("Tie breaker rule: sum of expPoints " + y[1].expPoints);    
    diff = y[1].expPoints - x[1].expPoints;
    // console.log("diff " + diff); 
    if (diff > 0.001 || diff < -0.001) return diff;

    diff = y[1].averagePoints - x[1].averagePoints;
    // console.log("diff " + diff); 
    if (diff > 0.001 || diff < -0.001) return diff;

    // console.log("Tie breaker rule: sum points " +  x[1].sumPoints);
    diff = y[1].sumPoints - x[1].sumPoints;
    // console.log("diff " + diff); 
    if (diff > 0.001 || diff < -0.001) return diff;

    // console.log("Tie breaker rule: pot " + x[1].country + " " + y[1].country);
    diff = getPotDigit(y[1].country) - getPotDigit(x[1].country);
    // console.log("diff " + diff); 

    if (diff > 0.001 || diff < -0.001) return diff;

    // console.log("Tie breaker rule: alphabetical order");
    diff = (x[1].country).localeCompare(y[1].country);
    // console.log("diff " + diff); 
    if (diff > 0.001 || diff < -0.001) return diff;
}


// country ranking
let calculateCountryRanking = (from, to, compareToPrev) => {
    let countryRanking = new Map();
    for (let edition = from; edition <= to; edition++) {
        countryRanking = stats.filter(x => x.Edition == edition).reduce(countryStatsAccumulator, countryRanking); 

        countryRanking.forEach((info, coutry) => {
            info.averagePoints = info.sumPoints / info.editionsPlayed;
            info.averageExpPoints = info.expPoints / info.editionsPlayed; 
            info.qualificationRate = info.editionsQualified / info.editionsPlayed;
        });

        countryRanking = new Map([...countryRanking.entries()]
            .sort(countryStatsSorter)
            .map((x, pos) => { 
                if (!x[1].editions[edition]) x[1].editions[edition] =  { rank : undefined, expPoints : undefined,  accAvgExpPoints : 0, accExpPoints : 0, rankAfterEdition : 0, rankMov: "-", bestRank: "", bestRankMov : ""}; 
                x[1].editions[edition].accAvgExpPoints = x[1].averageExpPoints;
                x[1].editions[edition].accExpPoints = x[1].expPoints;

                x[1].editions[edition].rankAfterEdition = pos + 1;
                let prevEditionStats = x[1].editions[edition - 1];
                let prevAccRank = prevEditionStats ? prevEditionStats.rankAfterEdition : undefined;
                x[1].editions[edition].rankMov = prevAccRank ? prevAccRank - (pos + 1) : "new";

                x[1].editions[edition].bestRank = x[1].bestRank;
                const currRank = x[1].editions[edition].rank;
                if (currRank) {
                    let prevBestRank = prevEditionStats ? prevEditionStats.bestRank : undefined;
                    if (!prevBestRank) x[1].editions[edition].bestRankMov = "new";
                    else if (prevBestRank == currRank) x[1].editions[edition].bestRankMov = "tie";
                    else if (prevBestRank < currRank) x[1].editions[edition].bestRankMov = "";
                    else if (prevBestRank > currRank) x[1].editions[edition].bestRankMov =  prevBestRank - currRank;
                }

                return x;
        }));
    }

    let countryRankingList = [...countryRanking.entries()]
        .map((x, pos) => { 
          let entry = x[1];

          let lastEditionStats = x[1].editions[to];
          entry.pos = lastEditionStats.rankAfterEdition;
          entry.posMov = lastEditionStats.rankMov;
          entry.bestRankMov = lastEditionStats.bestRankMov;

          entry.bestRank = pretifyPosition(entry.bestRank);
          entry.editions.map((x,i) => { 
            entry[i + " rank"] = !Number.isInteger(x.rank) ? x.rank : pretifyPosition(x.rank);
            entry[i + " expPoints"] = x.expPoints; 
            entry[i + " accAvgExpPoints"] = x.accAvgExpPoints; 
            entry[i + " accExpPoints"] = x.accExpPoints; 
            entry[i + " rankAfterEdition"] = x.rankAfterEdition; 
            entry[i + " rankMov"] = x.rankMov; 
            entry[i + " bestRank"] = pretifyPosition(x.bestRank);
            entry[i + " bestRankMov"] = x.bestRankMov;     
          });
          return x[1];
      });
    // console.log(countryRanking);    

    // set column names    
    const countryTableKeys = [
    { label: 'Pos.', value: 'pos' },
    { label: 'Pos. Mov.', value: 'posMov' },
    { label: 'Flag', value: 'flag' },
    { label: 'Country', value: 'country' },
    { label: 'Pot', value: 'pot' },
    { label: 'Avg. Exp. Pts.', value: 'averageExpPoints', format: "#,##0.00"},
    { label: 'Exp. Pts.', value: 'expPoints', format: "#,##0.00"},
    { label: 'Avg. Pts.', value: 'averagePoints', format: "#,##0.00" },
    { label: 'Sum Pts.', value: 'sumPoints' },
    { label: 'Ed. Played', value: 'editionsPlayed' },
    { label: 'Ed. Qualified', value: 'editionsQualified' },
    { label: 'Qualif. Rate', value: 'qualificationRate',  format: "#0%" },
    { label: 'Best Rank', value: 'bestRank' },
    { label: 'Best Rank Mov.', value: 'bestRankMov' },
    { label: 'Best Rank Edition(s)', value: 'bestEdition' },
    { label: 'Best Rank HoD(s)', value: 'bestHod' },
    { label: 'Best Ranked Entry/Entries', value: 'bestEntry' },
    { label: 'Wins', value: 'wins' },
    { label: '2nd Places', value: 'second' },
    { label: '3rd Places', value: 'third' },
    { label: 'Top 3', value: 'top3' },
    { label: 'Top 5', value: 'top5' },
    { label: 'Top 10', value: 'top10' },
    { label: 'Top 15', value: 'top15' },
    { label: 'Top 20', value: 'top20' }];
    for (i = to; i >= from ; i--) {
        countryTableKeys.push({ label: 'Ed. ' + i + ' Rank',             value: i + ' rank'});
        countryTableKeys.push({ label: 'Ed. ' + i + ' Exp. Pts.',        value: i + ' expPoints'      , format: "#,##0.00" });
        countryTableKeys.push({ label: 'Avg. Exp. Pts. aft. E'+ i , value: i + ' accAvgExpPoints', format: "#,##0.00"});
        countryTableKeys.push({ label: 'C. Pos. aft. E'       + i   , value: i + ' rankAfterEdition'});
        countryTableKeys.push({ label: 'C. Pos. Mov. aft. E'  + i   , value: i + ' rankMov'});
        countryTableKeys.push({ label: 'Rank impr. af. E'    + i   , value: i + ' bestRankMov'}); 
         // countryTableKeys.push({ label: 'Exp. Pts. after Ed. ' + i         , value: i + ' accExpPoints', format: "#,##0.00"});
        // countryTableKeys.push({ label: 'Best Rank after Ed. ' + i         , value: i + ' bestRank'});
    }

    return {ranking: countryRankingList, keys: countryTableKeys};
};
// console.log(countryRankingList); 

// let sotredByExpPoints = 
//   [...countryRanking.entries()].sort((x,y) => y[1].averageExpPoints - x[1].averageExpPoints).map(x => [x[0], x[1].averageExpPoints]);
// // console.log(sotredByExpPoints);  

// let sotredByPoints =
//   [...countryRanking.entries()].sort((x,y) => y[1].averagePoints - x[1].averagePoints).map(x => [x[0], x[1].averagePoints]);
// console.log(sotredByPoints);  

// pot ranking

// console.log(...countryRanking.entries())
// console.log(countryRanking)

// console.log(countryRankingList[0]);
// output sheet
// Old way of calculating the keys
// const countryTableKeys = Object.keys(countryRankingList[2]).map(x => {
//     let obj = {}; 
//     obj.label = x;
//     obj.value = x; 
//     return obj;
// });


// console.log(countryTableKeys);

// pot ranking - will revive
function calculatePotRanking(countryStats) {
    let potRanking = [...countryStats.entries()].reduce((acc, curr) => {
        const cur = curr[1];
        const currPot = cur.pot;
        if (!acc.has(currPot)) acc.set(currPot, { 
            pot: currPot, 
            countriesParticipated : 0, 
            avgExpPointsOfParticipations : 0,
            avgExpPointsOfCountries: 0,
            expPoints: 0, 
            avgPointsOfParticipations : 0,
            avgPointsOfCountries: 0, 
            sumPoints: 0, 
            editionsPlayed: 0, 
            editionsQualified : 0,
            qualifRateOfParticipation : 0,
            qualifRateOfCountries : 0,
            wins : 0,
            second : 0,
            third : 0,
            top3 : 0,
            top5 : 0,
            top10 : 0,
            top15 : 0,
            top20: 0,
        });
        acc.get(currPot).countriesParticipated += 1;
        acc.get(currPot).editionsPlayed += cur.editionsPlayed;
        acc.get(currPot).editionsQualified += cur.editionsQualified;
        acc.get(currPot).sumPoints += cur.sumPoints;
        acc.get(currPot).expPoints += cur.expPoints;

        acc.get(currPot).avgPointsOfCountries += cur.averagePoints;
        acc.get(currPot).avgExpPointsOfCountries += cur.averageExpPoints;
        acc.get(currPot).qualifRateOfCountries += cur.qualificationRate;

        acc.get(currPot).wins += cur.wins; 
        acc.get(currPot).second += cur.second; 
        acc.get(currPot).third += cur.third; 
        acc.get(currPot).top3 += cur.top3;
        acc.get(currPot).top5 += cur.top5;
        acc.get(currPot).top10 += cur.top10;
        acc.get(currPot).top15 += cur.top15;  
        acc.get(currPot).top20 += cur.top20;    

        return acc;
    }, new Map());

    potRanking.forEach((info, pot) => {
      info.avgPointsOfCountries /= info.countriesParticipated;
      info.avgExpPointsOfCountries /= info.countriesParticipated;
      info.qualifRateOfCountries /= info.countriesParticipated;

      info.avgPointsOfParticipations = info.sumPoints / info.editionsPlayed;
      info.avgExpPointsOfParticipations = info.expPoints / info.editionsPlayed;
      info.qualifRateOfParticipation = info.editionsQualified / info.editionsPlayed;
    });

    let potRankingList = [...potRanking.entries()]
        .sort((x,y) => y[1].avgExpPointsOfParticipations - x[1].avgExpPointsOfParticipations) 
        .map(x => x[1]);

    const potTableKeys = Object.keys(potRankingList[0]).map(x => {
      let obj = {}; 
      obj.label = x.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      obj.value = x; 
      return obj;
    });

    console.log(potRankingList);
    console.log(potTableKeys);
    return {ranking: potRankingList, keys: potTableKeys};
}

// console.log(potRanking);
const countryStats = calculateCountryRanking(1, 14, true);
const countryStats2021 = calculateCountryRanking(1, 5, true);
const countryStats2022 = calculateCountryRanking(6, 10, true);
const countryStats2023 = calculateCountryRanking(11, 14, true);
// console.log(countryStats)

const potStats = calculatePotRanking(countryStats.ranking);
let data = [
  {
    sheet: "CountryRanking",
    columns: countryStats.keys,
    content: countryStats.ranking,
  },
  {
    sheet: "CountryRanking2021",
    columns: countryStats2021.keys,
    content: countryStats2021.ranking,
  },
  {
    sheet: "CountryRanking2022",
    columns: countryStats2022.keys,
    content: countryStats2022.ranking,
  },
  {
    sheet: "CountryRanking2023",
    columns: countryStats2023.keys,
    content: countryStats2023.ranking,
  },
  {
    sheet: "PotRanking",
    columns: potStats.keys,
    content: potStats.ranking,
  },
  // {
  //   sheet: "Children",
  //   columns: [
  //     { label: "Ed.User", value: "user" }, // Top level data
  //     { label: "Age", value: "age", format: '# "years"' }, // Column format
  //     { label: "Phone", value: "more.phone", format: "(###) ###-####" }, // Deep props and column format
  //   ],
  //   content: [
  //     { user: "Manuel", age: 16, more: { phone: 9999999900 } },
  //     { user: "Ana", age: 17, more: { phone: 8765432135 } },
  //   ],
  // },
];
// console.log(data);
 
let settings = {
  fileName: "CountryRankingAfterE14", // Name of the resulting spreadsheet
  extraLength: 1, // A bigger number means that columns will be wider
  writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
  writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
  RTL: false, // Display the columns from right-to-left (the default value is false)
}
 
jsonToTable(data, settings) 

// console.log(countryRanking);

// let countryRanking = stats.reduce((acc, curr) => {
//     if (curr['Points Semi'] == 'WITHDRAWN') return acc;
//     if (curr['Place Semi'] == 'DISQUALIFIED' || curr['Place Final'] == 'DISQUALIFIED') return acc; 

//     acc[curr.Country] = acc[curr.Country] ? acc[curr.Country] : {sumPoints : 0, editionsPlayed : 0, expPoints : 0};

//     const pointsToAdd = curr['Points Final'] ? curr['Points Final'] : curr['Points Semi'] / 2;
//     acc[curr.Country].sumPoints += pointsToAdd;
//     acc[curr.Country].editionsPlayed += 1

//     const rank = curr['Place Final'] ? curr['Place Final'] : curr['Place Semi'] - 12 + 25;
//     acc[curr.Country].expPoints += exponentRankPoints(rank);
//     return acc;
// }, {}); 

// for (country in countryRanking) {
//     countryRanking[country].averagePoints = countryRanking[country].sumPoints / countryRanking[country].editionsPlayed;
//     countryRanking[country].averageExpPoints = countryRanking[country].expPoints / countryRanking[country].editionsPlayed;  
// }

// console.log(countryRanking);
