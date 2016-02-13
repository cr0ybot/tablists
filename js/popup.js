/**
 * TabLists Popup
 * A Firefox TabGroups/Panorama Replacement
 * by Cory Hughart <cory@coryhughart.com>
 */

var tlp;

function TabListPopup() {
    console.log('TabListPopup initialized!');

    var me = this,
        loading = document.getElementById('loading'),
        tabListContainer = document.getElementById('tablists'),
        tabLists;

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

        me.renderAll();
    } // end init

    this.renderAll = function() {
        for (var i = 0; i < tabLists.length; i++) {
            renderSingle(tabLists[i]);
        }
    } // end renderAll

    this.renderSingle = function() {
        // TODO
    } // end renderSingle

} // end TabListPopup

document.addEventListener("DOMContentLoaded", function(event) {
    tlp = new TabListPopup();
});
