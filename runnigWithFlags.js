import {flagNew} from "./countryStats.js";

let running = [
   { country: "Ukraine", scoreziwEntry: "GROSU (UKR) - Луна", notes: "e"},
   { country: "Ireland", scoreziwEntry: "Moncrieff (IRL) - Love Somebody", notes: "1"},
   { country: "Portugal", scoreziwEntry: "Ana Moura (POR) - Agarra Em Mim ft. Pedro Mafama", notes: ""},
   { country: "Armenia", scoreziwEntry: "Saro Gevorgyan (ARM) - Fall in Love", notes: "1e"},
   { country: "Norway", scoreziwEntry: "Seeb, Dagny (NOR) - Drink About", notes: ""},
   { country: "Serbia", scoreziwEntry: "Marija Šerifović (SRB) - DOBAR VAM DAN", notes: "e"},
   { country: "Belgium", scoreziwEntry: "PIERRE DE MAERE (BEL) - Mercredi", notes: ""},
   { country: "Czechia", scoreziwEntry: "Vesna (CZE) - Wolfrunners", notes: ""},
   { country: "Spain", scoreziwEntry: "Malú (ESP) - Se Busca", notes: "1"},
   { country: "Latvia", scoreziwEntry: "Tautumeitas (LAT) - Spodrē manu augumiņu", notes: "1e"},
   { country: "Finland", scoreziwEntry: "Antti Tuisku (FIN) - Baila por mi", notes: ""},
   { country: "Cyprus", scoreziwEntry: "Γιώργος Παπαδόπουλος (CYP) - Πεθαίνω Για Σένα", notes: "1e"},
   { country: "Australia", scoreziwEntry: "Kylie Minogue (AUS) - Padam Padam", notes: ""},
   { country: "San Marino", scoreziwEntry: "Gaia (SMR) - TOKYO", notes: ""},
   { country: "Netherlands", scoreziwEntry: "Tiësto (NED) - Lay Low", notes: "2"},
   { country: "Poland", scoreziwEntry: "Smolasty & Doda (POL) - Nim Zajdzie Słońce [Official Music Video]", notes: ""},
   { country: "Germany", scoreziwEntry: "Leony (GER) - Remedy", notes: ""},
   { country: "Iceland", scoreziwEntry: "ÁSDÍS (ISL) - Angel Eyes", notes: ""},
   { country: "Denmark", scoreziwEntry: "Alexander Oscar (DEN) - One More Dance", notes: "2"},
   { country: "Italy", scoreziwEntry: "Paola & Chiara (ITA) - Furore", notes: ""},
   { country: "Azerbaijan", scoreziwEntry: "JONY (AZE) - Никак", notes: ""},
   { country: "France", scoreziwEntry: "Kendji Girac (FRA) - Evidemment", notes: "2"},
   { country: "Luxembourg", scoreziwEntry: "twocolors x Safri Duo x Chris de Sarandy (LUX) - Cynical", notes: "2"},
   { country: "Austria", scoreziwEntry: "Nathan Trent (AUT) - Liar", notes: ""},
   { country: "Sweden", scoreziwEntry: "Dotter (SWE) - Backfire", notes: "2"}
];

running.forEach((entry, idx) => {
   entry.flag = flagNew(entry.country);
   console.log(`${idx + 1}.${entry.flag} ${entry.country}`)
})