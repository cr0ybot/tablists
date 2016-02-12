/**
 * TabLists Popup
 * A Firefox TabGroups/Panorama Replacement
 * by Cory Hughart <cory@coryhughart.com>
 */

var tlp,
    loading,
    tabListContainer,
    tabLists;

function TabListPopup() {
    console.log('TabListPopup initialized!');

    var me = this;

    // Initialize via message to background
    chrome.runtime.sendMessage({request: 'tabLists'},function(response) {
        me.init(response);
    });

    this.init = function(baseTabLists) {
        tabLists = baseTabLists;

        console.group('TabListPopup loaded:');
        console.log(tabLists);
        console.groupEnd();

        // Remove loader after fade-out animation
        loading.addEventListener('animationend', function(e) {
            document.body.removeChild(loading);
        }, false);
        loading.classList.add('done');
    } // end init

    /*
    this.renderTabLists() {
        // TODO
    } // end renderTabLists
    */
} // end TabListPopup

document.addEventListener("DOMContentLoaded", function(event) {
    loading = document.getElementById('loading');
    tabListContainer = document.getElementById('tablists');
    tlp = new TabListPopup();
});
