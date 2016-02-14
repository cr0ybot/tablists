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
 * BookmarkManager class
 * @constructor
 * @param {object} options - options object
 * @param {string} options.folderID - id of the folder that TabLists bookmarks will be saved to
 * @param {string} options.folderName - name of the folder that TabLists bookmarks will be saved to
 * @param {number} options.activeList - the id of the TabList that is currently active (or was last active)
 * @param {array} options.activeTab - an array of the active tab id for each TabList
 * @param {number} options.startupList - the id of the TabList to load at startup, or null for the last list that was active (overrides activeList)
 **/
function BookmarkManager(passedOptions) {
    console.log('BookmarkManager initialized!');

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
} // end BookmarkManager

// BookmarkManager event listeners

BookmarkManager.prototype.initMessageListener = function() {
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

BookmarkManager.prototype.initTabListeners = function() {
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

BookmarkManager.prototype.tabCreatedHandler = function(tab) {
    // TODO
}

BookmarkManager.prototype.tabUpdatedHandler = function(tabId, changeInfo, tab) {
    // TODO
}

BookmarkManager.prototype.tabMovedHandler = function(tabId, moveInfo) {
    // TODO
}

BookmarkManager.prototype.tabActivatedHandler = function(activeInfo) {
    // TODO
}

BookmarkManager.prototype.tabDetachedHandler = function(tabId, detachInfo) {
    // TODO
}

BookmarkManager.prototype.tabAttachedHandler = function(tabId, attachInfo) {
    // TODO
}

BookmarkManager.prototype.tabRemovedHandler = function(tabId, removeInfo) {
    // TODO
}

BookmarkManager.prototype.tabReplacedHandler = function(addedTabId, removedTabId) {
    // TODO
}

// BookmarkManager class methods

/**
 * Checks options passed to BookmarkManager (if any)
 * Looks for folderID and kicks off tablist setup
 **/
BookmarkManager.prototype.checkOptions = function(passedOptions) {
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
} // end BookmarkManager.checkOptions

BookmarkManager.prototype.saveOptions = function(data, callback) {
    console.log('Saving options...');

    options = data;
    chrome.storage.local.set(options, function() {
        //alert('Settings saved.');
        console.group('Options saved:');
        console.log(options);
        console.groupEnd();

        if (typeof callback === 'function') callback(options);
    }).bind(this);
} // end BookmarkManager.saveOptions

BookmarkManager.prototype.searchForBookmarksFolder = function(callback) {
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
                if (typeof callback === 'function') callback(options);
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
} // end BookmarkManager.searchForBookmarksFolder

BookmarkManager.prototype.createBookmarksFolder = function(callback) {
    console.log('Creating TabLists bookmarks folder...');

    if (typeof options.folderName === 'string') {
        chrome.bookmarks.create({title: options.folderName}, function(results) {
            console.log(results);
            if (results && typeof results == 'object') {
                options.folderID = results.id;
                console.log('Bookmarks folder created: '+results.title+' ('+results.id+')');
                if (typeof callback === 'function') callback(options);
            }
            else {
                console.error('Error creating root bookmarks folder');
            }
        }).bind(this);
    }
    else {
        if (typeof callback === 'function') callback(options);
    }
} // end BookmarkManager.createBookmarksFolder

BookmarkManager.prototype.getBookmarks = function(id, callback) {
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
} // end BookmarkManager.getBookmarks
// end BookmarkManager class


// Initialize BookmarkManager
var tlm = new BookmarkManager();
