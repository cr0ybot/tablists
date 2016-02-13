/**
 * TabLists Popup
 * A Firefox TabGroups/Panorama Replacement
 * by Cory Hughart <cory@coryhughart.com>
 */

var tlp;

function TabListPopup() {
    console.log('TabListPopup initialized!');

    this.loading = document.getElementById('loading');
    this.tabListContainer = document.getElementById('tablists');
    this.tabLists = [];

    // Initialize via message to background
    chrome.runtime.sendMessage({request: 'bookmarks'},function(response) {
        this.init(response);
    }.bind(this));
} // end TabListPopup

TabListPopup.prototype.init = function(bookmarks) {
    console.group('TabListPopup initialized with bookmarks:');
    console.log(bookmarks);
    console.groupEnd();

    // Remove loader after fade-out animation
    loading.addEventListener('animationend', function(e) {
        document.body.removeChild(loading);
    }, false);
    loading.classList.add('done');

    this.setupTabLists(bookmarks);
    this.renderAll();
} // end init

TabListPopup.prototype.setupTabLists = function(bookmarks) {
    // If there are no bookmarks, create a new default
    if (bookmarks.children.length == 0) {
        // No tab lists, let's create one & add it to the tabLists array
        var tl = new TabList();
        this.tabLists.push(tl);
        tl.createNew('Default', function(results) {
            options.activeList = 0;
            //tl.compareListToTabs(options.activeList);
        });
    }
    else {
        // Create TabLists for each bookmarkTree child
        for (var i = 0; i < bookmarks.children.length; i++) {
            var tl = new TabList();
            this.tabLists.push(tl);
            tl.initFromBookmarkTree(bookmarks.children[i]);
        }
    }
} // end TabListManager.setupTabLists

TabListPopup.prototype.renderAll = function() {
    var html = '<ol class="tablist-root">';

    for (var i = 0; i < this.tabLists.length; i++) {
        html += '<li class="tablist" id="tl-'+i+'">';
        html += '<div class="tablist-header"><h1>'+this.tabLists[i].getName()+'</h1></div>';
        html += '<div class="tablist-box">';
        html += this.tabLists[i].renderList();
        html += '</div></li>';
    }

    html += '</ol>';

    this.tabListContainer.insertAdjacentHTML('afterbegin', html);
} // end renderAll
// end TabListPopup class


/**
 * TabList class
 * @constructor
 **/
function TabList() {
    console.log('Empty TabList initialized');

    this.treeNode = null;

} // end TabList

// TabList getters & setters

TabList.prototype.getID = function() {
    return this.treeNode.id;
} // end TabList.getID

TabList.prototype.getName = function() {
    return this.treeNode.title;
} // end TabList.getName

TabList.prototype.setName = function(name, callback) {
    chrome.bookmarks.update(this.getID(), {'title': name}, callback);
} // end TabList.setName

// TabList class methods

/**
 * Initialize TabList from bookmarkTree
 **/
TabList.prototype.initFromBookmarkTree = function(bookmarkTree, callback) {
    if (this.treeNode === null) {
        // TODO: check for ID & title
        console.log('TabList initializing from bookmark tree node '+bookmarkTree.id+':'+bookmarkTree.title);
        //console.log(bookmarkTree);

        this.treeNode = bookmarkTree;
    }
    else {
        console.warn('TabList '+this.getID()+':'+this.getTitle()+' already initialized!');
    }

    if (typeof callback === 'function') callback(this);
} // end TabList.initFromBookmarkTree

/**
 * Initialize TabList with a newly-created bookmark tree
 **/
TabList.prototype.createNew = function(title, callback) {
    if (this.treeNode === null) {
        chrome.bookmarks.create({
            parentId: options.folderID,
            title: title
        }, function(results) {
            if (chrome.runtime.lastError) {
                console.warn(chrome.runtime.lastError.message);
            }

            this.treeNode = results;
            this.compareListToTabs(callback);

            //if (typeof callback === 'function') callback(results);
        }).bind(this);
    }
    else {
        console.warn('TabList '+this.getID()+':'+this.getTitle()+' already initialized!');
        if (typeof callback === 'function') callback(this);
    }
} // end TabList.createNew

/**
 * Compare bookmark list with current window's tabs
 **/
TabList.prototype.compareListToTabs = function(callback) {
    var list = treeNode.children;

    console.log('Comparing list '+this.getID()+':'+this.getTitle()+' with tabs...');

    // Nested function to handle comparison
    function doCompare(theTabs) {
        currentTabs = theTabs;
        console.group('Current tabs:');
        console.log(currentTabs);
        console.groupEnd();

        if (list.length != currentTabs.length) {
            console.log('Your tabs are not synced with this list!');
            if (confirm('Your tabs are not synced with TabList "'+this.getTitle()+'"!\n\nSync now?')) {
                // sync tabs to list
                this.syncTabsToList(theTabs, callback);
            }
        }
        else if (list.length > 0) {
            for (i = 0; i < currentTabs.length; i++) {
                if (i >= list.length || currentTabs[i].url != list[i].url) {
                    console.log('Your tabs are not synced with the list!');
                    if (confirm('Your tabs are not synced with TabList '+me.getID()+':'+me.getTitle()+'!\n\nSync now?')) {
                        // sync tabs to list
                        this.syncTabsToList(theTabs, callback);
                    }
                    break;
                }
                else {
                    console.log('Bookmark '+i+' is in sync');
                }
            }
        }
        else {
            this.syncTabsToList(theTabs, callback);
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
        }).bind(this);
    }
} // end TabList.compareListToTabs

TabList.prototype.syncTabsToList = function(tabs, callback) {
    console.group('Syncing tabs to list '+this.getID()+':'+this.getTitle());

    var list = this.treeNode.children;

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

    if (typeof callback === 'function') callback(this);
} // end TabList.syncTabsToList

TabList.prototype.renderList = function() {
    var html = '<ol class="tabs">';

    if (this.treeNode !== null) {
        var list = this.treeNode.children;
        for (var i = 0; i < list.length; i++) {
            var title = list[i].title,
                url = list[i].url;
            html += '<li><a href="'+url+'">';
            html += '<img src="chrome://favicon/'+url+'" alt="'+title+'" width="16" height="16" />';
            html += title;
            html += '</a></li>';
        }
    }

    html += '</ol>'

    return html;
} // end TabList.renderHTML
// end TabList class


document.addEventListener("DOMContentLoaded", function(event) {
    tlp = new TabListPopup();
});
