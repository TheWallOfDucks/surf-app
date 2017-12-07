let cheerio = require('cheerio'),
    express = require('express'),
    app = express(),
    https = require('./request');

app.get('/surf', (req, res) => {

    let url = 'http://www.wblivesurf.com/',
        Request = new https.request({ url: url, contentType: 'text/html' }),
        body = {};

    Request.promise()
        .then(response => {
            let $ = cheerio.load(response);

            //Get the time of the report
            $('.time').filter(function() {
                let data = $(this);
                body.time = data.text();
            });

            //Get the report description
            $('.item').each(function(i, elem) {
                let items = [],
                    data = $(this);

                items[i] = data.text();

                if (i == 5) {
                    body.desc = items[i].split(":").pop();
                }
            });

            $('.current').filter(function() {
                let data = $(this);

                data.each(function(i, elem) {

                    console.log(elem.children().attr('class'));

                });

                // switch (data.children().first().attr('class')) {
                //     case 'ratingCell half':
                //         body.logos = 0.5
                //         break;
                // }
            })

            res.send(body);

        })
        .catch(err => {
            res.send(err);
        });

});

app.listen('8081')
console.log('Listening on port 8081');

module.exports = {
    app: app
}