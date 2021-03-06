var dataGetter = {
    urls: {},
    /* All the urls to get data from in the format: 'http://.../': {triggerFunctions:[triggerFunctions], updatable: true/false},
    where triggerFunctions is a list of functions to be called if the data has changed since the last update and updatable specifies
    whether the data may be updated. */
    downloads: {}, // Latest data obtained from urls by url in the format: 'http://.../': {data:...,current:true/false} where data is the downloaded data for that url and  current specifies whether the data should be seen as being current.

    addNew: function(url, triggerFunction, updatable) { // A function to be called when registring a new trigegrFunction for a given url.
        // TODO: What if certain data is seen as being updateable by one tab and constant by another?
        if (url in dataGetter.urls) {
            // The url has been registered already. Add the trigegr fucntion to this datagetter ....
            dataGetter.urls[url].triggerFunctions.push(triggerFunction);
            // ... and call the trigegr function if we have any latest data obtained from the url.
            if (dataGetter.downloads[url].data) {
                triggerFunction(dataGetter.downloads[url].data);
            }
        } else {
            dataGetter.urls[url] = {triggerFunctions:[triggerFunction], updatable: updatable};
            dataGetter.downloads[url] = {data: false, current: false};
            dataGetter.getData(url);
            if (updatable) {
                dataGetter.updatableSources++;
            }
        }
    },

    getData: function(url) {
        // Get new data from a specific url.
        jQuery.get(url, function(response) {
            if (!_.isEqual(dataGetter.downloads[url].data, response)) { // Only if the data is different than what was obtained from the same URL previously, call the trigger functions.
                dataGetter.downloads[url].data = response;
                dataGetter.downloads[url].current = true;
                _.each(dataGetter.urls[url].triggerFunctions,function(triggerFunction){
                    triggerFunction(dataGetter.downloads[url].data);
                })
            } else {
                dataGetter.downloads[url].current = true;
                console.log('no change for '+url);
            }

            // If this was the last data to be made current, update the timer.
            if (_.where(dataGetter.downloads, {current: false}).length===0) {
                dataGetter.lastUpdate = new Date();
            }
        });
    },

    getAll: function() {// Function to iniate getting data from all registered urls.
        // Set all updatable sources to be outdated
        _.each(dataGetter.urls, function (source, url) {
            if (source.updatable) {
                dataGetter.downloads[url].current = false;
            }
        });
        // Get data for all out of date urls
        // For data that isn't updatable, this will only be executed the first time.
        _.each(dataGetter.downloads, function(download, url) {
            if (!download.current) {
                dataGetter.getData(url);
            }
          });
    },
    checkAll: function (urls) { // Checks whether all items in a list of urls has current data attached.
        var i;
        for (i=0;i<urls.length;i++) {

            if (!dataGetter.downloads.hasOwnProperty(urls[i]) || dataGetter.downloads[urls[i]].current === false) {
                return false;
            }
        }
        return true;
    },
    lastUpdate: false
};

dataGetter.getAll();
