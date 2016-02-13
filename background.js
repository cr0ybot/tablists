/**
 * TabLists Backround
 * A Firefox TabGroups/Panorama Replacement
 * by Cory Hughart <cory@coryhughart.com>
 */

var defaultOptions = {
        'folderID': null,
        'folderName': 'TabLists',
        'activeList': 0,
        'activeTab': [0],           // array of indices of the active tab for each list
        'startupList': null         // int of list to load at startup (overriding activeList), or null for activeList
    },
    options,
    bookmarks,
    curentTabs;

/**
 * TabListManager class
 * Since there will be only one, we are not using the "prototype" pattern,
 * especially since we need to be able to reference "this" quite often.
 * @constructor
 * @param {object} options - options object
 * @param {string} options.folderID - id of the folder that TabLists bookmarks will be saved to
 * @param {string} options.folderName - name of the folder that TabLists bookmarks will be saved to
 * @param {number} options.activeList - the id of the TabList that is currently active (or was last active)
 * @param {array} options.activeTab - an array of the active tab id for each TabList
 * @param {number} options.startupList - the id of the TabList to load at startup, or null for the last list that was active (overrides activeList)
 **/
function TabListManager(passedOptions) {
    console.log('TabListManager initialized!');

    // Global message listener
    this.initMessageListener();

    // Tab listeners
    this.initTabListeners();

    // Options initialization
    if (typeof passedOptions === 'undefined') {
        // init settings using chrome.storage.local (check if exists first)
        console.log('Getting options from storage...');
        chrome.storage.local.get(function(items) {
            this.checkOptions(items);
        }.bind(this));
    }
    else {
        console.log('Options passed to init: '+JSON.stringify(passedOptions));
        this.checkOptions(passedOptions);
    }
} // end TabListManager

// TabListManager event listeners

TabListManager.prototype.initMessageListener = function() {
    chrome.runtime.onMessage.addListener(function(message, sender, callback) {
        // Submit
        if (message.submit) {
            if (message.data !== undefined) {
                console.log('Submit message from '+sender+' received: '+JSON.stringify(message.data));
                switch (message.submit) {
                    case 'options':
                        this.saveOptions(message.data);
                        callback(message.data).bind(this);
                    break;
                    default:
                        console.warn('Submit message from '+sender+' reveived but not understood: '+JSON.stringify(message.data));
                    break;
                }
            }
            else {
                console.warn('Submit message from '+sender+' received but no data was transmitted');
            }
        }

        // Request
        else if (message.request) {
            console.log('Request message from '+sender+' received: '+message.request);

            switch (message.request) {
                case 'options':
                    callback(options);
                break;
                case 'defaultOptions':
                    callback(defaultOptions);
                break;
                case 'bookmarks':
                    callback(bookmarks);
                break;
                default:
                    console.warn('Request message from '+sender+' received but not understood: '+message.request);
                break;
            }
        }
    }.bind(this));
}

TabListManager.prototype.initTabListeners = function() {
    console.log('Initializing tab event listeners...');
    /*
    onCreated
    onUpdated
    onMoved
    onActivated
    onHighlighted
    onDetached
    onAttached
    onRemoved
    onReplaced
    onZoomChange
    */
    chrome.tabs.onCreated.addListener(this.tabCreatedHandler);
    chrome.tabs.onUpdated.addListener(this.tabUpdatedHandler);
    chrome.tabs.onMoved.addListener(this.tabMovedHandler);
    chrome.tabs.onActivated.addListener(this.tabActivatedHandler);
    chrome.tabs.onDetached.addListener(this.tabDetachedHandler);
    chrome.tabs.onAttached.addListener(this.tabAttachedHandler);
    chrome.tabs.onRemoved.addListener(this.tabRemovedHandler);
    chrome.tabs.onReplaced.addListener(this.tabReplacedHandler);
}

TabListManager.prototype.tabCreatedHandler = function(tab) {
    // TODO
}

TabListManager.prototype.tabUpdatedHandler = function(tabId, changeInfo, tab) {
    // TODO
}

TabListManager.prototype.tabMovedHandler = function(tabId, moveInfo) {
    // TODO
}

TabListManager.prototype.tabActivatedHandler = function(activeInfo) {
    // TODO
}

TabListManager.prototype.tabDetachedHandler = function(tabId, detachInfo) {
    // TODO
}

TabListManager.prototype.tabAttachedHandler = function(tabId, attachInfo) {
    // TODO
}

