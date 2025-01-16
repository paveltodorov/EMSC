import xlsxPkg from 'xlsx';
const { readFile, utils } = xlsxPkg;

export let readDrawFile = () => {
    const drawFileName = "EMSC-Draw.xlsx"

    const drawWorkbook = readFile(drawFileName);
    let workbook_sheet = drawWorkbook.SheetNames;
    let drawDataForEdition = utils.sheet_to_json(
        drawWorkbook.Sheets[workbook_sheet[0]], {header: 1}
    );
    return drawWorkbook
}
let getHodFromDrawFile = (drawWorkbook, edition, country) => {

}

function main() {
    const drawWorkbook = readDrawFile()
}

main()