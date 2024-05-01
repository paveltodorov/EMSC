import {flagNew} from "./countryStats.js";

let running = [
   { country: "Germany", scoreziwEntry: "Daniel Schuhmacher (GER) - Skin I'm in" }, // 1
   { country: "Croatia ", scoreziwEntry: "MARCELA () - Nismo Isti Svijet" },
   { country: "Australia", scoreziwEntry: "Sam Fischer (AUS) - All My Loving" }, // 1
   { country: "Tunisia", scoreziwEntry: "Elyanna & Balti (TUN) - Ghareeb Alay" },
   { country: "Ukraine", scoreziwEntry: "MONATIK (UKR) - Вічно танцююча людина" },
   { country: "Italy", scoreziwEntry: "Alessandra (ITA) - Pretty Devil" }, // 1
   { country: "Norway", scoreziwEntry: "Ruben (NOR) - Burn Down This Room" }, // 1
   { country: "Slovenia", scoreziwEntry: "Raiven (SLO) - Ofelija" }, // 1
   { country: "Jordan", scoreziwEntry: "Aziz x Adonis(JOR) - Nater" }, // 1
   { country: "Belgium", scoreziwEntry: "Mentissa : Mamma Mia (clip officiel) (B EL) - Mentissa Musique" },
   { country: "Finland", scoreziwEntry: "Elias Kaskinen (FIN) - Pelkään rakastaa sua" },
   { country: "Luxembourg", scoreziwEntry: "LINH (LUX) - Alors alors" }, // slow
   { country: "Sweden", scoreziwEntry: "Arwin (SWE) - More Than Just A Feeling" },
   { country: "France", scoreziwEntry: "Jeck () - Parapluie" },
   { country: "Romania", scoreziwEntry: "Carla's Dreams x EMAA (ROU) - N" },
   { country: "Estonia", scoreziwEntry: "STEFAN (EST) - Kiri külmkapi peal" }, // 2
   { country: "San Marino", scoreziwEntry: "Mahmood, Angèle (SMR) - SEMPRE / JAMAIS" },
   { country: "Armenia", scoreziwEntry: "Iveta Mukuchyan (ARM) - Tur Patjar" },
   { country: "Portugal", scoreziwEntry: "NUNO RIBEIRO (POR) - Rosa feat. CONAN OSIRIS" },
   { country: "Switzerland", scoreziwEntry: "Heaven Or Hell (SUI) - Remo Forrer" },
   { country: "United Kingdom", scoreziwEntry: "Becky Hill (UK) - Outside Of Love" }, // 2
   { country: "Czechia", scoreziwEntry: "The Silver Spoons (CZE) - Brain Issues" },
   { country: "Spain", scoreziwEntry: "Melody (ESP) - Mujer Loba" },
   { country: "Ireland", scoreziwEntry: "Niall Horan (IRL) - Heaven" },
   { country: "Monaco", scoreziwEntry: "Dépendance Affective (MON) - Gwennili - Topic" },
 ]

// Please make sure….1st half for Finland, Spain & Albania
// 2nd half for Armenia, Switzerland & Bulgaria

running.forEach((entry, idx) => {
   entry.flag = flagNew(entry.country);
   console.log(`${idx + 1}. ${entry.flag} ${entry.country}`)
})


let countries = [
"Spain",
"Australia",
"Ireland",
"Germany",
"France",
"Switzerland",
"Romania",
"Finland",
"Croatia",
"Estonia",
"Jordan",
"Armenia",
]

// countries.forEach((entry, idx) => {
//    let flag = flagNew(entry);
//    console.log(`${flag} ${entry}`)
// })


// {
//    sid: 692246,
//    pass: "4ubK8uhF",
//    flag1: "is",
//    __flag1: "Iceland",
//    name1: "Purple Disco Machine, ÁSDÍS (ISL) - Beat Of Your Heart",
//    sponsor1: "",
//    flag2: "it",
//    __flag2: "Italy",
//    name2: "Cian Ducrot, Matteo Romano (ITA) - Part Of Me",
//    sponsor2: "",
//    flag3: "cz",
//    __flag3: "Czechia",
//    name3: "Aiko (CZE) - Daughter of the Sun",
//    sponsor3: "",
//    flag4: "lu",
//    __flag4: "Luxembourg",
//    name4: "FAST BOY & Topic (LUX) - Forget You",
//    sponsor4: "",
//    flag5: "ch",
//    __flag5: "Switzerland",
//    name5: "Linda Elys (SUI) - House On Fire",
//    sponsor5: "",
//    flag6: "nl",
//    __flag6: "Netherlands",
//    name6: "CMC$ & Asher Angel (NED) - Nobody But You",
//    sponsor6: "",
//    flag7: "fi",
//    __flag7: "Finland",
//    name7: "Jenni Vartiainen (FIN) - Lanka",
//    sponsor7: "",
//    flag8: "es",
//    __flag8: "Spain",
//    name8: "Miriam Rodríguez (ESP) - Debilidad",
//    sponsor8: "",
//    flag9: "dk",
//    __flag9: "Denmark",
//    name9: "Malte Ebert (DEN) - Kalde Dem for Du",
//    sponsor9: "",
//    flag10: "ua",
//    __flag10: "Ukraine",
//    name10: "LOBODA (UKR) - Allo",
//    sponsor10: "",
//    flag11: "mc",
//    __flag11: "Monaco",
//    name11: "TIBZ (MON) - Tout au bout du monde",
//    sponsor11: "",
//    flag12: "sm",
//    __flag12: "San Marino",
//    name12: "Annalisa (SMR) - Euforia",
//    sponsor12: "",
//    flag13: "ie",
//    __flag13: "Ireland",
//    name13: "Dermot Kennedy (IRL) - Kiss Me",
//    sponsor13: "",
//    flag14: "au",
//    __flag14: "Australia",
//    name14: "Troye Sivan (AUS) - Rush",
//    sponsor14: "",
//    flag15: "fr",
//    __flag15: "France",
//    name15: "Adé (FRA) - Tout savoir",
//    sponsor15: "",
//    flag16: "ee",
//    __flag16: "Estonia",
//    name16: "Traffic (EST) - Wunderbar",
//    sponsor16: "",
//    flag17: "no",
//    __flag17: "Norway",
//    name17: "Dagny (NOR) - Somebody",
//    sponsor17: "",
//    flag18: "cy",
//    __flag18: "Cyprus",
//    name18: "Νίκος Οικονομόπουλος (CYP) - Έκπτωτος Άγγελος",
//    sponsor18: "",
//    flag19: "pt",
//    __flag19: "Portugal",
//    name19: "Kura (POR) - Sentir Saudade",
//    sponsor19: "",
//    flag20: "il",
//    __flag20: "Israel",
//    name20: "שי גבסו (ISR) - לא דיברנו כבר שנתיים",
//    sponsor20: "",
//    flag21: "uk",
//    __flag21: "United Kingdom",
//    name21: "Paloma Faith (UK) - Better Than This",
//    sponsor21: "",
//    flag22: "de",
//    __flag22: "Germany",
//    name22: "Gregor Hägele (GER) - Nur Du",
//    sponsor22: "",
//    flag23: "bg",
//    __flag23: "Bulgaria",
//    name23: "HOLY PEAKS (BUL) - Daylight",
//    sponsor23: "",
//    flag24: "be",
//    __flag24: "Belgium",
//    name24: "Berre (BEL) - Thrill Of It All",
//    sponsor24: "",
//    flag25: "se",
//    __flag25: "Sweden",
//    name25: "Loreen (SWE) - Is It Love",
//    sponsor25: "",
//  }