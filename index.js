var cheerio = require('cheerio'),
    request = require('request'),
    url = 'http://www.wblivesurf.com/',
    logoCount = 0,
    data = {};

exports.handler = (event, context, callback) => {

    request(url, function (error, response, body) {

        data.isBase64Encoded = false;
        data.statusCode = response.statusCode;
        data.headers = {
            "Access-Control-Allow-Origin" : "*",
            "Access-Control-Allow-Credentials" : true
        };
        data.body = {};

        var $ = cheerio.load(body);

        //Get the date of the report
        $('.date').filter(function () {
            var date = $(this).text().split('/');
            data.body.date = date[1].trim();
        });

        //Get the time of the report
        $('.time').filter(function () {
            var time = $(this).text().split('/');
            data.body.time = time[0].trim();
        });

        //Get the report description
        $('#wbMainReport .item').each(function (i, elem) {
            $('.date', $(this)).remove();
            $('h3', $(this)).remove();
            $('.time', $(this)).remove();
            data.body.desc = $(this).text().split(":").pop().trim();
        });

        //Get the logos
        $('.current div').each(function (i, elem) {

            if (this.attribs.class == 'ratingCell half') {
                logoCount += 0.5;
            }
            else if (this.attribs.class == 'ratingCell') {
                logoCount += 1;
            }

            data.body.logoCount = logoCount;

        }).attr('class');

        //Get other information
        $('p', '#wbMainRating').each(function (i, elem) {

            var info = $(this).text().split(':');

            switch (info[0]) {
                case 'Swell Size':
                    data.body.size = info[1].trim();
                    break;
                case 'Water Surface':
                    data.body.surface = info[1].trim();
                    break;
                case 'Water Temp':
                    data.body.waterTemp = info[1].trim();
                    break;
                case 'Wind':
                    data.body.wind = info[1].trim();
                    break;
                case 'High Tide':
                    data.body.highTide = `${info[1]}:${info[2]}:${info[3]}`.trim();
                    break;
                case 'Low Tide':
                    data.body.lowTide = `${info[1]}:${info[2]}:${info[3]}`.trim();
                    break;
                case 'Sunrise':
                    data.body.sunrise = `${info[1]}:${info[2]}:${info[3]}`.trim();
                    break;
                case 'Sunset':
                    data.body.sunset = `${info[1]}:${info[2]}:${info[3]}`.trim();
                    break;
            }

        });
        
        data.body = JSON.stringify(data.body);

        callback(null, data);

    });

}