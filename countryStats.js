const fileName = "EMSC STATISTICS UPDATED.xlsx"

// const jsonToTable = require("json-excel-style")
import xlsxPkg from 'xlsx';
const {readFile, utils} = xlsxPkg;
import xlsx from "json-as-xlsx";
import { flag } from 'country-emoji';

export let flagNew = country => {
  if (country == "Türkiye") return flag("Turkey");
  return flag(country);
}

let pretifyPosition = (pos , qualCount) => pos <= 25 ? pos : "SF-" + (pos - 25 + qualCount);
// json-excel-style

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
const Positions_Count = 38;
const Positions_Semi_Count = 24;

const Artist_Rest_Editions_Count = 12

let exponentRankPoints = rank => multiplier * Math.pow(base, rank - 1);
// for (i = 1; i < 50; i++) {
//   console.log(exponentRankPoints(i));
// }
const sortCriteria_t = {
  sum : "sum",
  average : "average",
  expSum : "expSum",
  expAverage : "expAverage",
}

// TODO: move to utis
const pots = [];
pots[1] = new Set(["France" , "Germany" , "Italy" , "Russia" , "Spain" , "Sweden" , "United Kingdom"]);
pots[2] = new Set(["Australia", "Belgium", "Denmark", "Finland", "Iceland", "Ireland", "Israel", "The Netherlands", "Norway", "Turkey", /*..*/ "Türkiye", "Netherlands"]);
pots[3] = new Set(["Andorra", "Austria", "Cyprus", "Greece", "Luxembourg", "Malta", "Monaco", "Portugal", "San Marino", "Switzerland" ]);
pots[4] = new Set(["Croatia", "Estonia", "Hungary", "Latvia", "Lithuania", "Poland", "Romania", "Slovenia", "Serbia", "Ukraine"]);
pots[5] = new Set(["Albania", "Belarus", "Bosnia and Herzegovina", "Bulgaria", "Czechia", "Kazhakstan",  /* ... */ 'Kazakhstan',
  "Moldova", "Montenegro", "North Macedonia", "Slovakia"
]);
pots[6] = new Set(["Algeria", "Armenia", "Azerbaijan", "Egypt", "Georgia", "Jordan", "Lebanon", "Lybia", "Morocco", "Tunesia" , /* ... */ "Tunisia"]);

export let getPotDigit = country => {
    for (let i = 1; i <= 6; i++) {
        if (pots[i].has(country)) return i;
    }

    console.log(country);
    return "unknown";
}

export let getCountries = () => {
    return pots.flatMap(x => Array.from(x));
}

const workbook = readFile(fileName);
let workbook_sheet = workbook.SheetNames;

let stats = utils.sheet_to_json(
    workbook.Sheets[workbook_sheet[0]]
);

let countryStatsAccumulator = (acc, curr, qualCount) => {
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
            positions: Array.from({length: Positions_Count}, (_, i) => 0),
            positionsSemi: Array.from({length: Positions_Semi_Count}, (_, i) => 0),
            wins : 0,
            second : 0,
            third : 0,
            top3 : 0,
            top5 : 0,
            top10 : 0,
            top15 : 0,
            top20 : 0,
            medalsRank: 0,
            medalsSemiRank : 0,
            editions: []
        });
    }

    acc.get(curr.Country).editions[curr.Edition] = { rank : undefined, expPoints : undefined,  accAvgExpPoints : 0, accExpPoints : 0, rankAfterEdition : 0, rankMov: "-", bestRank: "", bestRankMov : ""};

    if (curr['Points Semi'] == 'WITHDRAWN') {
        acc.get(curr.Country).editions[curr.Edition].rank = "withdr.";
        acc.get(curr.Country).editions[curr.Edition].expPoints = "withdr.";
        return acc;
    };
    if (curr['Place Semi'] == 'DISQUALIFIED' || curr['Place Final'] == 'DISQUALIFIED')  {
        acc.get(curr.Country).editions[curr.Edition].rank = "disq.";
        acc.get(curr.Country).editions[curr.Edition].expPoints = "disq.";
        return acc;
    };

    const qualified = !!curr['Points Final'];
    const pointsToAdd = qualified ? curr['Points Final'] : curr['Points Semi'] / 2;
    acc.get(curr.Country).sumPoints += pointsToAdd;
    acc.get(curr.Country).editionsPlayed += 1;
    if (qualified) acc.get(curr.Country).editionsQualified += 1;

    const rank = curr['Place Final'] ? curr['Place Final'] : curr['Place Semi'] - qualCount + 25;
    acc.get(curr.Country).positions[rank] += 1;
    if (curr['Place Semi']) {
        acc.get(curr.Country).positionsSemi[curr['Place Semi']] += 1;
    } else {
        acc.get(curr.Country).positionsSemi[0] += 1;
    }
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

