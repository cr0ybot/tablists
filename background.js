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
        'startupList': null         // int of list to load at startup, or null for last list you had loaded
    },
    options,
    bookmarkTree,
    curentTabs,
    tabLists = [];

/**
 * TabListManager class
 * Since there will be only one, we are not using the "prototype" pattern,
 * especially since we need to be able to reference "this" quite often.
 * @constructor
 * @param {object} options - options object
 * @param {string} options.folderID - id of the folder that TabLists bookmarks will be saved to
 * @param {string} options.folderName - name of the folder that TabLists bookmarks will be saved to
 * @param {number} options.activeList - the id of the TabList that is currently active
 * @param {array} options.activeTab - an array of the active tab id for each TabList
 * @param {number} options.startupList - the id of the TabList to load at startup, or null for the last list that was active (overrides activeList)
 */
function TabListManager(passedOptions) {
    console.log('TabListManager initialized!');

    var me = this;

    // TabListManager event listeners

    this.initMessageListener = function() {

        chrome.runtime.onMessage.addListener(function(message, sender, callback) {

            // Submit
            if (message.submit) {
                if (message.data !== undefined) {
                    console.log('Submit message from '+sender+' received: '+JSON.stringify(message.data));
                    switch (message.submit) {
                        case 'options':
                            me.saveOptions(message.data);
                            callback(message.data);
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
                    case 'tabLists':
                        callback(tabLists);
                    break;
                    default:
                        console.warn('Request message from '+sender+' received but not understood: '+message.request);
                    break;
                }
            }
        });
    }

    this.initTabListeners = function() {
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

    this.tabCreatedHandler = function(tab) {
        // TODO
    }

    this.tabUpdatedHandler = function(tabId, changeInfo, tab) {
        // TODO
    }

    this.tabMovedHandler = function(tabId, moveInfo) {
        // TODO
    }

    this.tabActivatedHandler = function(activeInfo) {
        // TODO
    }

    this.tabDetachedHandler = function(tabId, detachInfo) {
        // TODO
    }

    this.tabAttachedHandler = function(tabId, attachInfo) {
        // TODO
    }

    this.tabRemovedHandler = function(tabId, removeInfo) {
        // TODO
    }

    this.tabReplacedHandler = function(addedTabId, removedTabId) {
        // TODO
    }

    // TabListManager class methods

    /**
     * Checks options passed to TabListManager (if any)
     * Looks for folderID and kicks off tablist setup
     **/
    this.checkOptions = function(passedOptions) {
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
            me.searchForBookmarksFolder(function(o) {
                me.saveOptions(o, me.checkOptions);
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
        me.getBookmarksTree(options.folderID, me.setupTabLists);
    } // end checkOptions

    this.saveOptions = function(data, callback) {
        console.log('Saving options...');

        options = data;
        chrome.storage.local.set(options, function() {
            //alert('Settings saved.');
            console.group('Options saved:');
            console.log(options);
            console.groupEnd();

            if (typeof callback === 'function') callback(options);
        });
    } // end saveOptions

    this.searchForBookmarksFolder = function(callback) {
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
                    me.createBookmarksFolder(callback);
                }
            });
        }
        else {
            console.error('Cannot find TabLists bookmarks folder: No folderName set');
        }
    } // end searchForBookmarksFolder

    this.createBookmarksFolder = function(callback) {
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
            });
        }
        else {
            if (typeof callback === 'function') callback(options);
        }
    } // end createBookmarksFolder

    this.getBookmarksTree = function(id, callback) {
        console.log('Getting bookmark by id: '+id);

        chrome.bookmarks.getSubTree(id, function(results) {
            if (chrome.runtime.lastError) {
                console.warn(chrome.runtime.lastError.message);
                // Wrong folderID, we'll assume the folder no longer exists
                me.createBookmarksFolder(function(o) {
                    me.saveOptions(o, me.checkOptions);
                });
            }

            if (results) {
                console.group('Bookmark tree retrieved:');
                console.log(results[0]);
                console.groupEnd();
                bookmarkTree = results[0];
                if (typeof callback === 'function') callback(bookmarkTree);
            }
            else {
                me.createBookmarksFolder(function(o) {
                    me.saveOptions(o, me.checkOptions);
                });
            }
        });
    } // end getBookmarksTree

    this.setupTabLists = function(bookmarkTree) {
        // If there are no bookmarks, create a new default
        if (bookmarkTree.children.length == 0) {
            // No tab lists, let's create one & add it to the tabLists array
            var tl = new TabList();
            tabLists.push(tl);
            tl.createNew('Default', function(results) {
                options.activeList = 0;
                //tl.compareListToTabs(options.activeList);
            });
        }
        else {
            // Create TabLists for each bookmarkTree child
            for (var i = 0; i < bookmarkTree.children.length; i++) {
                var tl = new TabList();
                tabLists.push(tl);
                tl.initFromBookmarkTree(bookmarkTree.children[i]);
            }
        }
    } // end setupTabLists

    // TabListManager constructor

    // Global message listener
    me.initMessageListener();

    // Tab listeners
    me.initTabListeners();

    // Options initialization
    if (typeof passedOptions === 'undefined') {
        // init settings using chrome.storage.local (check if exists first)
        console.log('Getting options from storage...');
        chrome.storage.local.get(function(items) {
            me.checkOptions(items);
        });
    }
    else {
        console.log('Options passed to init: '+JSON.stringify(passedOptions));
        me.checkOptions(passedOptions);
    }
} // end TabListManager class


