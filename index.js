var cheerio = require('cheerio'),
    request = require('request'),
    url = 'http://www.wblivesurf.com/',
    logoCount = 0,
    data = {};

exports.handler = (event, context, callback) => {

    request(url, function (error, response, body) {

        var $ = cheerio.load(body);

        //Get the date of the report
        $('.date').filter(function () {
            var date = $(this).text().split('/');
            data.date = date[1].trim();
        });

        //Get the time of the report
        $('.time').filter(function () {
            var time = $(this).text().split('/');
            data.time = time[0].trim();
        });

        //Get the report description
        $('#wbMainReport .item').each(function (i, elem) {
            $('.date', $(this)).remove();
            $('h3', $(this)).remove();
            $('.time', $(this)).remove();
            data.desc = $(this).text().split(":").pop().trim();
        });

        //Get the logos
        $('.current div').each(function (i, elem) {

            if (this.attribs.class == 'ratingCell half') {
                logoCount += 0.5;
            }
            else if (this.attribs.class == 'ratingCell') {
                logoCount += 1;
            }

            data.logoCount = logoCount;

        }).attr('class');

        //Get other information
        $('p', '#wbMainRating').each(function (i, elem) {

            var info = $(this).text().split(':');

            switch (info[0]) {
                case 'Swell Size':
                    data.size = info[1].trim();
                    break;
                case 'Water Surface':
                    data.surface = info[1].trim();
                    break;
                case 'Water Temp':
                    data.waterTemp = info[1].trim();
                    break;
                case 'Wind':
                    data.wind = info[1].trim();
                    break;
                case 'High Tide':
                    data.highTide = `${info[1]}:${info[2]}:${info[3]}`.trim();
                    break;
                case 'Low Tide':
                    data.lowTide = `${info[1]}:${info[2]}:${info[3]}`.trim();
                    break;
                case 'Sunrise':
                    data.sunrise = `${info[1]}:${info[2]}:${info[3]}`.trim();
                    break;
                case 'Sunset':
                    data.sunset = `${info[1]}:${info[2]}:${info[3]}`.trim();
                    break;
            }

        });

        callback(data);

    });

}