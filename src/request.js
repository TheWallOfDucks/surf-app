//Created by Caleb Duckwall
let https;

'use strict';

class Request {

    /**
     * @param {Object} options - Options to be used in request
     * @param {String} options.method - HTTP verb. Defaults to GET
     * @param {String} options.url - URL to send request to
     * @param {Object} options.body - Request body
     * @param {Object} options.parameters - Request parameters
     * @param {Object} options.headers - Request headers
     * @param {Object} options.auth - Authorization required for request
     * @param {String} options.key - Key required for request
     * @param {String} options.cert - Certificate required for request
     * @param {String} options.passphrase - Passphrase for certificate
     * @param {String} options.contentType - Content type of the request
     * @param {Boolean} options.resolveWithBodyOnly - If true it will only return the response body. Defaults to true
     * @param {Boolean} options.rejectNon2xx - If true it will reject non 2xx status codes. Defaults to true
     * @param {Boolean} options.debug - If true it will log information about the request/response. Defaults to false
     * @param {Int} options.timeout - MS to wait for response to be returned. Defaults to 10000
     */
    constructor(options) {

        const { URL } = require('url'),
            querystring = require('querystring');

        let err, url;

        //Build a new URL and store hostname/path
        !options.url ? console.error('No URL provided') : (url = new URL(options.url), this.hostname = url.hostname, this.path = url.pathname);

        //If protocol is HTTP, use HTTP module instead of HTTPS
        (url.protocol == 'http:') ? https = require('http') : https = require('https');

        /**
         *  If there is a port, use it
         *  If there is no port, and protocol is HTTP, default to port 80
         *  Otherwise default to port 443
         */
        url.port ? this.port = url.port : url.protocol == 'http:' ? this.port = 80 : this.port = 443

        !options.method ? this.method = 'GET' : this.method = options.method.toUpperCase();

        /**
         *  If there is no request body use querystring to stringify it
         *  If the request body is an object use JSON.stringify
         */
        !options.body ? this.body = querystring.stringify(options.body)
            : (typeof options.body == 'object') ? this.body = JSON.stringify(options.body, (k, v) => {if (v === undefined) {return null;} return v})
                : this.body = options.body;

        /**
         * If there is contentType specified in the options, use it
         * If there is no contentType, but there is a content-type header, use it
         * If there is nothing, default it to JSON
         */
        options.contentType ? this.contentType = options.contentType
            : options.headers && 'Content-Type' in options.headers ? this.contentType = options.headers['Content-Type']
                : this.contentType = 'application/json';

        //Build the headers based on the contentType and request body if there is one
        options.headers ? (this.headers = options.headers, this.headers['Content-Type'] = this.contentType, this.headers['Content-Length'] = this.body.length)
            : (this.headers = { 'Content-Type': this.contentType, 'Content-Length': this.body.length });

        //Handle parameters
        options.parameters ? (this.parameters = options.parameters, this.qs = `?${querystring.stringify(options.parameters)}`)
            : (this.parameters = null, this.qs = '');

        //Handle basic authorization
        if (options.auth) {
            this.headers['Authorization'] = 'Basic ' + new Buffer(options.auth.username + ':' + options.auth.password).toString('base64');
        }

        //If there is a key, include it in the request
        if (options.key) {
            this.key = options.key;
        }

        //If there is a cert, include it in the request
        if (options.cert) {
            this.cert = options.cert;
        }

        //If there is a passphrase, include it in the request
        if (options.passphrase) {
            this.passphrase = options.passphrase;
        }

        //Handle resolveWithBodyOnly option
        (options.resolveWithBodyOnly || options.resolveWithBodyOnly == undefined) ? this.resolveWithBodyOnly = true : this.resolveWithBodyOnly = false;

        //Handle rejectNon2xx option
        (options.rejectNon2xx == true) ? this.rejectNon2xx = true : (options.rejectNon2xx == false) ? this.rejectNon2xx = false : this.rejectNon2xx = true;

        //Handle debug option
        options.debug ? this.debug = options.debug : this.debug = false;

        //Handle timeout option
        options.timeout ? this.timeout = options.timeout : this.timeout = 10000;
    }

    promise() {

        let response = {},
            options = {
                hostname: this.hostname,
                port: this.port,
                path: this.path + this.qs,
                headers: this.headers,
                auth: this.auth,
                method: this.method,
                key: this.key,
                cert: this.cert,
                passphrase: this.passphrase
            },
            start = new Date();

        return new Promise((resolve, reject) => {

            let timeout = setTimeout(() => {
                let err = new Error(`Timed out waiting for response after ${this.timeout / 1000} seconds`);
                return reject(err);
            }, this.timeout);

            let req = https.request(options, (res) => {
                response.statusCode = res.statusCode;
                response.body = '';

                res.on('data', body => {
                    //Once a response is received clear the timeout timer
                    clearTimeout(timeout);
                    response.body += body;
                });

                res.on('end', () => {

                    /**
                     * @todo: Add database logging
                     */
                    let end = new Date();
                    response.duration = end - start;

                    //If debug is turned on, log debugInfo object with request and response
                    if (this.debug) {
                        this.debugInfo = {
                            request: this.body,
                            response: res
                        };
                        console.log(this.debugInfo);
                    }

                    //Handle any non-200 rejections
                    if (this.rejectNon2xx && response.statusCode.toString().charAt(0) != '2') {
                        return reject('Invalid status code: ' + response.statusCode + '\n'
                            + 'Response: ' + '\n' + JSON.stringify(response.body, null, 2));
                    }

                    //Handle parsing of the response body
                    // if (response.body.length > 0) {
                    //     (this.contentType === 'application/json' || options['headers']['Accept'] == 'application/json') ? response.body = JSON.parse(response.body)
                    //         : this.contentType === 'application/xml' || 'text/xml' ? this.xmlToJSON(response.body, (res) => { response.body = res })
                    //             : this.contentType === 'text/html' ? response.body = response.body
                    //                 : reject(`Unrecognized Content-Type: ${options['headers']['Content-Type']}`);
                    // }

                    //If resolveWithBodyOnly is turned on then only return the response body
                    this.resolveWithBodyOnly ? resolve(response.body) : resolve(response);
                });

            });

            req.write(this.body);

            req.on('error', err => {
                /**
                 * @todo: Add database logging
                 */
                return reject(err);
            });

            req.end();

        });

    }

    callback(done) {
        const util = require('util');

        //This allows us to only build the logic into the promise function and simply callbackify it
        const callbackFunction = util.callbackify(this.promise).bind(this);

        callbackFunction(done);
    }

    xmlToJSON(body, done) {
        console.log('here');
        const { parseString } = require('xml2js');

        parseString(body, (err, result) => {
            if (err) { console.error(err) }
            done(result);
        });

    }

}

module.exports = {
    request: Request
}