const fileName = "EMSC STATISTICS UPDATED.xlsx"

const xlsx = require('xlsx');
// const jsonToTable = require("json-excel-style")
const jsonToTable = require("json-as-xlsx")
const axios = require("axios");
// const {flag} = require('country-emoji');

// table with id sheet
// div id = "full ranking"



async function main() {
    const finalJuryLink = "https://scorewiz.eu/scoreboard/sheet/664031/emsc-2304---grand-final/PsSWRDPW";
    const pageHtml = await axios.get(finalJuryLink); 
    console.log(pageHtml.data);
}

main();


// {wiz: {…}, juries: {…}, participants: {…}, televote: Array(25)}
  // const serverData = JSON.parse(serverJson); 
// serverData