/**
 * TabLists Options
 * A Firefox TabGroups/Panorama Replacement
 * by Cory Hughart <cory@coryhughart.com>
 */

// ready
$(function() {
	// load settings
	//input.init();

	// menu functionality
	$('.menu a').click(function(e) {
		goToPanel($(e.currentTarget).attr('href'));
		return false;
	});
	$('.mainview > *:not(.selected)').css('display', 'none');


	// go to hash location
	var hash = window.location.hash;
	if (hash !== '' && hash !== '#') {
		goToPanel(hash);
	}
	$(window).on('hashchange', function() {
		goToPanel(window.location.hash);
	});
});

function goToPanel(hash) {
	var selected = 'selected';
	$('.mainview > *').removeClass(selected);
	$('.menu li').removeClass(selected);
	setTimeout(function() {
		$('.mainview > *:not(.selected)').css('display', 'none');
	}, 100);

	$('[href="'+hash+'"]').parent().addClass(selected);
	var currentView = $(hash);
	currentView.css('display', 'block');
	setTimeout(function() {
		currentView.addClass(selected);
		window.location.hash = hash;
	}, 0);
	setTimeout(function() {
		$('body')[0].scrollTop = 0;
	}, 200);
};

var initialOptions, options, defaultOptions,

	input = {
		init : function() {
			// grab settings from background page (async)
			chrome.extension.sendMessage({request: 'options'}, function(response) {
				options = response;
				// create clone for safekeeping
				input.setInitialOptions(options);
				console.log('Options page options loaded: ' + JSON.stringify(options));

				// buttons
				$('.function:button').click(function(e) {
					//alert(e.currentTarget.value);
					var buttonVal = e.currentTarget.value.split(' ');
					var func = buttonVal[0];
					var setting = buttonVal[1];
					//alert(setting);

					if (input.hasOwnProperty(setting)) {
						if (input[setting].hasOwnProperty(func)) {
							input[setting][func]();
						}
						else alert('Error: no such function (' + func + ') for setting (' + setting + ')');
					}
					else alert('Error: no such setting (' + setting + ')');

					e.preventDefault();
				});
			});
		},
		save : function(d) {
			// set local options
			for (var item in d) {
				options[item] = d[item];
			}
			console.log('Saving options: ' + JSON.stringify(options));
			// save to storage
			chrome.extension.sendMessage({submit: 'options', data: options}, function(response) {
				input.setInitialOptions(response);
			});
		},
		loadDefaultOptions : function(callback) {
			if (!defaultOptions) {
				chrome.extension.sendMessage({request: 'defaultOptions'}, function(response) {
					defaultOptions = response;
					console.log('Options page defaultOptions loaded: ' + JSON.stringify(defaultOptions));
					// callback
					typeof callback === 'function' && callback();
				});
			}
			else typeof callback === 'function' && callback();
		},
		setInitialOptions : function(o) {
			// NOTE: setting this directly equal to options doesn't work, as objects pass by reference instead of value
			initialOptions = copyObject(o);
			//console.log('initialOptions set: ' + JSON.stringify(initialOptions));
		}
	};

// utility functions
function isChecked(e) {
	return $(e).is(':checked');
}
function printSettings(s) {
	var string = '';
	for (var p in s) {
		string += '\n';
		string += '"' + p + '"';
		for (var subP in s[p]) {
			string += ' ' + subP + ': ' + s[p][subP];
		}
	}
	return string;
}
function copyObject(o) {
	return JSON.parse(JSON.stringify(o));
}