/**
 * TabList class
 * @constructor
 */
function TabList() {
    console.log('Empty TabList initialized');

    var me = this,
        treeNode;

    // TabList getters & setters

    this.getID = function() {
        return treeNode.id;
    }

    this.getName = function() {
        return treeNode.title;
    }

    this.setName = function(name, callback) {
        chrome.bookmarks.update(me.getID(), {'title': name}, callback);
    }

    /**
     * Initialize TabList from bookmarkTree
     **/
    this.initFromBookmarkTree = function(bookmarkTree, callback) {
        console.log('TabList initializing from bookmark tree node '+bookmarkTree.id+':'+bookmarkTree.title);
        //console.log(bookmarkTree);

        me.treeNode = bookmarkTree;

        if (typeof callback === 'function') callback(me);
    } // end initFromBookmarkTree

    /**
     * Initialize TabList with a newly-created bookmark tree
     **/
    this.createNew = function(title, callback) {
        chrome.bookmarks.create({
            parentId: options.folderID,
            title: title
        }, function(results) {
            if (chrome.runtime.lastError) {
                console.warn(chrome.runtime.lastError.message);
            }

            me.treeNode = results;
            me.compareListToTabs(callback);

            //if (typeof callback === 'function') callback(results);
        });
    } // end createNew

    /**
     * Compare bookmark list with current window's tabs
     **/
    this.compareListToTabs = function(callback) {
        var list = treeNode.children;

        console.log('Comparing list '+treeNode.id+':'+treeNode.title+' with tabs...');

        // Nested function to handle comparison
        function doCompare(theTabs) {
            currentTabs = theTabs;
            console.group('Current tabs:');
            console.log(currentTabs);
            console.groupEnd();

            if (list.length != currentTabs.length) {
                console.log('Your tabs are not synced with this list!');
                if (confirm('Your tabs are not synced with TabList "'+treeNode.title+'"!\n\nSync now?')) {
                    // sync tabs to list
                    me.syncTabsToList(theTabs, callback);
                }
            }
            else if (list.length > 0) {
                for (i = 0; i < currentTabs.length; i++) {
                    if (i >= list.length || currentTabs[i].url != list[i].url) {
                        console.log('Your tabs are not synced with the list!');
                        if (confirm('Your tabs are not synced with TabList '+treeNode.id+':'+treeNode.title+'!\n\nSync now?')) {
                            // sync tabs to list
                            me.syncTabsToList(theTabs, callback);
                        }
                        break;
                    }
                    else {
                        console.log('Bookmark '+i+' is in sync');
                    }
                }
            }
            else {
                me.syncTabsToList(theTabs, callback);
            }
        } // end doCompare

        if (Array.isArray(tabs)) {
            doCompare(tabs);
        }
        else {
            // Get all tabs in current window
            chrome.tabs.query({}, function(results) {
                if (chrome.runtime.lastError) {
                    console.warn(chrome.runtime.lastError.message);
                }

                if (results) {
                    doCompare(results);
                }
            });
        }
    } // end compareListToTabs

    this.syncTabsToList = function(tabs, callback) {
        console.group('Syncing tabs to list '+treeNode.id+':'+treeNode.title);

        var list = treeNode.children;

        for (var i = 0; i < tabs.length; i++) {
            // check if index fits in current bookmark list
            // if it does, we can update the bookmark instead of deleting & creating one
            if (i < list.length) {
                console.log('Updating bookmark '+i+' ('+list[i].id+')');

                chrome.bookmarks.update(list[i].id, {
                    'title': tabs[i].title,
                    'url': tabs[i].url
                });

                // if we're within the original bookmark list length but this is the last tab,
                // the rest of the bookmarks need to be deleted
                if (i == tabs.length - 1) {
                    for (var j = i + 1; j < list.length; j++) {
                        console.log('Removing bookmark '+j+' ('+list[j].id+')');
                        chrome.bookmarks.remove(list[j].id);
                    }
                }
            }
            // if we're past the original length, we need to create new bookmarks
            else {
                console.log('Creating bookmark '+i);
                chrome.bookmarks.create({
                    'parentId': treeNode.id,
                    'title': tabs[i].title,
                    'url': tabs[i].url
                });
            }
            console.groupEnd();
        }
    } // end syncTabsToList

} // end TabList class


// Initialize TabListManager
var tlm = new TabListManager();
