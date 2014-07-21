function EtsyClient(options) {
    if (!options) {
        throw new Error("Missing an options argument to EtsyClient()");
    }
    if (!options.api_key) {
        throw new Error("Yo dawg, I heard you like APIs. Y U NO APIKEY!?!?");
    }
    this.etsy_url = "https://openapi.etsy.com/";
    this.version = options.api_version || "v2/";
    this.api_key = options.api_key;
    this.complete_api_url = this.etsy_url + this.version;
    this.templates = {};
    this.container = document.createElement('div');
    document.body.appendChild(this.container);
    // handle events on container
    // this.handleClickEvents();
    this.setupRouting();
    // print the listings template
    // this.showListings();
}

/**
 * -----------------------------------------------------------------------------------------
 * API FUNCTIONS (LISTINGS, LISTING, USER)
 * -----------------------------------------------------------------------------------------
 * All these return Promises (i.e. from $.get(), $.getJSON(), $.Deferred())
 */

function pipeResults(d){ return d; }

EtsyClient.prototype.getActiveListings = function() {
    var self = this;
    if (!this.cachedListings) {
        var URIs = [
            this.complete_api_url,
            '/listings',
            '/active',
            ".js?api_key=",
            this.api_key,
            "&includes=MainImage",
            "&callback=?"
        ];

        return $.getJSON(URIs.join('')).then(function(data) {
            self.cachedListings = data;
            return data;
        });
    } else {
        var p = $.Deferred();
        p.resolve(this.cachedListings);
        return p;
    }
}

EtsyClient.prototype.getListing = function(id) {
    var URIs = [
        this.complete_api_url,
        '/listings',
        '/' + id,
        ".js?api_key=",
        this.api_key,
        "&includes=MainImage",
        "&callback=?"
    ];

    return $.getJSON(URIs.join('')).then(pipeResults);
}

EtsyClient.prototype.getUser = function(id) {
    var URIs = [
        this.complete_api_url,
        '/users',
        '/' + id,
        ".js?api_key=",
        this.api_key,
        "&callback=?"
    ];

    return $.getJSON(URIs.join('')).then(pipeResults);
}

/**
 * -----------------------------------------------------------------------------------------
 * TEMPLATE-GRABBING FUNCTIONS
 * -----------------------------------------------------------------------------------------
 * All these return Promises (i.e. from $.get(), $.getJSON(), $.Deferred())
 */

EtsyClient.prototype.getTemplate = function(url) {
    var self = this;
    if (!window._ || !window._.template) throw new Error("Did you forget to load lodash?");

    console.log(this.templates);

    if (!this.templates[url]) {

        return $.get(url).then(function(tmpl) {
            self.templates[url] = _.template(tmpl);
            return self.templates[url];
        });

    } else {
        var promise = $.Deferred();
        promise.resolve(self.templates[url]);
        return promise;
    }
}

/**
 * -----------------------------------------------------------------------------------------
 * UI FUNCTIONS
 * -----------------------------------------------------------------------------------------
 * All these use the Promises from the other functions in a $.when()
 */

EtsyClient.prototype.showListings = function() {
    var self = this;
    $.when(
        this.getTemplate('/templates/listings.tmpl'),
        this.getActiveListings()
    ).then(function(template, data) {
        console.log(data);
        data.results = _.filter(data.results, function(r){ return !r.error_messages; });
        self.container.innerHTML = template(data);
    });
}

EtsyClient.prototype.showListing = function(id) {
    var self = this;
    $.when(
        this.getTemplate('/templates/listing.tmpl'),
        this.getListing(id)
    ).then(function(template, data) {
        console.log(data);
        self.container.innerHTML = template(data.results[0]);
    });
}

EtsyClient.prototype.setupRouting = function(){
    var self = this;

    Path.map("#/").to(function() {
        self.showListings();
    });

    Path.map("#/listing/:id").to(function() {
        console.log(this);
        self.showListing(this.params.id);
    });

    // set the default hash
    Path.root("#/");
    Path.listen();
}

/**
 * -----------------------------------------------------------------------------------------
 * THE APP ENTRY POINT
 * -----------------------------------------------------------------------------------------
 * All these use the Promises from the other functions in a $.when()
 */

window.onload = app;

function app() {
    var etsy = new EtsyClient({
        api_key: "aavnvygu0h5r52qes74x9zvo"
    });
}

