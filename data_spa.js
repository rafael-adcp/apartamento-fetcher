const fs = require("fs");
const _ = require("lodash");
const { remote } = require("webdriverio");


const database = require("./database");
const NAO_ENCONTREI = "não disponível";

async function obter_info(browser, selector) {
  //alguns aptos nao tem condominio, ai aqui so ta tratando pra ficar bonitinho
  let output = null;
  try {
    output = await browser.$(selector).getText();
  } catch (e) {
    console.log("-------------");
    console.log("falhou no" + selector);
    console.log(await browser.getUrl());
    console.log(e);
    console.log("-------------\n\n\n");
  } finally {
    return output ? output : NAO_ENCONTREI;
  }
}

(async function () {
  let data_raw = JSON.parse(fs.readFileSync("data_fetched.json").toString());
  const browser = await remote({
    logLevel: "error", //default is 'info' but too verbose
    capabilities: {
      browserName: "chrome",
      logLevel: "error",
    },
  });

  let config_file = JSON.parse(fs.readFileSync("config.json").toString());
  console.log(_.size(data_raw));
  data_raw = _.filter(data_raw, (o) => {
    return _.indexOf(config_file.discarded_list, o.url) == -1;
  });
  console.log(_.size(data_raw));
  for (var apartamento of data_raw) {
    try {
      if (database.searchForUrl(apartamento.url) == null) {
        await browser.url(apartamento.url);
        await browser.pause(1000 * 5);
        apartamento.metragem = _.parseInt(apartamento.metragem);

        apartamento.condominio = await obter_info(
          browser,
          "#js-site-main > div.main-container > div.side-bar-container > div.price-container > div > div.price__cta-wrapper > ul > li:nth-child(1) > span.price__list-value.condominium.js-condominium"
        );

        apartamento.iptu = await obter_info(
          browser,
          "#js-site-main > div.main-container > div.side-bar-container > div.price-container > div > div.price__cta-wrapper > ul > li:nth-child(3) > span.price__list-value.iptu.js-iptu"
        );

        //qndo o apto ta a venda o seletor é esse aqui
        let valor_aluguel = await obter_info(
          browser,
          "#js-site-main > div.main-container > div.side-bar-container > div.price-container > div > div.price__cta-wrapper > div > div > h3"
        );

        if (valor_aluguel == NAO_ENCONTREI) {
          //ai caso n esteja a venda, vulgo so aluguel, eh esse seletor aqui
          valor_aluguel = await obter_info(
            browser,
            "#js-site-main > div.main-container > div.side-bar-container > div.price-container > div > div.price__content-wrapper > div > h3"
          );
        }

        apartamento.aluguel = _.split(valor_aluguel, "/")[0];

        apartamento.date_found_by_crawler = Date.now();

        database.addApartamento(apartamento);
      } else {
        console.log("apartamento ja cadastrado " + apartamento.url);
      }
    } catch (e) {
      console.log("-------------");
      console.log("falhou no ");
      console.log(apartamento.url);
      console.log(e);
      console.log("-------------\n\n\n");
    }
  }

  console.log("fim");
  await browser.deleteSession();
})();
