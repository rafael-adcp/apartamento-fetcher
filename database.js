const fs = require("fs");

const _ = require("lodash");
const file_name = "database.json";

function searchForUrl(url) {
  let database = JSON.parse(fs.readFileSync(file_name).toString());
  database = database ? database : [];
  return _.find(database.apartamentos, (o) => {
    return o.url == url;
  });
}

function addApartamento(data) {
  const database = JSON.parse(fs.readFileSync(file_name).toString());
  database.apartamentos.push(data);

  fs.writeFileSync(file_name, JSON.stringify(database, null, 2));
}

module.exports = {
  addApartamento,
  searchForUrl,
};
