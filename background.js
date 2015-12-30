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
    curentTabs;

function TabListManager(passedOptions) {
    console.log('TabLists initialized!');

    var me = this;

    // Global message listener
    chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {

        // Submit
        if (message.submit) {
            if (message.data !== undefined) {
                console.log('Submit message from '+sender+' received: '+JSON.stringify(message.data));
                switch (message.submit) {
                    case 'options':
                        me.saveOptions(message.data);
                        me.sendResponse(message.data);
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
                    me.sendResponse(options);
                break;
                case 'defaultOptions':
                    me.sendResponse(defaultOptions);
                break;
                default:
                    console.warn('Request message from '+sender+' received but not understood: '+message.request);
                break;
            }
        }
    });

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

    // TabListManager methods

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
                me.saveOptions(o, checkOptions);
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
        me.getBookmarksTree(options.folderID, me.setupTabs);
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
                    saveOptions(o, checkOptions);
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
                    me.saveOptions(o, checkOptions);
                });
            }
        });
    } // end getBookmarksTree

    this.setupTabs = function(bookmarkTree) {
        console.log('Setting up TabLists...');
        //console.log(bookmarkTree);

        if (bookmarkTree.children.length == 0) {
            // No tab lists, let's create one
            me.createList('Default', function(results) {
                options.activeList = 0;
                me.compareListToTabs(options.activeList);
            });
        }
        else {
            me.compareListToTabs(options.activeList);
        }
    } // end setupTabs

    this.compareListToTabs = function(listID, tabs, callback) {
        console.log('Comparing list '+listID+' with tabs...');

        var list = bookmarkTree.children[listID].children;

        // Nested function to handle comparison
        function doCompare(theTabs) {
            currentTabs = theTabs;
            console.group('Current tabs:');
            console.log(currentTabs);
            console.groupEnd();

            for (i = 0; i < currentTabs.length; i++) {
                if (currentTabs[i].url != list[i].url) {
                    console.log('Your tabs are not synced with the list!');
                    if (confirm('Your tabs are not synced with TabList '+listID+'!\n\nSync now?')) {
                        // sync tabs to list
                    }
                    break;
                }
            }
        }

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

    this.createList = function(title, callback) {
        chrome.bookmarks.create({
            parentId: options.folderID,
            title: title
        }, function(results) {
            if (chrome.runtime.lastError) {
                console.warn(chrome.runtime.lastError.message);
            }

            if (typeof callback === 'function') callback(results);
        });
    } // end createList
} // end TabListManager

var tlm = new TabListManager();
