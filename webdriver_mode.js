const { remote } = require("webdriverio");
const fs = require("fs");
const _ = require("lodash");
let config_file = JSON.parse(fs.readFileSync("config.json").toString());

const url_base = config_file.url_base;

async function getApartamentos(browser) {
  const total_itens_on_header = await browser
    .$(
      "#js-site-main > div.results__container > div.results__content > section > header > div > div > div.js-title > div > h1 > strong"
    )
    .getText();

  console.log(`Segundo a pagina tem um total de ${total_itens_on_header}`);
  const apartamentos_dom_list = await browser.$$("#js-site-main > div.results__container > div.results__content > section > div.results-main__panel.js-list > div.results-list.js-results-list > div");

  console.log(
    `Encontrou ${_.size(apartamentos_dom_list)} possiveis itens na pagina`
  );
  let output = [];
  for (var apartamento_node of apartamentos_dom_list) {
    const html_content = await apartamento_node.getHTML();
    try {
      if (
        !_.isEmpty(_.trim(await apartamento_node.getHTML(false))) &&
        html_content.indexOf("Veja tamb") == -1 &&
        html_content.indexOf("results__placeholder-text") == -1
      ) {
        output.push({
          url:
            "https://www.vivareal.com.br" +
            (await apartamento_node.$("a").getAttribute("href")),
          metragem: _.trim(
            await apartamento_node.$(".js-property-card-detail-area").getText()
          ),
        });
      } else {
        // console.log('ignorou')
        // console.log(html_content)
      }
    } catch (e) {
      console.log("failed to parse ");
      console.log(html_content);
      console.log(
        `>>>>>>>${_.trim(await apartamento_node.getHTML(false))}<<<<<<`
      );
      console.log(e);
    }
  }
  return output;
}

(async () => {
  const browser = await remote({
    logLevel: "error", //default is 'info' but too verbose
    capabilities: {
      browserName: "chrome",
      logLevel: "error",
    },
  });

  let stop = false;
  let output = [];
  await browser.url(url_base);
  while (!stop) {
    console.log(
      "waiting X seconds after opening the url before doing something, since their ui takes a bit to finish rendering things"
    );
    await browser.pause(1000 * 5);

    const apartamentos = await getApartamentos(browser);
    const proxima_pagina = await browser.$(
      "#js-site-main > div.results__container > div.results__content > section > div.results-main__panel.js-list > div.js-results-pagination > div > ul > li:last-child > button"
    );

    const data_page= await proxima_pagina.getAttribute("data-page")
    const is_disabled = await proxima_pagina.getAttribute("data-disabled");
    if (is_disabled == "" && data_page == "") {
      stop = true;
      console.log('atingiu a ultima pagina, vai parar o crawler')
    } else {
      await proxima_pagina.click();
    }
    output = _.union(output, apartamentos);
  }
  console.log(_.size(output))
  output = _.uniqBy(output, 'url')
  console.log(_.size(output))
  fs.writeFileSync("data_fetched.json", JSON.stringify(output, null, 2));
  console.log('fim')
  await browser.deleteSession()
})();
