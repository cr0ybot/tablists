/**
 * TabLists Popup
 * A Firefox TabGroups/Panorama Replacement
 * by Cory Hughart <cory@coryhughart.com>
 */

var loading,
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

        loading.classList.add('done');
        // Remove loader after fade-out animation
        // Should we use an animation complete listener instead?
        setTimeout(function() {
            document.body.removeChild(loading)
        }, 1000);
    }
} // end TabListPopup

document.addEventListener("DOMContentLoaded", function(event) {
    loading = document.getElementById('loading');

    var tlp = new TabListPopup();
});