let countryStatsSorter = (x,y, sortCriteria) => {
    let diff = y[1].averageExpPoints - x[1].averageExpPoints;
    // console.log("diff " + diff);
    if ((!sortCriteria || sortCriteria == sortCriteria_t.expAverage)
        && (diff > 0.001 || diff < -0.001)) return diff;

    // console.log("Tie breaker rule: sum of expPoints " + y[1].expPoints);
    diff = y[1].expPoints - x[1].expPoints;
    // console.log("diff " + diff);
    if (sortCriteria == sortCriteria_t.expSum && (diff > 0.001 || diff < -0.001)) return diff;

    diff = y[1].averagePoints - x[1].averagePoints;
    // console.log("diff " + diff);
    if (sortCriteria == sortCriteria_t.average && (diff > 0.001 || diff < -0.001)) return diff;

    // console.log("Tie breaker rule: sum points " +  x[1].sumPoints);
    diff = y[1].sumPoints - x[1].sumPoints;
    // console.log("diff " + diff);
    if (sortCriteria == sortCriteria_t.sum && (diff > 0.001 || diff < -0.001)) return diff;

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
export let calculateCountryRanking = (stats, from, to, qualCount, compareToPrev, sortCriteria) => {
    let countryRanking = new Map();
    for (let edition = from; edition <= to; edition++) {
        countryRanking = stats
          .filter(x => x.Edition == edition)
          .reduce((accumulator, currentValue) =>
              countryStatsAccumulator(accumulator, currentValue, qualCount),
              countryRanking
          );

        countryRanking.forEach((info, coutry) => {
            info.averagePoints = info.sumPoints / info.editionsPlayed;
            info.averageExpPoints = info.expPoints / info.editionsPlayed;
            info.qualificationRate = info.editionsQualified / info.editionsPlayed;
        });

        countryRanking = new Map([...countryRanking.entries()]
            .sort((x, y) => countryStatsSorter(x, y, sortCriteria))
            .map((x, pos) => {
                if (!x[1].editions[edition]) x[1].editions[edition] = {
                  rank : undefined, expPoints : undefined,  accAvgExpPoints : 0,
                  accExpPoints : 0, rankAfterEdition : 0, rankMov: "-", bestRank: "", bestRankMov : ""
                };
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

    // transform array properties to properties
    let countryRankingList = [...countryRanking.entries()]
        .map((x, pos) => {
          let entry = x[1];

          let lastEditionStats = x[1].editions[to];
          entry.pos = lastEditionStats.rankAfterEdition;
          entry.posMov = lastEditionStats.rankMov;
          entry.bestRankMov = lastEditionStats.bestRankMov;

          entry.bestRank = pretifyPosition(entry.bestRank, qualCount);

          // potentially remove
          entry.editions.forEach((x,i) => {
            entry[i + " rank"] = !Number.isInteger(x.rank) ? x.rank : pretifyPosition(x.rank, qualCount);
            entry[i + " expPoints"] = x.expPoints;
            entry[i + " accAvgExpPoints"] = x.accAvgExpPoints;
            entry[i + " accExpPoints"] = x.accExpPoints;
            entry[i + " rankAfterEdition"] = x.rankAfterEdition;
            entry[i + " rankMov"] = x.rankMov;
            entry[i + " bestRank"] = pretifyPosition(x.bestRank, qualCount);
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
    for (let i = to; i >= from ; i--) {
        countryTableKeys.push({ label: 'Ed. ' + i + ' Rank',             value: i + ' rank'});
        countryTableKeys.push({ label: 'Ed. ' + i + ' Exp. Pts.',        value: i + ' expPoints'      , format: "#,##0.00" });
        countryTableKeys.push({ label: 'C. Pos. aft. E'       + i   , value: i + ' rankAfterEdition'});
        countryTableKeys.push({ label: 'C. Pos. Mov. aft. E'  + i   , value: i + ' rankMov'});
        // countryTableKeys.push({ label: 'Avg. Exp. Pts. aft. E'+ i , value: i + ' accAvgExpPoints', format: "#,##0.00"});
        // countryTableKeys.push({ label: 'Rank impr. af. E'    + i   , value: i + ' bestRankMov'});
        // countryTableKeys.push({ label: 'Exp. Pts. after Ed. ' + i         , value: i + ' accExpPoints', format: "#,##0.00"});
        // countryTableKeys.push({ label: 'Best Rank after Ed. ' + i         , value: i + ' bestRank'});
    }

    // set column names for positions stats
    let positionsKeys = [];
    positionsKeys.push({label: 'Medals Pos.', value: 'medalsRank'});
    positionsKeys.push({label: 'Country', value: 'country'});
    positionsKeys.push({label: 'Flag', value: 'flag'});
    for (let i = 1; i < Positions_Count; i++) {
        positionsKeys.push({label: " " + pretifyPosition(i, qualCount) + " ", value: row => row.positions[i] });
    }
    positionsKeys.push({label: "AQ", value: row => row.positionsSemi[0] });

    // set column names for positions semi stats
    let positionsSemiKeys = [];
    positionsSemiKeys.push({label: 'Medals Pos.', value: 'medalsSemiRank'});
    positionsSemiKeys.push({label: 'Country', value: 'country'});
    positionsSemiKeys.push({label: 'Flag', value: 'flag'});
    for (let i = 1; i < Positions_Semi_Count; i++) {
        positionsSemiKeys.push({label: "" + i + " ", value: row => row.positionsSemi[i] });
    }

    // cacluate sorted by positions
    let positionsStats = [...countryRankingList].sort((x,y) => {
        for (let i = 1; i < Positions_Count; ++i) {
            if (x.positions[i] != y.positions[i]) return y.positions[i] - x.positions[i];
        }
        return 0;
    }).map((x,i) => { x['medalsRank'] = i + 1; return x});

    let positionsSemiStats = [...countryRankingList].sort((x,y) => {
        for (let i = 1; i < Positions_Semi_Count; ++i) {
          if (x.positionsSemi[i] != y.positionsSemi[i]) return y.positionsSemi[i] - x.positionsSemi[i];
      }
      return 0;
    }).map((x,i) => { x.medalsSemiRank = i + 1; return x; });

    return {ranking: countryRankingList, keys: countryTableKeys, positionsKeys, positionsStats, positionsSemiKeys, positionsSemiStats};
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
            positions: Array.from({length: 56}, (_, i) => 0),
            positionsSemi: Array.from({length: 24}, (_, i) => 0),
        });
        acc.get(currPot).countriesParticipated += 1;
        acc.get(currPot).editionsPlayed += cur.editionsPlayed;
        acc.get(currPot).editionsQualified += cur.editionsQualified;
        acc.get(currPot).sumPoints += cur.sumPoints;
        acc.get(currPot).expPoints += cur.expPoints;

        acc.get(currPot).avgPointsOfCountries += cur.averagePoints;
        acc.get(currPot).avgExpPointsOfCountries += cur.averageExpPoints;
        acc.get(currPot).qualifRateOfCountries += cur.qualificationRate;

        // if (curr['Place Semi']) {
          // acc.get(curr.Country).positionsSemi[rank] += 1;
      // } else {
          // acc.get(curr.Country).positionsSemi[0] += 1;
      // }
        acc.get(currPot).positions += cur.positions;
        acc.get(currPot).positionsSemi += cur.positionsSemi;
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

let calculateArtistParticipations = (editionsData, currentEdition) => {
    let artistEntries = new Map()

    editionsData.forEach(x => {
        const delimiters = /\s*(?: x | X |%| &|ft\.|FT\.|\+|feat\.|,|f\.)\s*/g
        const artists = x.Artist.replace(" $1").split(delimiters)
            .map(word => word.trim())
            .filter(word => word !== "");

        artists.forEach(artist => {

            let artistLowerCase = artist.toLowerCase()
            if (atristsWithSameName.has(artistLowerCase)) {
                artistLowerCase = `${artistLowerCase} (${x.Country})`
            }

            if (artistEntries.has(artistLowerCase)) {
                let entry = artistEntries.get(artistLowerCase)
                entry.participations.push(x.Edition)
                entry.countries.add(x.Country)
            }
            else {
                let artistEntry = {};
                artistEntry.artist = artist
                artistEntry.participations = []
                artistEntry.participations.push(x.Edition)
                artistEntry.countries = new Set()
                artistEntry.countries.add(x.Country)

                artistEntries.set(artistLowerCase, artistEntry)
            }
        })
    })

    artistEntries.forEach((entry, artistName) => {
        console.log(`${entry}: ${artistName}`);
        entry.partipationsCount = entry.participations.length

        entry.canParticipate =
            !entry.participations[entry.partipationsCount - 3] ||
            entry.participations[entry.partipationsCount - 3] + 10 < currentEdition


        if (!entry.canParticipate) entry.canReturnInEdition = entry.participations[entry.partipationsCount - 1] + 7
        // if (entry.partipationsCount % 3 != 0) {
        //     entry.canParticipate = true
        //     entry.canReturnInEdition = 0
        // } else {
        //     entry.canReturnInEdition = entry.participations[entry.partipationsCount - 1] + Artist_Rest_Editions_Count + 1
        //     entry.canParticipate = currentEdition >= entry.canReturnInEdition
        // }

    })

    return artistEntries
}

// console.log(potRanking);
let calculateAndWriteCountryRanking = () => {
  const countryStats = calculateCountryRanking(stats, 1, 19, 12, true);
  const countryStats2021 = calculateCountryRanking(stats, 1, 5, 12, true);
  const countryStats2022 = calculateCountryRanking(stats, 6, 10, 12, true);
  const countryStats2023 = calculateCountryRanking(stats, 11, 15, 12, true);
  const countryStats2024 = calculateCountryRanking(stats, 16, 19, 12, true);
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
      sheet: "CountryRanking2024",
      columns: countryStats2024.keys,
      content: countryStats2024.ranking,
    },
    {
      sheet: "PotRanking",
      columns: potStats.keys,
      content: potStats.ranking,
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
    fileName: "CountryRankingAfterE19", // Name of the resulting spreadsheet
    extraLength: 1, // A bigger number means that columns will be wider
    writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
    writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
    RTL: false, // Display the columns from right-to-left (the default value is false)
  }

  xlsx(data, settings) // uncomment to save to file

  // let shortMedalStats = countryStats.positionsStats.map((entry, idx) => {
  //     return {flag: entry.flag, country: entry.country, positions: entry.positions}
  // });
}
let atristsWithSameName = new Set(["alma"])
let calculateAndWriteArtistStats = (stats, currentEdition) => {
    let artistsStats = calculateArtistParticipations(stats, currentEdition)

    let artistsStatsForExcel = [...artistsStats.values()].sort((x,y) => {
        if (y.canParticipate == x.canParticipate) {
            if (y.partipationsCount != x.partipationsCount) {
                return y.partipationsCount - x.partipationsCount
            }
            else {
                return x.artist.localeCompare(y.artist)
            }
        }

        return y.canReturnInEdition - x.canReturnInEdition
    })
    let keys = [
        { label: 'Artist', value: 'artist' },
        { label: 'Countries Represented',
            value: row => Array.from(row.countries)
                .map(country => `${country} ${flagNew(country)}`)
                .join(', ')
        },
        { label: 'Can Participate', value: row => row.canParticipate ? "Yes" : "No" },
        { label: 'Can Return In Edition', value: row => row.canReturnInEdition ? row.canReturnInEdition : "" },
        { label: 'Participations', value: 'partipationsCount' }
    ]

    for (let i = 0; i < 6; i++) {
        keys.push({
            label : `Participation ${i + 1} in edition`,
            value : row => {
                if (row.participations[i]) return row.participations[i]
                return ""
            }
        })
    }

    let data = [
      {
        sheet: "ArtistStats",
        columns: keys,
        content: artistsStatsForExcel,
      },
    ]

    let settings = {
      fileName: "ArtistStats", // Name of the resulting spreadsheet
      extraLength: 1, // A bigger number means that columns will be wider
      writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
      writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
      RTL: false, // Display the columns from right-to-left (the default value is false)
    }

    // log blocked artists
    artistsStatsForExcel.filter(x => !x.canParticipate).forEach(x => {
        let countriesWithflags = Array.from(x.countries)
                .map(country => `${country} ${flagNew(country)}`)
                .join(', ')
        console.log(`${x.artist} - ${countriesWithflags}`)
    })

    xlsx(data, settings) // uncomment to save to file
}

// calculateAndWriteCountryRanking()

calculateAndWriteArtistStats(stats, 20)

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
