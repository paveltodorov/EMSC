import { scoreGridData } from './ScoreGrids.js';
import { getServerData, getGridListFromScoreGridData } from './StatsUpdater.js';
import fs from 'fs';

// let getGridFullData = async () => {
let grids = getGridListFromScoreGridData(scoreGridData);

async function sleep(msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
}

let fullGrids = await grids
    .slice(28, grids.lenght)
    .filter(grid => grid.data && grid.data.menu)
    .map(async (grid) => {
        let gridLink = grid.data.menu.view;
        // sleep(10000);
        let serverData = await getServerData(gridLink);
        // sleep(10000);
        if (!serverData) return grid;
        grid.serverData = serverData;
        return grid;
    });

Promise.all(fullGrids).then(values => {
    // fs.appendFile("ScoreboardsBackup", JSON.stringify(values), err => console.log(err));
    // fs.writeFile("ScoreboardsBackup", JSON.stringify(values), err => console.log(err));
})

// for (let grid in grids) {
//     if (!grid || !grid.data || !grid.data.menu) continue;
//     let gridLink = grid.data.menu.view;
//     getServerData(gridLink).then(data => grid.getServerData = data);
//     sleep(1000);
// }

// fs.writeFile("ScoreboardsBackup", JSON.stringify(grids), err => console.log(err));




