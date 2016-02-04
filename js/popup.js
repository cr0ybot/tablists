/**
 * TabLists Popup
 * A Firefox TabGroups/Panorama Replacement
 * by Cory Hughart <cory@coryhughart.com>
 */

function TabListPopup() {
    console.log('TabListPopup initialized!');

    var me = this;

    // Initialize via message to background
    chrome.runtime.sendMessage({request: 'tabLists'}, me.init);

    this.init = function(baseTabLists) {
        tabLists = baseTabLists;

        console.log('TabListPopup loaded');

        document.body.removeChild(loading);
    }
} // end TabListPopup

document.addEventListener("DOMContentLoaded", function(event) {
    var loading = document.getElementById('loading');

    var tabLists;

    var tlp = new TabListPopup();
});
