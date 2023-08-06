const fileName = "EMSC STATISTICS UPDATED.xls"

const xlsx = require('xlsx');

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

const workbook = xlsx.readFile(fileName);
let workbook_sheet = workbook.SheetNames;

let stats = xlsx.utils.sheet_to_json(
    workbook.Sheets[workbook_sheet[0]]
);

// country ranking
let countryRanking = stats.reduce((acc, curr) => {
    if (curr['Points Semi'] == 'WITHDRAWN') return acc;
    if (curr['Place Semi'] == 'DISQUALIFIED' || curr['Place Final'] == 'DISQUALIFIED') return acc; 

    if (!acc.has(curr.Country)) acc.set(curr.Country, {sumPoints : 0, editionsPlayed : 0, expPoints : 0});

    const pointsToAdd = curr['Points Final'] ? curr['Points Final'] : curr['Points Semi'] / 2;
    acc.get(curr.Country).sumPoints += pointsToAdd;
    acc.get(curr.Country).editionsPlayed += 1

    const rank = curr['Place Final'] ? curr['Place Final'] : curr['Place Semi'] - 12 + 25;
    acc.get(curr.Country).expPoints += exponentRankPoints(rank);
    return acc;
}, new Map()); 

countryRanking.forEach((info, coutry) => {
  info.averagePoints = info.sumPoints / info.editionsPlayed;
  info.averageExpPoints = info.expPoints / info.editionsPlayed; 
});

let sotredByExpPoints =
  [...countryRanking.entries()].sort((x,y) => y[1].averageExpPoints - x[1].averageExpPoints).map(x => [x[0], x[1].averageExpPoints]);
// console.log(sotredByExpPoints);  

let sotredByPoints =
  [...countryRanking.entries()].sort((x,y) => y[1].averagePoints - x[1].averagePoints).map(x => [x[0], x[1].averagePoints]);
// console.log(sotredByPoints);  

// pot ranking
const pot1 = new Set(["France" , "Germany" , "Italy" , "Russia" , "Spain" , "Sweden" , "United Kingdom"]);
const pot2 = new Set(["Australia", "Belgium", "Denmark", "Finland", "Iceland", "Ireland", "Israel", "The Netherlands", "Norway", "Turkey", /*..*/ "Türkiye"]);
const pot3 = new Set(["Andorra", "Austria", "Cyprus", "Greece", "Luxembourg", "Malta", "Monaco", "Portugal", "San Marino", "Switzerland" ]);
const pot4 = new Set(["Croatia", "Estonia", "Hungary", "Latvia", "Lithuania", "Poland", "Romania", "Slovenia", "Serbia", "Ukraine"]);
const pot5 = new Set(["Albania", "Belarus", "Bosnia and Herzigovina", "Bulgaria", "Czechia", "Kazhakstan",  /* ... */ 'Kazakhstan',
  "Moldova", "Montenegro", "North Macedonia", "Slovakia"
]); // rename to "Bosnia and Herzegovina"
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

// console.log(...countryRanking.entries())

let potRanking = [...countryRanking.entries()].reduce((acc, curr) => {
    const currPot = getPot(curr[0]);
    if (!acc.has(currPot)) acc.set(currPot, { editionsPlayed: 0, sumPoints: 0, expPoints: 0, averagePoints: 0, averageExpPoints: 0 });
    acc.get(currPot).editionsPlayed += curr[1].editionsPlayed;
    acc.get(currPot).sumPoints += curr[1].sumPoints;
    acc.get(currPot).expPoints += curr[1].expPoints;
    acc.get(currPot).averagePoints += curr[1].averagePoints;
    acc.get(currPot).averageExpPoints += curr[1].averageExpPoints;
    return acc;
}, new Map());

console.log(potRanking);

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
