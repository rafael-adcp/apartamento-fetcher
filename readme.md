# Apartment crawler
Crawler designed to fetch apartments from `www.vivareal.com.br` and store them into local `.json` files, to easly allow to spot newer apartments under your search critereas,
as well as easly output everything to an excel, so you can see at the `.xlsx` generated the `sum` of `Aluguel + Iptu + condominio`, as well as allow you to sort on wtv you want,
since the excel columns are
```
url	metragem | condominio | iptu | aluguel | valor_total	minutes_since_found
```
which is not possible via the website.

# Running things
```
$ node -v
v14.17.1

$ npm ci
$ touch config.json
```
Fill config file with the following
```
{
    "url_base": "https://www.vivareal.com.br/.....",
    "discarded_list": [
        "",
        "",
        ]

```
Given `url_base` which you can generate by going to `vivareal` website and applying your filter, just copy the url generated, using `webdriverIO`, crawler will fetch all apartaments on each of the available pages, and then it will open each one of them only once, to fetch more details, and at the end it will generate an excel `.xlsx` with all the data for you.

```
# Running the code from scratch (overwrite all .json databases)
npm run from_scratch

# Running it again over and over as time goes by to fetch new things
npm run re_run
```

# workflow wise

Running `webdriver_mode.js` will generate a `data_fetched.json`, with all current available apartments from the website.

Then it will trigger `data_spa.js`, which for each entry that file, if the url isnt on the `config.json` file under `discarded_list`, it will obtain the apartment information by opening it (if its not already registered on `database.json`).

Then it will trigger `tchururu.js`, which will append a `sum formula` to the excel + sort it based on the size of the apartment