TabListManager.prototype.tabRemovedHandler = function(tabId, removeInfo) {
    // TODO
}

TabListManager.prototype.tabReplacedHandler = function(addedTabId, removedTabId) {
    // TODO
}

// TabListManager class methods

/**
 * Checks options passed to TabListManager (if any)
 * Looks for folderID and kicks off tablist setup
 **/
TabListManager.prototype.checkOptions = function(passedOptions) {
    console.log('Checking options...');

    if (typeof passedOptions === 'object') {
        options = passedOptions;
    }
    else {
        if (options == null) options = {};
    }
    console.group('options (precheck):');
    console.log(options);
    console.groupEnd();

    if (typeof options.folderID !== 'string' && isNaN(options.folderID)) {
        console.warn('TabLists folderID not found');
        this.searchForBookmarksFolder(function(o) {
            this.saveOptions(o, this.checkOptions);
        });
        // We need to end early because checking for and creating the bookmarks folder is asynchronous
        return;
    }

    // Compare all options to defaultOptions, fill in any missing
    // TODO: Save options if there were any changes? Maybe not necessary
    for (var item in defaultOptions) {
        if (typeof options[item] === 'undefined') options[item] = defaultOptions[item];
    }

    console.group('options (postcheck):');
    console.log(options);
    console.groupEnd();

    //console.log('defaultOptions: ' + JSON.stringify(defaultOptions));

    // Options are good, lets do things
    this.getBookmarks(options.folderID);
} // end TabListManager.checkOptions

TabListManager.prototype.saveOptions = function(data, callback) {
    console.log('Saving options...');

    options = data;
    chrome.storage.local.set(options, function() {
        //alert('Settings saved.');
        console.group('Options saved:');
        console.log(options);
        console.groupEnd();

        if (typeof callback === 'function') callback(options).bind(this);
    }).bind(this);
} // end TabListManager.saveOptions

TabListManager.prototype.searchForBookmarksFolder = function(callback) {
    console.log('Checking for TabLists bookmarks folder...');

    var folderName = options.folderName || defaultOptions.folderName;
    if (folderName) {
        console.log('Searching for bookmarks folder: "'+folderName+'"');
        chrome.bookmarks.search({title: folderName}, function(results) {
            if (results.length > 0) {
                options.folderName = results[0].title;
                options.folderID = results[0].id;
                console.log(folderName+' folder found! ID: '+results[0].id);
                // Save options & restart the init process
                if (typeof callback === 'function') callback(options).bind(this);
            }
            else {
                console.log(folderName+' folder not found!');
                options.folderName = folderName;
                this.createBookmarksFolder(callback);
            }
        }).bind(this);
    }
    else {
        console.error('Cannot find TabLists bookmarks folder: No folderName set');
    }
} // end TabListManager.searchForBookmarksFolder

TabListManager.prototype.createBookmarksFolder = function(callback) {
    console.log('Creating TabLists bookmarks folder...');

    if (typeof options.folderName === 'string') {
        chrome.bookmarks.create({title: options.folderName}, function(results) {
            console.log(results);
            if (results && typeof results == 'object') {
                options.folderID = results.id;
                console.log('Bookmarks folder created: '+results.title+' ('+results.id+')');
                if (typeof callback === 'function') callback(options).bind(this);
            }
            else {
                console.error('Error creating root bookmarks folder');
            }
        }).bind(this);
    }
    else {
        if (typeof callback === 'function') callback(options);
    }
} // end TabListManager.createBookmarksFolder

TabListManager.prototype.getBookmarks = function(id, callback) {
    console.log('Getting bookmark by id: '+id);

    chrome.bookmarks.getSubTree(id, function(results) {
        if (chrome.runtime.lastError) {
            console.warn(chrome.runtime.lastError.message);
            // Wrong folderID, we'll assume the folder no longer exists
            this.createBookmarksFolder(function(o) {
                this.saveOptions(o, this.checkOptions);
            });
        }

        if (results) {
            console.group('Bookmark tree retrieved:');
            console.log(results[0]);
            console.groupEnd();
            bookmarks = results[0];
            if (typeof callback === 'function') callback(bookmarks);
        }
        else {
            this.createBookmarksFolder(function(o) {
                this.saveOptions(o, this.checkOptions);
            });
        }
    }.bind(this));
} // end TabListManager.getBookmarks
// end TabListManager class


// Initialize TabListManager
var tlm = new TabListManager();
