const XLSX = require("xlsx");
const fs = require("fs");
const _ = require("lodash");

let data_fetched = JSON.parse(fs.readFileSync("data_fetched.json").toString());
let database = JSON.parse(
  fs.readFileSync("database.json").toString()
).apartamentos;
let config_file = JSON.parse(fs.readFileSync("config.json").toString());

console.log(_.size(data_fetched));
// filtering already discarted things, since we only want to see available things that we care about
data_fetched = _.filter(data_fetched, (o) => {
  return _.indexOf(config_file.discarded_list, o.url) == -1;
});
console.log(_.size(data_fetched));

for (var item of data_fetched) {
  const database_row = _.find(database, (o) => {
    return o.url == item.url;
  });
  item = _.merge(item, database_row);
  item.valor_total = 0;
  item.minutes_since_found =
    (Date.now() - item.date_found_by_crawler) / 1000 / 60;
  delete item.date_found_by_crawler; //removing unecesasry data from excel
}

data_fetched = _.reverse(_.orderBy(data_fetched, (o) => o.metragem));
const workbook = XLSX.utils.book_new();

let worksheet = XLSX.utils.json_to_sheet(data_fetched);

var line = 2;
// line one contains the the headers
for (var item of data_fetched) {
  worksheet[`F${line}`] = { t: "n", f: `C${line}+D${line}+E${line}` };

  line++;
}

XLSX.utils.book_append_sheet(workbook, worksheet, "Test");

/* fix headers */
XLSX.utils.sheet_add_aoa(worksheet, [_.keys(data_fetched[0])], {
  origin: "A1",
});

/* calculate column width of each column*/
worksheet["!cols"] = [];
_.keys(data_fetched[0]).forEach((field_name) => {
  const max_width = data_fetched.reduce(
    (w, r) => Math.max(w, _.size(r[field_name])),
    10
  );

  worksheet["!cols"].push({ wch: max_width });
});

/* create an XLSX file and try to save to Presidents.xlsx */
XLSX.writeFile(workbook, "apartamentos_encontrados.xlsx");
for (var item of data_fetched) {
  if (item.minutes_since_found < 90) {
    console.log(`NEW ASSET [${item.minutes_since_found}]: ${item.url}`);
  }
}