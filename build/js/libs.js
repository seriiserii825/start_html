/*!
 * jQuery Migrate - v3.0.0 - 2016-06-09
 * Copyright jQuery Foundation and other contributors
 */
(function( jQuery, window ) {
"use strict";


jQuery.migrateVersion = "3.0.0";


( function() {

	// Support: IE9 only
	// IE9 only creates console object when dev tools are first opened
	// Also, avoid Function#bind here to simplify PhantomJS usage
	var log = window.console && window.console.log &&
			function() { window.console.log.apply( window.console, arguments ); },
		rbadVersions = /^[12]\./;

	if ( !log ) {
		return;
	}

	// Need jQuery 3.0.0+ and no older Migrate loaded
	if ( !jQuery || rbadVersions.test( jQuery.fn.jquery ) ) {
		log( "JQMIGRATE: jQuery 3.0.0+ REQUIRED" );
	}
	if ( jQuery.migrateWarnings ) {
		log( "JQMIGRATE: Migrate plugin loaded multiple times" );
	}

	// Show a message on the console so devs know we're active
	log( "JQMIGRATE: Migrate is installed" +
		( jQuery.migrateMute ? "" : " with logging active" ) +
		", version " + jQuery.migrateVersion );

} )();

var warnedAbout = {};

// List of warnings already given; public read only
jQuery.migrateWarnings = [];

// Set to false to disable traces that appear with warnings
if ( jQuery.migrateTrace === undefined ) {
	jQuery.migrateTrace = true;
}

// Forget any warnings we've already given; public
jQuery.migrateReset = function() {
	warnedAbout = {};
	jQuery.migrateWarnings.length = 0;
};

function migrateWarn( msg ) {
	var console = window.console;
	if ( !warnedAbout[ msg ] ) {
		warnedAbout[ msg ] = true;
		jQuery.migrateWarnings.push( msg );
		if ( console && console.warn && !jQuery.migrateMute ) {
			console.warn( "JQMIGRATE: " + msg );
			if ( jQuery.migrateTrace && console.trace ) {
				console.trace();
			}
		}
	}
}

function migrateWarnProp( obj, prop, value, msg ) {
	Object.defineProperty( obj, prop, {
		configurable: true,
		enumerable: true,
		get: function() {
			migrateWarn( msg );
			return value;
		}
	} );
}

if ( document.compatMode === "BackCompat" ) {

	// JQuery has never supported or tested Quirks Mode
	migrateWarn( "jQuery is not compatible with Quirks Mode" );
}


var oldInit = jQuery.fn.init,
	oldIsNumeric = jQuery.isNumeric,
	oldFind = jQuery.find,
	rattrHashTest = /\[(\s*[-\w]+\s*)([~|^$*]?=)\s*([-\w#]*?#[-\w#]*)\s*\]/,
	rattrHashGlob = /\[(\s*[-\w]+\s*)([~|^$*]?=)\s*([-\w#]*?#[-\w#]*)\s*\]/g;

jQuery.fn.init = function( arg1 ) {
	var args = Array.prototype.slice.call( arguments );

	if ( typeof arg1 === "string" && arg1 === "#" ) {

		// JQuery( "#" ) is a bogus ID selector, but it returned an empty set before jQuery 3.0
		migrateWarn( "jQuery( '#' ) is not a valid selector" );
		args[ 0 ] = [];
	}

	return oldInit.apply( this, args );
};
jQuery.fn.init.prototype = jQuery.fn;

jQuery.find = function( selector ) {
	var args = Array.prototype.slice.call( arguments );

	// Support: PhantomJS 1.x
	// String#match fails to match when used with a //g RegExp, only on some strings
	if ( typeof selector === "string" && rattrHashTest.test( selector ) ) {

		// The nonstandard and undocumented unquoted-hash was removed in jQuery 1.12.0
		// First see if qS thinks it's a valid selector, if so avoid a false positive
		try {
			document.querySelector( selector );
		} catch ( err1 ) {

			// Didn't *look* valid to qSA, warn and try quoting what we think is the value
			selector = selector.replace( rattrHashGlob, function( _, attr, op, value ) {
				return "[" + attr + op + "\"" + value + "\"]";
			} );

			// If the regexp *may* have created an invalid selector, don't update it
			// Note that there may be false alarms if selector uses jQuery extensions
			try {
				document.querySelector( selector );
				migrateWarn( "Attribute selector with '#' must be quoted: " + args[ 0 ] );
				args[ 0 ] = selector;
			} catch ( err2 ) {
				migrateWarn( "Attribute selector with '#' was not fixed: " + args[ 0 ] );
			}
		}
	}

	return oldFind.apply( this, args );
};

// Copy properties attached to original jQuery.find method (e.g. .attr, .isXML)
var findProp;
for ( findProp in oldFind ) {
	if ( Object.prototype.hasOwnProperty.call( oldFind, findProp ) ) {
		jQuery.find[ findProp ] = oldFind[ findProp ];
	}
}

// The number of elements contained in the matched element set
jQuery.fn.size = function() {
	migrateWarn( "jQuery.fn.size() is deprecated; use the .length property" );
	return this.length;
};

jQuery.parseJSON = function() {
	migrateWarn( "jQuery.parseJSON is deprecated; use JSON.parse" );
	return JSON.parse.apply( null, arguments );
};

jQuery.isNumeric = function( val ) {

	// The jQuery 2.2.3 implementation of isNumeric
	function isNumeric2( obj ) {
		var realStringObj = obj && obj.toString();
		return !jQuery.isArray( obj ) && ( realStringObj - parseFloat( realStringObj ) + 1 ) >= 0;
	}

	var newValue = oldIsNumeric( val ),
		oldValue = isNumeric2( val );

	if ( newValue !== oldValue ) {
		migrateWarn( "jQuery.isNumeric() should not be called on constructed objects" );
	}

	return oldValue;
};

migrateWarnProp( jQuery, "unique", jQuery.uniqueSort,
	"jQuery.unique is deprecated, use jQuery.uniqueSort" );

// Now jQuery.expr.pseudos is the standard incantation
migrateWarnProp( jQuery.expr, "filters", jQuery.expr.pseudos,
	"jQuery.expr.filters is now jQuery.expr.pseudos" );
migrateWarnProp( jQuery.expr, ":", jQuery.expr.pseudos,
	"jQuery.expr[\":\"] is now jQuery.expr.pseudos" );


var oldAjax = jQuery.ajax;

jQuery.ajax = function( ) {
	var jQXHR = oldAjax.apply( this, arguments );

	// Be sure we got a jQXHR (e.g., not sync)
	if ( jQXHR.promise ) {
		migrateWarnProp( jQXHR, "success", jQXHR.done,
			"jQXHR.success is deprecated and removed" );
		migrateWarnProp( jQXHR, "error", jQXHR.fail,
			"jQXHR.error is deprecated and removed" );
		migrateWarnProp( jQXHR, "complete", jQXHR.always,
			"jQXHR.complete is deprecated and removed" );
	}

	return jQXHR;
};


var oldRemoveAttr = jQuery.fn.removeAttr,
	oldToggleClass = jQuery.fn.toggleClass,
	rmatchNonSpace = /\S+/g;

jQuery.fn.removeAttr = function( name ) {
	var self = this;

	jQuery.each( name.match( rmatchNonSpace ), function( i, attr ) {
		if ( jQuery.expr.match.bool.test( attr ) ) {
			migrateWarn( "jQuery.fn.removeAttr no longer sets boolean properties: " + attr );
			self.prop( attr, false );
		}
	} );

	return oldRemoveAttr.apply( this, arguments );
};

jQuery.fn.toggleClass = function( state ) {

	// Only deprecating no-args or single boolean arg
	if ( state !== undefined && typeof state !== "boolean" ) {
		return oldToggleClass.apply( this, arguments );
	}

	migrateWarn( "jQuery.fn.toggleClass( boolean ) is deprecated" );

	// Toggle entire class name of each element
	return this.each( function() {
		var className = this.getAttribute && this.getAttribute( "class" ) || "";

		if ( className ) {
			jQuery.data( this, "__className__", className );
		}

		// If the element has a class name or if we're passed `false`,
		// then remove the whole classname (if there was one, the above saved it).
		// Otherwise bring back whatever was previously saved (if anything),
		// falling back to the empty string if nothing was stored.
		if ( this.setAttribute ) {
			this.setAttribute( "class",
				className || state === false ?
				"" :
				jQuery.data( this, "__className__" ) || ""
			);
		}
	} );
};


var internalSwapCall = false;

// If this version of jQuery has .swap(), don't false-alarm on internal uses
if ( jQuery.swap ) {
	jQuery.each( [ "height", "width", "reliableMarginRight" ], function( _, name ) {
		var oldHook = jQuery.cssHooks[ name ] && jQuery.cssHooks[ name ].get;

		if ( oldHook ) {
			jQuery.cssHooks[ name ].get = function() {
				var ret;

				internalSwapCall = true;
				ret = oldHook.apply( this, arguments );
				internalSwapCall = false;
				return ret;
			};
		}
	} );
}

jQuery.swap = function( elem, options, callback, args ) {
	var ret, name,
		old = {};

	if ( !internalSwapCall ) {
		migrateWarn( "jQuery.swap() is undocumented and deprecated" );
	}

	// Remember the old values, and insert the new ones
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.apply( elem, args || [] );

	// Revert the old values
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
};

var oldData = jQuery.data;

jQuery.data = function( elem, name, value ) {
	var curData;

	// If the name is transformed, look for the un-transformed name in the data object
	if ( name && name !== jQuery.camelCase( name ) ) {
		curData = jQuery.hasData( elem ) && oldData.call( this, elem );
		if ( curData && name in curData ) {
			migrateWarn( "jQuery.data() always sets/gets camelCased names: " + name );
			if ( arguments.length > 2 ) {
				curData[ name ] = value;
			}
			return curData[ name ];
		}
	}

	return oldData.apply( this, arguments );
};

var oldTweenRun = jQuery.Tween.prototype.run;

jQuery.Tween.prototype.run = function( percent ) {
	if ( jQuery.easing[ this.easing ].length > 1 ) {
		migrateWarn(
			"easing function " +
			"\"jQuery.easing." + this.easing.toString() +
			"\" should use only first argument"
		);

		jQuery.easing[ this.easing ] = jQuery.easing[ this.easing ].bind(
			jQuery.easing,
			percent, this.options.duration * percent, 0, 1, this.options.duration
		);
	}

	oldTweenRun.apply( this, arguments );
};

var oldLoad = jQuery.fn.load,
	originalFix = jQuery.event.fix;

jQuery.event.props = [];
jQuery.event.fixHooks = {};

jQuery.event.fix = function( originalEvent ) {
	var event,
		type = originalEvent.type,
		fixHook = this.fixHooks[ type ],
		props = jQuery.event.props;

	if ( props.length ) {
		migrateWarn( "jQuery.event.props are deprecated and removed: " + props.join() );
		while ( props.length ) {
			jQuery.event.addProp( props.pop() );
		}
	}

	if ( fixHook && !fixHook._migrated_ ) {
		fixHook._migrated_ = true;
		migrateWarn( "jQuery.event.fixHooks are deprecated and removed: " + type );
		if ( ( props = fixHook.props ) && props.length ) {
			while ( props.length ) {
			   jQuery.event.addProp( props.pop() );
			}
		}
	}

	event = originalFix.call( this, originalEvent );

	return fixHook && fixHook.filter ? fixHook.filter( event, originalEvent ) : event;
};

jQuery.each( [ "load", "unload", "error" ], function( _, name ) {

	jQuery.fn[ name ] = function() {
		var args = Array.prototype.slice.call( arguments, 0 );

		// If this is an ajax load() the first arg should be the string URL;
		// technically this could also be the "Anything" arg of the event .load()
		// which just goes to show why this dumb signature has been deprecated!
		// jQuery custom builds that exclude the Ajax module justifiably die here.
		if ( name === "load" && typeof args[ 0 ] === "string" ) {
			return oldLoad.apply( this, args );
		}

		migrateWarn( "jQuery.fn." + name + "() is deprecated" );

		args.splice( 0, 0, name );
		if ( arguments.length ) {
			return this.on.apply( this, args );
		}

		// Use .triggerHandler here because:
		// - load and unload events don't need to bubble, only applied to window or image
		// - error event should not bubble to window, although it does pre-1.7
		// See http://bugs.jquery.com/ticket/11820
		this.triggerHandler.apply( this, args );
		return this;
	};

} );

// Trigger "ready" event only once, on document ready
jQuery( function() {
	jQuery( document ).triggerHandler( "ready" );
} );

jQuery.event.special.ready = {
	setup: function() {
		if ( this === document ) {
			migrateWarn( "'ready' event is deprecated" );
		}
	}
};

jQuery.fn.extend( {

	bind: function( types, data, fn ) {
		migrateWarn( "jQuery.fn.bind() is deprecated" );
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		migrateWarn( "jQuery.fn.unbind() is deprecated" );
		return this.off( types, null, fn );
	},
	delegate: function( selector, types, data, fn ) {
		migrateWarn( "jQuery.fn.delegate() is deprecated" );
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {
		migrateWarn( "jQuery.fn.undelegate() is deprecated" );
		return arguments.length === 1 ?
			this.off( selector, "**" ) :
			this.off( types, selector || "**", fn );
	}
} );


var oldOffset = jQuery.fn.offset;

jQuery.fn.offset = function() {
	var docElem,
		elem = this[ 0 ],
		origin = { top: 0, left: 0 };

	if ( !elem || !elem.nodeType ) {
		migrateWarn( "jQuery.fn.offset() requires a valid DOM element" );
		return origin;
	}

	docElem = ( elem.ownerDocument || document ).documentElement;
	if ( !jQuery.contains( docElem, elem ) ) {
		migrateWarn( "jQuery.fn.offset() requires an element connected to a document" );
		return origin;
	}

	return oldOffset.apply( this, arguments );
};


var oldParam = jQuery.param;

jQuery.param = function( data, traditional ) {
	var ajaxTraditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;

	if ( traditional === undefined && ajaxTraditional ) {

		migrateWarn( "jQuery.param() no longer uses jQuery.ajaxSettings.traditional" );
		traditional = ajaxTraditional;
	}

	return oldParam.call( this, data, traditional );
};

var oldSelf = jQuery.fn.andSelf || jQuery.fn.addBack;

jQuery.fn.andSelf = function() {
	migrateWarn( "jQuery.fn.andSelf() replaced by jQuery.fn.addBack()" );
	return oldSelf.apply( this, arguments );
};


var oldDeferred = jQuery.Deferred,
	tuples = [

		// Action, add listener, callbacks, .then handlers, final state
		[ "resolve", "done", jQuery.Callbacks( "once memory" ),
			jQuery.Callbacks( "once memory" ), "resolved" ],
		[ "reject", "fail", jQuery.Callbacks( "once memory" ),
			jQuery.Callbacks( "once memory" ), "rejected" ],
		[ "notify", "progress", jQuery.Callbacks( "memory" ),
			jQuery.Callbacks( "memory" ) ]
	];

jQuery.Deferred = function( func ) {
	var deferred = oldDeferred(),
		promise = deferred.promise();

	deferred.pipe = promise.pipe = function( /* fnDone, fnFail, fnProgress */ ) {
		var fns = arguments;

		migrateWarn( "deferred.pipe() is deprecated" );

		return jQuery.Deferred( function( newDefer ) {
			jQuery.each( tuples, function( i, tuple ) {
				var fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];

				// Deferred.done(function() { bind to newDefer or newDefer.resolve })
				// deferred.fail(function() { bind to newDefer or newDefer.reject })
				// deferred.progress(function() { bind to newDefer or newDefer.notify })
				deferred[ tuple[ 1 ] ]( function() {
					var returned = fn && fn.apply( this, arguments );
					if ( returned && jQuery.isFunction( returned.promise ) ) {
						returned.promise()
							.done( newDefer.resolve )
							.fail( newDefer.reject )
							.progress( newDefer.notify );
					} else {
						newDefer[ tuple[ 0 ] + "With" ](
							this === promise ? newDefer.promise() : this,
							fn ? [ returned ] : arguments
						);
					}
				} );
			} );
			fns = null;
		} ).promise();

	};

	if ( func ) {
		func.call( deferred, deferred );
	}

	return deferred;
};



})( jQuery, window );
/*! Magnific Popup - v1.1.0 - 2016-02-20
* http://dimsemenov.com/plugins/magnific-popup/
* Copyright (c) 2016 Dmitry Semenov; */
;(function (factory) { 
if (typeof define === 'function' && define.amd) { 
 // AMD. Register as an anonymous module. 
 define(['jquery'], factory); 
 } else if (typeof exports === 'object') { 
 // Node/CommonJS 
 factory(require('jquery')); 
 } else { 
 // Browser globals 
 factory(window.jQuery || window.Zepto); 
 } 
 }(function($) { 

/*>>core*/
/**
 * 
 * Magnific Popup Core JS file
 * 
 */


/**
 * Private static constants
 */
var CLOSE_EVENT = 'Close',
	BEFORE_CLOSE_EVENT = 'BeforeClose',
	AFTER_CLOSE_EVENT = 'AfterClose',
	BEFORE_APPEND_EVENT = 'BeforeAppend',
	MARKUP_PARSE_EVENT = 'MarkupParse',
	OPEN_EVENT = 'Open',
	CHANGE_EVENT = 'Change',
	NS = 'mfp',
	EVENT_NS = '.' + NS,
	READY_CLASS = 'mfp-ready',
	REMOVING_CLASS = 'mfp-removing',
	PREVENT_CLOSE_CLASS = 'mfp-prevent-close';


/**
 * Private vars 
 */
/*jshint -W079 */
var mfp, // As we have only one instance of MagnificPopup object, we define it locally to not to use 'this'
	MagnificPopup = function(){},
	_isJQ = !!(window.jQuery),
	_prevStatus,
	_window = $(window),
	_document,
	_prevContentType,
	_wrapClasses,
	_currPopupType;


/**
 * Private functions
 */
var _mfpOn = function(name, f) {
		mfp.ev.on(NS + name + EVENT_NS, f);
	},
	_getEl = function(className, appendTo, html, raw) {
		var el = document.createElement('div');
		el.className = 'mfp-'+className;
		if(html) {
			el.innerHTML = html;
		}
		if(!raw) {
			el = $(el);
			if(appendTo) {
				el.appendTo(appendTo);
			}
		} else if(appendTo) {
			appendTo.appendChild(el);
		}
		return el;
	},
	_mfpTrigger = function(e, data) {
		mfp.ev.triggerHandler(NS + e, data);

		if(mfp.st.callbacks) {
			// converts "mfpEventName" to "eventName" callback and triggers it if it's present
			e = e.charAt(0).toLowerCase() + e.slice(1);
			if(mfp.st.callbacks[e]) {
				mfp.st.callbacks[e].apply(mfp, $.isArray(data) ? data : [data]);
			}
		}
	},
	_getCloseBtn = function(type) {
		if(type !== _currPopupType || !mfp.currTemplate.closeBtn) {
			mfp.currTemplate.closeBtn = $( mfp.st.closeMarkup.replace('%title%', mfp.st.tClose ) );
			_currPopupType = type;
		}
		return mfp.currTemplate.closeBtn;
	},
	// Initialize Magnific Popup only when called at least once
	_checkInstance = function() {
		if(!$.magnificPopup.instance) {
			/*jshint -W020 */
			mfp = new MagnificPopup();
			mfp.init();
			$.magnificPopup.instance = mfp;
		}
	},
	// CSS transition detection, http://stackoverflow.com/questions/7264899/detect-css-transitions-using-javascript-and-without-modernizr
	supportsTransitions = function() {
		var s = document.createElement('p').style, // 's' for style. better to create an element if body yet to exist
			v = ['ms','O','Moz','Webkit']; // 'v' for vendor

		if( s['transition'] !== undefined ) {
			return true; 
		}
			
		while( v.length ) {
			if( v.pop() + 'Transition' in s ) {
				return true;
			}
		}
				
		return false;
	};



/**
 * Public functions
 */
MagnificPopup.prototype = {

	constructor: MagnificPopup,

	/**
	 * Initializes Magnific Popup plugin. 
	 * This function is triggered only once when $.fn.magnificPopup or $.magnificPopup is executed
	 */
	init: function() {
		var appVersion = navigator.appVersion;
		mfp.isLowIE = mfp.isIE8 = document.all && !document.addEventListener;
		mfp.isAndroid = (/android/gi).test(appVersion);
		mfp.isIOS = (/iphone|ipad|ipod/gi).test(appVersion);
		mfp.supportsTransition = supportsTransitions();

		// We disable fixed positioned lightbox on devices that don't handle it nicely.
		// If you know a better way of detecting this - let me know.
		mfp.probablyMobile = (mfp.isAndroid || mfp.isIOS || /(Opera Mini)|Kindle|webOS|BlackBerry|(Opera Mobi)|(Windows Phone)|IEMobile/i.test(navigator.userAgent) );
		_document = $(document);

		mfp.popupsCache = {};
	},

	/**
	 * Opens popup
	 * @param  data [description]
	 */
	open: function(data) {

		var i;

		if(data.isObj === false) { 
			// convert jQuery collection to array to avoid conflicts later
			mfp.items = data.items.toArray();

			mfp.index = 0;
			var items = data.items,
				item;
			for(i = 0; i < items.length; i++) {
				item = items[i];
				if(item.parsed) {
					item = item.el[0];
				}
				if(item === data.el[0]) {
					mfp.index = i;
					break;
				}
			}
		} else {
			mfp.items = $.isArray(data.items) ? data.items : [data.items];
			mfp.index = data.index || 0;
		}

		// if popup is already opened - we just update the content
		if(mfp.isOpen) {
			mfp.updateItemHTML();
			return;
		}
		
		mfp.types = []; 
		_wrapClasses = '';
		if(data.mainEl && data.mainEl.length) {
			mfp.ev = data.mainEl.eq(0);
		} else {
			mfp.ev = _document;
		}

		if(data.key) {
			if(!mfp.popupsCache[data.key]) {
				mfp.popupsCache[data.key] = {};
			}
			mfp.currTemplate = mfp.popupsCache[data.key];
		} else {
			mfp.currTemplate = {};
		}



		mfp.st = $.extend(true, {}, $.magnificPopup.defaults, data ); 
		mfp.fixedContentPos = mfp.st.fixedContentPos === 'auto' ? !mfp.probablyMobile : mfp.st.fixedContentPos;

		if(mfp.st.modal) {
			mfp.st.closeOnContentClick = false;
			mfp.st.closeOnBgClick = false;
			mfp.st.showCloseBtn = false;
			mfp.st.enableEscapeKey = false;
		}
		

		// Building markup
		// main containers are created only once
		if(!mfp.bgOverlay) {

			// Dark overlay
			mfp.bgOverlay = _getEl('bg').on('click'+EVENT_NS, function() {
				mfp.close();
			});

			mfp.wrap = _getEl('wrap').attr('tabindex', -1).on('click'+EVENT_NS, function(e) {
				if(mfp._checkIfClose(e.target)) {
					mfp.close();
				}
			});

			mfp.container = _getEl('container', mfp.wrap);
		}

		mfp.contentContainer = _getEl('content');
		if(mfp.st.preloader) {
			mfp.preloader = _getEl('preloader', mfp.container, mfp.st.tLoading);
		}


		// Initializing modules
		var modules = $.magnificPopup.modules;
		for(i = 0; i < modules.length; i++) {
			var n = modules[i];
			n = n.charAt(0).toUpperCase() + n.slice(1);
			mfp['init'+n].call(mfp);
		}
		_mfpTrigger('BeforeOpen');


		if(mfp.st.showCloseBtn) {
			// Close button
			if(!mfp.st.closeBtnInside) {
				mfp.wrap.append( _getCloseBtn() );
			} else {
				_mfpOn(MARKUP_PARSE_EVENT, function(e, template, values, item) {
					values.close_replaceWith = _getCloseBtn(item.type);
				});
				_wrapClasses += ' mfp-close-btn-in';
			}
		}

		if(mfp.st.alignTop) {
			_wrapClasses += ' mfp-align-top';
		}

	

		if(mfp.fixedContentPos) {
			mfp.wrap.css({
				overflow: mfp.st.overflowY,
				overflowX: 'hidden',
				overflowY: mfp.st.overflowY
			});
		} else {
			mfp.wrap.css({ 
				top: _window.scrollTop(),
				position: 'absolute'
			});
		}
		if( mfp.st.fixedBgPos === false || (mfp.st.fixedBgPos === 'auto' && !mfp.fixedContentPos) ) {
			mfp.bgOverlay.css({
				height: _document.height(),
				position: 'absolute'
			});
		}

		

		if(mfp.st.enableEscapeKey) {
			// Close on ESC key
			_document.on('keyup' + EVENT_NS, function(e) {
				if(e.keyCode === 27) {
					mfp.close();
				}
			});
		}

		_window.on('resize' + EVENT_NS, function() {
			mfp.updateSize();
		});


		if(!mfp.st.closeOnContentClick) {
			_wrapClasses += ' mfp-auto-cursor';
		}
		
		if(_wrapClasses)
			mfp.wrap.addClass(_wrapClasses);


		// this triggers recalculation of layout, so we get it once to not to trigger twice
		var windowHeight = mfp.wH = _window.height();

		
		var windowStyles = {};

		if( mfp.fixedContentPos ) {
            if(mfp._hasScrollBar(windowHeight)){
                var s = mfp._getScrollbarSize();
                if(s) {
                    windowStyles.marginRight = s;
                }
            }
        }

		if(mfp.fixedContentPos) {
			if(!mfp.isIE7) {
				windowStyles.overflow = 'hidden';
			} else {
				// ie7 double-scroll bug
				$('body, html').css('overflow', 'hidden');
			}
		}

		
		
		var classesToadd = mfp.st.mainClass;
		if(mfp.isIE7) {
			classesToadd += ' mfp-ie7';
		}
		if(classesToadd) {
			mfp._addClassToMFP( classesToadd );
		}

		// add content
		mfp.updateItemHTML();

		_mfpTrigger('BuildControls');

		// remove scrollbar, add margin e.t.c
		$('html').css(windowStyles);
		
		// add everything to DOM
		mfp.bgOverlay.add(mfp.wrap).prependTo( mfp.st.prependTo || $(document.body) );

		// Save last focused element
		mfp._lastFocusedEl = document.activeElement;
		
		// Wait for next cycle to allow CSS transition
		setTimeout(function() {
			
			if(mfp.content) {
				mfp._addClassToMFP(READY_CLASS);
				mfp._setFocus();
			} else {
				// if content is not defined (not loaded e.t.c) we add class only for BG
				mfp.bgOverlay.addClass(READY_CLASS);
			}
			
			// Trap the focus in popup
			_document.on('focusin' + EVENT_NS, mfp._onFocusIn);

		}, 16);

		mfp.isOpen = true;
		mfp.updateSize(windowHeight);
		_mfpTrigger(OPEN_EVENT);

		return data;
	},

	/**
	 * Closes the popup
	 */
	close: function() {
		if(!mfp.isOpen) return;
		_mfpTrigger(BEFORE_CLOSE_EVENT);

		mfp.isOpen = false;
		// for CSS3 animation
		if(mfp.st.removalDelay && !mfp.isLowIE && mfp.supportsTransition )  {
			mfp._addClassToMFP(REMOVING_CLASS);
			setTimeout(function() {
				mfp._close();
			}, mfp.st.removalDelay);
		} else {
			mfp._close();
		}
	},

	/**
	 * Helper for close() function
	 */
	_close: function() {
		_mfpTrigger(CLOSE_EVENT);

		var classesToRemove = REMOVING_CLASS + ' ' + READY_CLASS + ' ';

		mfp.bgOverlay.detach();
		mfp.wrap.detach();
		mfp.container.empty();

		if(mfp.st.mainClass) {
			classesToRemove += mfp.st.mainClass + ' ';
		}

		mfp._removeClassFromMFP(classesToRemove);

		if(mfp.fixedContentPos) {
			var windowStyles = {marginRight: ''};
			if(mfp.isIE7) {
				$('body, html').css('overflow', '');
			} else {
				windowStyles.overflow = '';
			}
			$('html').css(windowStyles);
		}
		
		_document.off('keyup' + EVENT_NS + ' focusin' + EVENT_NS);
		mfp.ev.off(EVENT_NS);

		// clean up DOM elements that aren't removed
		mfp.wrap.attr('class', 'mfp-wrap').removeAttr('style');
		mfp.bgOverlay.attr('class', 'mfp-bg');
		mfp.container.attr('class', 'mfp-container');

		// remove close button from target element
		if(mfp.st.showCloseBtn &&
		(!mfp.st.closeBtnInside || mfp.currTemplate[mfp.currItem.type] === true)) {
			if(mfp.currTemplate.closeBtn)
				mfp.currTemplate.closeBtn.detach();
		}


		if(mfp.st.autoFocusLast && mfp._lastFocusedEl) {
			$(mfp._lastFocusedEl).focus(); // put tab focus back
		}
		mfp.currItem = null;	
		mfp.content = null;
		mfp.currTemplate = null;
		mfp.prevHeight = 0;

		_mfpTrigger(AFTER_CLOSE_EVENT);
	},
	
	updateSize: function(winHeight) {

		if(mfp.isIOS) {
			// fixes iOS nav bars https://github.com/dimsemenov/Magnific-Popup/issues/2
			var zoomLevel = document.documentElement.clientWidth / window.innerWidth;
			var height = window.innerHeight * zoomLevel;
			mfp.wrap.css('height', height);
			mfp.wH = height;
		} else {
			mfp.wH = winHeight || _window.height();
		}
		// Fixes #84: popup incorrectly positioned with position:relative on body
		if(!mfp.fixedContentPos) {
			mfp.wrap.css('height', mfp.wH);
		}

		_mfpTrigger('Resize');

	},

	/**
	 * Set content of popup based on current index
	 */
	updateItemHTML: function() {
		var item = mfp.items[mfp.index];

		// Detach and perform modifications
		mfp.contentContainer.detach();

		if(mfp.content)
			mfp.content.detach();

		if(!item.parsed) {
			item = mfp.parseEl( mfp.index );
		}

		var type = item.type;

		_mfpTrigger('BeforeChange', [mfp.currItem ? mfp.currItem.type : '', type]);
		// BeforeChange event works like so:
		// _mfpOn('BeforeChange', function(e, prevType, newType) { });

		mfp.currItem = item;

		if(!mfp.currTemplate[type]) {
			var markup = mfp.st[type] ? mfp.st[type].markup : false;

			// allows to modify markup
			_mfpTrigger('FirstMarkupParse', markup);

			if(markup) {
				mfp.currTemplate[type] = $(markup);
			} else {
				// if there is no markup found we just define that template is parsed
				mfp.currTemplate[type] = true;
			}
		}

		if(_prevContentType && _prevContentType !== item.type) {
			mfp.container.removeClass('mfp-'+_prevContentType+'-holder');
		}

		var newContent = mfp['get' + type.charAt(0).toUpperCase() + type.slice(1)](item, mfp.currTemplate[type]);
		mfp.appendContent(newContent, type);

		item.preloaded = true;

		_mfpTrigger(CHANGE_EVENT, item);
		_prevContentType = item.type;

		// Append container back after its content changed
		mfp.container.prepend(mfp.contentContainer);

		_mfpTrigger('AfterChange');
	},


	/**
	 * Set HTML content of popup
	 */
	appendContent: function(newContent, type) {
		mfp.content = newContent;

		if(newContent) {
			if(mfp.st.showCloseBtn && mfp.st.closeBtnInside &&
				mfp.currTemplate[type] === true) {
				// if there is no markup, we just append close button element inside
				if(!mfp.content.find('.mfp-close').length) {
					mfp.content.append(_getCloseBtn());
				}
			} else {
				mfp.content = newContent;
			}
		} else {
			mfp.content = '';
		}

		_mfpTrigger(BEFORE_APPEND_EVENT);
		mfp.container.addClass('mfp-'+type+'-holder');

		mfp.contentContainer.append(mfp.content);
	},


	/**
	 * Creates Magnific Popup data object based on given data
	 * @param  {int} index Index of item to parse
	 */
	parseEl: function(index) {
		var item = mfp.items[index],
			type;

		if(item.tagName) {
			item = { el: $(item) };
		} else {
			type = item.type;
			item = { data: item, src: item.src };
		}

		if(item.el) {
			var types = mfp.types;

			// check for 'mfp-TYPE' class
			for(var i = 0; i < types.length; i++) {
				if( item.el.hasClass('mfp-'+types[i]) ) {
					type = types[i];
					break;
				}
			}

			item.src = item.el.attr('data-mfp-src');
			if(!item.src) {
				item.src = item.el.attr('href');
			}
		}

		item.type = type || mfp.st.type || 'inline';
		item.index = index;
		item.parsed = true;
		mfp.items[index] = item;
		_mfpTrigger('ElementParse', item);

		return mfp.items[index];
	},


	/**
	 * Initializes single popup or a group of popups
	 */
	addGroup: function(el, options) {
		var eHandler = function(e) {
			e.mfpEl = this;
			mfp._openClick(e, el, options);
		};

		if(!options) {
			options = {};
		}

		var eName = 'click.magnificPopup';
		options.mainEl = el;

		if(options.items) {
			options.isObj = true;
			el.off(eName).on(eName, eHandler);
		} else {
			options.isObj = false;
			if(options.delegate) {
				el.off(eName).on(eName, options.delegate , eHandler);
			} else {
				options.items = el;
				el.off(eName).on(eName, eHandler);
			}
		}
	},
	_openClick: function(e, el, options) {
		var midClick = options.midClick !== undefined ? options.midClick : $.magnificPopup.defaults.midClick;


		if(!midClick && ( e.which === 2 || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey ) ) {
			return;
		}

		var disableOn = options.disableOn !== undefined ? options.disableOn : $.magnificPopup.defaults.disableOn;

		if(disableOn) {
			if($.isFunction(disableOn)) {
				if( !disableOn.call(mfp) ) {
					return true;
				}
			} else { // else it's number
				if( _window.width() < disableOn ) {
					return true;
				}
			}
		}

		if(e.type) {
			e.preventDefault();

			// This will prevent popup from closing if element is inside and popup is already opened
			if(mfp.isOpen) {
				e.stopPropagation();
			}
		}

		options.el = $(e.mfpEl);
		if(options.delegate) {
			options.items = el.find(options.delegate);
		}
		mfp.open(options);
	},


	/**
	 * Updates text on preloader
	 */
	updateStatus: function(status, text) {

		if(mfp.preloader) {
			if(_prevStatus !== status) {
				mfp.container.removeClass('mfp-s-'+_prevStatus);
			}

			if(!text && status === 'loading') {
				text = mfp.st.tLoading;
			}

			var data = {
				status: status,
				text: text
			};
			// allows to modify status
			_mfpTrigger('UpdateStatus', data);

			status = data.status;
			text = data.text;

			mfp.preloader.html(text);

			mfp.preloader.find('a').on('click', function(e) {
				e.stopImmediatePropagation();
			});

			mfp.container.addClass('mfp-s-'+status);
			_prevStatus = status;
		}
	},


	/*
		"Private" helpers that aren't private at all
	 */
	// Check to close popup or not
	// "target" is an element that was clicked
	_checkIfClose: function(target) {

		if($(target).hasClass(PREVENT_CLOSE_CLASS)) {
			return;
		}

		var closeOnContent = mfp.st.closeOnContentClick;
		var closeOnBg = mfp.st.closeOnBgClick;

		if(closeOnContent && closeOnBg) {
			return true;
		} else {

			// We close the popup if click is on close button or on preloader. Or if there is no content.
			if(!mfp.content || $(target).hasClass('mfp-close') || (mfp.preloader && target === mfp.preloader[0]) ) {
				return true;
			}

			// if click is outside the content
			if(  (target !== mfp.content[0] && !$.contains(mfp.content[0], target))  ) {
				if(closeOnBg) {
					// last check, if the clicked element is in DOM, (in case it's removed onclick)
					if( $.contains(document, target) ) {
						return true;
					}
				}
			} else if(closeOnContent) {
				return true;
			}

		}
		return false;
	},
	_addClassToMFP: function(cName) {
		mfp.bgOverlay.addClass(cName);
		mfp.wrap.addClass(cName);
	},
	_removeClassFromMFP: function(cName) {
		this.bgOverlay.removeClass(cName);
		mfp.wrap.removeClass(cName);
	},
	_hasScrollBar: function(winHeight) {
		return (  (mfp.isIE7 ? _document.height() : document.body.scrollHeight) > (winHeight || _window.height()) );
	},
	_setFocus: function() {
		(mfp.st.focus ? mfp.content.find(mfp.st.focus).eq(0) : mfp.wrap).focus();
	},
	_onFocusIn: function(e) {
		if( e.target !== mfp.wrap[0] && !$.contains(mfp.wrap[0], e.target) ) {
			mfp._setFocus();
			return false;
		}
	},
	_parseMarkup: function(template, values, item) {
		var arr;
		if(item.data) {
			values = $.extend(item.data, values);
		}
		_mfpTrigger(MARKUP_PARSE_EVENT, [template, values, item] );

		$.each(values, function(key, value) {
			if(value === undefined || value === false) {
				return true;
			}
			arr = key.split('_');
			if(arr.length > 1) {
				var el = template.find(EVENT_NS + '-'+arr[0]);

				if(el.length > 0) {
					var attr = arr[1];
					if(attr === 'replaceWith') {
						if(el[0] !== value[0]) {
							el.replaceWith(value);
						}
					} else if(attr === 'img') {
						if(el.is('img')) {
							el.attr('src', value);
						} else {
							el.replaceWith( $('<img>').attr('src', value).attr('class', el.attr('class')) );
						}
					} else {
						el.attr(arr[1], value);
					}
				}

			} else {
				template.find(EVENT_NS + '-'+key).html(value);
			}
		});
	},

	_getScrollbarSize: function() {
		// thx David
		if(mfp.scrollbarSize === undefined) {
			var scrollDiv = document.createElement("div");
			scrollDiv.style.cssText = 'width: 99px; height: 99px; overflow: scroll; position: absolute; top: -9999px;';
			document.body.appendChild(scrollDiv);
			mfp.scrollbarSize = scrollDiv.offsetWidth - scrollDiv.clientWidth;
			document.body.removeChild(scrollDiv);
		}
		return mfp.scrollbarSize;
	}

}; /* MagnificPopup core prototype end */




/**
 * Public static functions
 */
$.magnificPopup = {
	instance: null,
	proto: MagnificPopup.prototype,
	modules: [],

	open: function(options, index) {
		_checkInstance();

		if(!options) {
			options = {};
		} else {
			options = $.extend(true, {}, options);
		}

		options.isObj = true;
		options.index = index || 0;
		return this.instance.open(options);
	},

	close: function() {
		return $.magnificPopup.instance && $.magnificPopup.instance.close();
	},

	registerModule: function(name, module) {
		if(module.options) {
			$.magnificPopup.defaults[name] = module.options;
		}
		$.extend(this.proto, module.proto);
		this.modules.push(name);
	},

	defaults: {

		// Info about options is in docs:
		// http://dimsemenov.com/plugins/magnific-popup/documentation.html#options

		disableOn: 0,

		key: null,

		midClick: false,

		mainClass: '',

		preloader: true,

		focus: '', // CSS selector of input to focus after popup is opened

		closeOnContentClick: false,

		closeOnBgClick: true,

		closeBtnInside: true,

		showCloseBtn: true,

		enableEscapeKey: true,

		modal: false,

		alignTop: false,

		removalDelay: 0,

		prependTo: null,

		fixedContentPos: 'auto',

		fixedBgPos: 'auto',

		overflowY: 'auto',

		closeMarkup: '<button title="%title%" type="button" class="mfp-close">&#215;</button>',

		tClose: 'Close (Esc)',

		tLoading: 'Loading...',

		autoFocusLast: true

	}
};



$.fn.magnificPopup = function(options) {
	_checkInstance();

	var jqEl = $(this);

	// We call some API method of first param is a string
	if (typeof options === "string" ) {

		if(options === 'open') {
			var items,
				itemOpts = _isJQ ? jqEl.data('magnificPopup') : jqEl[0].magnificPopup,
				index = parseInt(arguments[1], 10) || 0;

			if(itemOpts.items) {
				items = itemOpts.items[index];
			} else {
				items = jqEl;
				if(itemOpts.delegate) {
					items = items.find(itemOpts.delegate);
				}
				items = items.eq( index );
			}
			mfp._openClick({mfpEl:items}, jqEl, itemOpts);
		} else {
			if(mfp.isOpen)
				mfp[options].apply(mfp, Array.prototype.slice.call(arguments, 1));
		}

	} else {
		// clone options obj
		options = $.extend(true, {}, options);

		/*
		 * As Zepto doesn't support .data() method for objects
		 * and it works only in normal browsers
		 * we assign "options" object directly to the DOM element. FTW!
		 */
		if(_isJQ) {
			jqEl.data('magnificPopup', options);
		} else {
			jqEl[0].magnificPopup = options;
		}

		mfp.addGroup(jqEl, options);

	}
	return jqEl;
};

/*>>core*/

/*>>inline*/

var INLINE_NS = 'inline',
	_hiddenClass,
	_inlinePlaceholder,
	_lastInlineElement,
	_putInlineElementsBack = function() {
		if(_lastInlineElement) {
			_inlinePlaceholder.after( _lastInlineElement.addClass(_hiddenClass) ).detach();
			_lastInlineElement = null;
		}
	};

$.magnificPopup.registerModule(INLINE_NS, {
	options: {
		hiddenClass: 'hide', // will be appended with `mfp-` prefix
		markup: '',
		tNotFound: 'Content not found'
	},
	proto: {

		initInline: function() {
			mfp.types.push(INLINE_NS);

			_mfpOn(CLOSE_EVENT+'.'+INLINE_NS, function() {
				_putInlineElementsBack();
			});
		},

		getInline: function(item, template) {

			_putInlineElementsBack();

			if(item.src) {
				var inlineSt = mfp.st.inline,
					el = $(item.src);

				if(el.length) {

					// If target element has parent - we replace it with placeholder and put it back after popup is closed
					var parent = el[0].parentNode;
					if(parent && parent.tagName) {
						if(!_inlinePlaceholder) {
							_hiddenClass = inlineSt.hiddenClass;
							_inlinePlaceholder = _getEl(_hiddenClass);
							_hiddenClass = 'mfp-'+_hiddenClass;
						}
						// replace target inline element with placeholder
						_lastInlineElement = el.after(_inlinePlaceholder).detach().removeClass(_hiddenClass);
					}

					mfp.updateStatus('ready');
				} else {
					mfp.updateStatus('error', inlineSt.tNotFound);
					el = $('<div>');
				}

				item.inlineElement = el;
				return el;
			}

			mfp.updateStatus('ready');
			mfp._parseMarkup(template, {}, item);
			return template;
		}
	}
});

/*>>inline*/

/*>>ajax*/
var AJAX_NS = 'ajax',
	_ajaxCur,
	_removeAjaxCursor = function() {
		if(_ajaxCur) {
			$(document.body).removeClass(_ajaxCur);
		}
	},
	_destroyAjaxRequest = function() {
		_removeAjaxCursor();
		if(mfp.req) {
			mfp.req.abort();
		}
	};

$.magnificPopup.registerModule(AJAX_NS, {

	options: {
		settings: null,
		cursor: 'mfp-ajax-cur',
		tError: '<a href="%url%">The content</a> could not be loaded.'
	},

	proto: {
		initAjax: function() {
			mfp.types.push(AJAX_NS);
			_ajaxCur = mfp.st.ajax.cursor;

			_mfpOn(CLOSE_EVENT+'.'+AJAX_NS, _destroyAjaxRequest);
			_mfpOn('BeforeChange.' + AJAX_NS, _destroyAjaxRequest);
		},
		getAjax: function(item) {

			if(_ajaxCur) {
				$(document.body).addClass(_ajaxCur);
			}

			mfp.updateStatus('loading');

			var opts = $.extend({
				url: item.src,
				success: function(data, textStatus, jqXHR) {
					var temp = {
						data:data,
						xhr:jqXHR
					};

					_mfpTrigger('ParseAjax', temp);

					mfp.appendContent( $(temp.data), AJAX_NS );

					item.finished = true;

					_removeAjaxCursor();

					mfp._setFocus();

					setTimeout(function() {
						mfp.wrap.addClass(READY_CLASS);
					}, 16);

					mfp.updateStatus('ready');

					_mfpTrigger('AjaxContentAdded');
				},
				error: function() {
					_removeAjaxCursor();
					item.finished = item.loadError = true;
					mfp.updateStatus('error', mfp.st.ajax.tError.replace('%url%', item.src));
				}
			}, mfp.st.ajax.settings);

			mfp.req = $.ajax(opts);

			return '';
		}
	}
});

/*>>ajax*/

/*>>image*/
var _imgInterval,
	_getTitle = function(item) {
		if(item.data && item.data.title !== undefined)
			return item.data.title;

		var src = mfp.st.image.titleSrc;

		if(src) {
			if($.isFunction(src)) {
				return src.call(mfp, item);
			} else if(item.el) {
				return item.el.attr(src) || '';
			}
		}
		return '';
	};

$.magnificPopup.registerModule('image', {

	options: {
		markup: '<div class="mfp-figure">'+
					'<div class="mfp-close"></div>'+
					'<figure>'+
						'<div class="mfp-img"></div>'+
						'<figcaption>'+
							'<div class="mfp-bottom-bar">'+
								'<div class="mfp-title"></div>'+
								'<div class="mfp-counter"></div>'+
							'</div>'+
						'</figcaption>'+
					'</figure>'+
				'</div>',
		cursor: 'mfp-zoom-out-cur',
		titleSrc: 'title',
		verticalFit: true,
		tError: '<a href="%url%">The image</a> could not be loaded.'
	},

	proto: {
		initImage: function() {
			var imgSt = mfp.st.image,
				ns = '.image';

			mfp.types.push('image');

			_mfpOn(OPEN_EVENT+ns, function() {
				if(mfp.currItem.type === 'image' && imgSt.cursor) {
					$(document.body).addClass(imgSt.cursor);
				}
			});

			_mfpOn(CLOSE_EVENT+ns, function() {
				if(imgSt.cursor) {
					$(document.body).removeClass(imgSt.cursor);
				}
				_window.off('resize' + EVENT_NS);
			});

			_mfpOn('Resize'+ns, mfp.resizeImage);
			if(mfp.isLowIE) {
				_mfpOn('AfterChange', mfp.resizeImage);
			}
		},
		resizeImage: function() {
			var item = mfp.currItem;
			if(!item || !item.img) return;

			if(mfp.st.image.verticalFit) {
				var decr = 0;
				// fix box-sizing in ie7/8
				if(mfp.isLowIE) {
					decr = parseInt(item.img.css('padding-top'), 10) + parseInt(item.img.css('padding-bottom'),10);
				}
				item.img.css('max-height', mfp.wH-decr);
			}
		},
		_onImageHasSize: function(item) {
			if(item.img) {

				item.hasSize = true;

				if(_imgInterval) {
					clearInterval(_imgInterval);
				}

				item.isCheckingImgSize = false;

				_mfpTrigger('ImageHasSize', item);

				if(item.imgHidden) {
					if(mfp.content)
						mfp.content.removeClass('mfp-loading');

					item.imgHidden = false;
				}

			}
		},

		/**
		 * Function that loops until the image has size to display elements that rely on it asap
		 */
		findImageSize: function(item) {

			var counter = 0,
				img = item.img[0],
				mfpSetInterval = function(delay) {

					if(_imgInterval) {
						clearInterval(_imgInterval);
					}
					// decelerating interval that checks for size of an image
					_imgInterval = setInterval(function() {
						if(img.naturalWidth > 0) {
							mfp._onImageHasSize(item);
							return;
						}

						if(counter > 200) {
							clearInterval(_imgInterval);
						}

						counter++;
						if(counter === 3) {
							mfpSetInterval(10);
						} else if(counter === 40) {
							mfpSetInterval(50);
						} else if(counter === 100) {
							mfpSetInterval(500);
						}
					}, delay);
				};

			mfpSetInterval(1);
		},

		getImage: function(item, template) {

			var guard = 0,

				// image load complete handler
				onLoadComplete = function() {
					if(item) {
						if (item.img[0].complete) {
							item.img.off('.mfploader');

							if(item === mfp.currItem){
								mfp._onImageHasSize(item);

								mfp.updateStatus('ready');
							}

							item.hasSize = true;
							item.loaded = true;

							_mfpTrigger('ImageLoadComplete');

						}
						else {
							// if image complete check fails 200 times (20 sec), we assume that there was an error.
							guard++;
							if(guard < 200) {
								setTimeout(onLoadComplete,100);
							} else {
								onLoadError();
							}
						}
					}
				},

				// image error handler
				onLoadError = function() {
					if(item) {
						item.img.off('.mfploader');
						if(item === mfp.currItem){
							mfp._onImageHasSize(item);
							mfp.updateStatus('error', imgSt.tError.replace('%url%', item.src) );
						}

						item.hasSize = true;
						item.loaded = true;
						item.loadError = true;
					}
				},
				imgSt = mfp.st.image;


			var el = template.find('.mfp-img');
			if(el.length) {
				var img = document.createElement('img');
				img.className = 'mfp-img';
				if(item.el && item.el.find('img').length) {
					img.alt = item.el.find('img').attr('alt');
				}
				item.img = $(img).on('load.mfploader', onLoadComplete).on('error.mfploader', onLoadError);
				img.src = item.src;

				// without clone() "error" event is not firing when IMG is replaced by new IMG
				// TODO: find a way to avoid such cloning
				if(el.is('img')) {
					item.img = item.img.clone();
				}

				img = item.img[0];
				if(img.naturalWidth > 0) {
					item.hasSize = true;
				} else if(!img.width) {
					item.hasSize = false;
				}
			}

			mfp._parseMarkup(template, {
				title: _getTitle(item),
				img_replaceWith: item.img
			}, item);

			mfp.resizeImage();

			if(item.hasSize) {
				if(_imgInterval) clearInterval(_imgInterval);

				if(item.loadError) {
					template.addClass('mfp-loading');
					mfp.updateStatus('error', imgSt.tError.replace('%url%', item.src) );
				} else {
					template.removeClass('mfp-loading');
					mfp.updateStatus('ready');
				}
				return template;
			}

			mfp.updateStatus('loading');
			item.loading = true;

			if(!item.hasSize) {
				item.imgHidden = true;
				template.addClass('mfp-loading');
				mfp.findImageSize(item);
			}

			return template;
		}
	}
});

/*>>image*/

/*>>zoom*/
var hasMozTransform,
	getHasMozTransform = function() {
		if(hasMozTransform === undefined) {
			hasMozTransform = document.createElement('p').style.MozTransform !== undefined;
		}
		return hasMozTransform;
	};

$.magnificPopup.registerModule('zoom', {

	options: {
		enabled: false,
		easing: 'ease-in-out',
		duration: 300,
		opener: function(element) {
			return element.is('img') ? element : element.find('img');
		}
	},

	proto: {

		initZoom: function() {
			var zoomSt = mfp.st.zoom,
				ns = '.zoom',
				image;

			if(!zoomSt.enabled || !mfp.supportsTransition) {
				return;
			}

			var duration = zoomSt.duration,
				getElToAnimate = function(image) {
					var newImg = image.clone().removeAttr('style').removeAttr('class').addClass('mfp-animated-image'),
						transition = 'all '+(zoomSt.duration/1000)+'s ' + zoomSt.easing,
						cssObj = {
							position: 'fixed',
							zIndex: 9999,
							left: 0,
							top: 0,
							'-webkit-backface-visibility': 'hidden'
						},
						t = 'transition';

					cssObj['-webkit-'+t] = cssObj['-moz-'+t] = cssObj['-o-'+t] = cssObj[t] = transition;

					newImg.css(cssObj);
					return newImg;
				},
				showMainContent = function() {
					mfp.content.css('visibility', 'visible');
				},
				openTimeout,
				animatedImg;

			_mfpOn('BuildControls'+ns, function() {
				if(mfp._allowZoom()) {

					clearTimeout(openTimeout);
					mfp.content.css('visibility', 'hidden');

					// Basically, all code below does is clones existing image, puts in on top of the current one and animated it

					image = mfp._getItemToZoom();

					if(!image) {
						showMainContent();
						return;
					}

					animatedImg = getElToAnimate(image);

					animatedImg.css( mfp._getOffset() );

					mfp.wrap.append(animatedImg);

					openTimeout = setTimeout(function() {
						animatedImg.css( mfp._getOffset( true ) );
						openTimeout = setTimeout(function() {

							showMainContent();

							setTimeout(function() {
								animatedImg.remove();
								image = animatedImg = null;
								_mfpTrigger('ZoomAnimationEnded');
							}, 16); // avoid blink when switching images

						}, duration); // this timeout equals animation duration

					}, 16); // by adding this timeout we avoid short glitch at the beginning of animation


					// Lots of timeouts...
				}
			});
			_mfpOn(BEFORE_CLOSE_EVENT+ns, function() {
				if(mfp._allowZoom()) {

					clearTimeout(openTimeout);

					mfp.st.removalDelay = duration;

					if(!image) {
						image = mfp._getItemToZoom();
						if(!image) {
							return;
						}
						animatedImg = getElToAnimate(image);
					}

					animatedImg.css( mfp._getOffset(true) );
					mfp.wrap.append(animatedImg);
					mfp.content.css('visibility', 'hidden');

					setTimeout(function() {
						animatedImg.css( mfp._getOffset() );
					}, 16);
				}

			});

			_mfpOn(CLOSE_EVENT+ns, function() {
				if(mfp._allowZoom()) {
					showMainContent();
					if(animatedImg) {
						animatedImg.remove();
					}
					image = null;
				}
			});
		},

		_allowZoom: function() {
			return mfp.currItem.type === 'image';
		},

		_getItemToZoom: function() {
			if(mfp.currItem.hasSize) {
				return mfp.currItem.img;
			} else {
				return false;
			}
		},

		// Get element postion relative to viewport
		_getOffset: function(isLarge) {
			var el;
			if(isLarge) {
				el = mfp.currItem.img;
			} else {
				el = mfp.st.zoom.opener(mfp.currItem.el || mfp.currItem);
			}

			var offset = el.offset();
			var paddingTop = parseInt(el.css('padding-top'),10);
			var paddingBottom = parseInt(el.css('padding-bottom'),10);
			offset.top -= ( $(window).scrollTop() - paddingTop );


			/*

			Animating left + top + width/height looks glitchy in Firefox, but perfect in Chrome. And vice-versa.

			 */
			var obj = {
				width: el.width(),
				// fix Zepto height+padding issue
				height: (_isJQ ? el.innerHeight() : el[0].offsetHeight) - paddingBottom - paddingTop
			};

			// I hate to do this, but there is no another option
			if( getHasMozTransform() ) {
				obj['-moz-transform'] = obj['transform'] = 'translate(' + offset.left + 'px,' + offset.top + 'px)';
			} else {
				obj.left = offset.left;
				obj.top = offset.top;
			}
			return obj;
		}

	}
});



/*>>zoom*/

/*>>iframe*/

var IFRAME_NS = 'iframe',
	_emptyPage = '//about:blank',

	_fixIframeBugs = function(isShowing) {
		if(mfp.currTemplate[IFRAME_NS]) {
			var el = mfp.currTemplate[IFRAME_NS].find('iframe');
			if(el.length) {
				// reset src after the popup is closed to avoid "video keeps playing after popup is closed" bug
				if(!isShowing) {
					el[0].src = _emptyPage;
				}

				// IE8 black screen bug fix
				if(mfp.isIE8) {
					el.css('display', isShowing ? 'block' : 'none');
				}
			}
		}
	};

$.magnificPopup.registerModule(IFRAME_NS, {

	options: {
		markup: '<div class="mfp-iframe-scaler">'+
					'<div class="mfp-close"></div>'+
					'<iframe class="mfp-iframe" src="//about:blank" frameborder="0" allowfullscreen></iframe>'+
				'</div>',

		srcAction: 'iframe_src',

		// we don't care and support only one default type of URL by default
		patterns: {
			youtube: {
				index: 'youtube.com',
				id: 'v=',
				src: '//www.youtube.com/embed/%id%?autoplay=1'
			},
			vimeo: {
				index: 'vimeo.com/',
				id: '/',
				src: '//player.vimeo.com/video/%id%?autoplay=1'
			},
			gmaps: {
				index: '//maps.google.',
				src: '%id%&output=embed'
			}
		}
	},

	proto: {
		initIframe: function() {
			mfp.types.push(IFRAME_NS);

			_mfpOn('BeforeChange', function(e, prevType, newType) {
				if(prevType !== newType) {
					if(prevType === IFRAME_NS) {
						_fixIframeBugs(); // iframe if removed
					} else if(newType === IFRAME_NS) {
						_fixIframeBugs(true); // iframe is showing
					}
				}// else {
					// iframe source is switched, don't do anything
				//}
			});

			_mfpOn(CLOSE_EVENT + '.' + IFRAME_NS, function() {
				_fixIframeBugs();
			});
		},

		getIframe: function(item, template) {
			var embedSrc = item.src;
			var iframeSt = mfp.st.iframe;

			$.each(iframeSt.patterns, function() {
				if(embedSrc.indexOf( this.index ) > -1) {
					if(this.id) {
						if(typeof this.id === 'string') {
							embedSrc = embedSrc.substr(embedSrc.lastIndexOf(this.id)+this.id.length, embedSrc.length);
						} else {
							embedSrc = this.id.call( this, embedSrc );
						}
					}
					embedSrc = this.src.replace('%id%', embedSrc );
					return false; // break;
				}
			});

			var dataObj = {};
			if(iframeSt.srcAction) {
				dataObj[iframeSt.srcAction] = embedSrc;
			}
			mfp._parseMarkup(template, dataObj, item);

			mfp.updateStatus('ready');

			return template;
		}
	}
});



/*>>iframe*/

/*>>gallery*/
/**
 * Get looped index depending on number of slides
 */
var _getLoopedId = function(index) {
		var numSlides = mfp.items.length;
		if(index > numSlides - 1) {
			return index - numSlides;
		} else  if(index < 0) {
			return numSlides + index;
		}
		return index;
	},
	_replaceCurrTotal = function(text, curr, total) {
		return text.replace(/%curr%/gi, curr + 1).replace(/%total%/gi, total);
	};

$.magnificPopup.registerModule('gallery', {

	options: {
		enabled: false,
		arrowMarkup: '<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>',
		preload: [0,2],
		navigateByImgClick: true,
		arrows: true,

		tPrev: 'Previous (Left arrow key)',
		tNext: 'Next (Right arrow key)',
		tCounter: '%curr% of %total%'
	},

	proto: {
		initGallery: function() {

			var gSt = mfp.st.gallery,
				ns = '.mfp-gallery';

			mfp.direction = true; // true - next, false - prev

			if(!gSt || !gSt.enabled ) return false;

			_wrapClasses += ' mfp-gallery';

			_mfpOn(OPEN_EVENT+ns, function() {

				if(gSt.navigateByImgClick) {
					mfp.wrap.on('click'+ns, '.mfp-img', function() {
						if(mfp.items.length > 1) {
							mfp.next();
							return false;
						}
					});
				}

				_document.on('keydown'+ns, function(e) {
					if (e.keyCode === 37) {
						mfp.prev();
					} else if (e.keyCode === 39) {
						mfp.next();
					}
				});
			});

			_mfpOn('UpdateStatus'+ns, function(e, data) {
				if(data.text) {
					data.text = _replaceCurrTotal(data.text, mfp.currItem.index, mfp.items.length);
				}
			});

			_mfpOn(MARKUP_PARSE_EVENT+ns, function(e, element, values, item) {
				var l = mfp.items.length;
				values.counter = l > 1 ? _replaceCurrTotal(gSt.tCounter, item.index, l) : '';
			});

			_mfpOn('BuildControls' + ns, function() {
				if(mfp.items.length > 1 && gSt.arrows && !mfp.arrowLeft) {
					var markup = gSt.arrowMarkup,
						arrowLeft = mfp.arrowLeft = $( markup.replace(/%title%/gi, gSt.tPrev).replace(/%dir%/gi, 'left') ).addClass(PREVENT_CLOSE_CLASS),
						arrowRight = mfp.arrowRight = $( markup.replace(/%title%/gi, gSt.tNext).replace(/%dir%/gi, 'right') ).addClass(PREVENT_CLOSE_CLASS);

					arrowLeft.click(function() {
						mfp.prev();
					});
					arrowRight.click(function() {
						mfp.next();
					});

					mfp.container.append(arrowLeft.add(arrowRight));
				}
			});

			_mfpOn(CHANGE_EVENT+ns, function() {
				if(mfp._preloadTimeout) clearTimeout(mfp._preloadTimeout);

				mfp._preloadTimeout = setTimeout(function() {
					mfp.preloadNearbyImages();
					mfp._preloadTimeout = null;
				}, 16);
			});


			_mfpOn(CLOSE_EVENT+ns, function() {
				_document.off(ns);
				mfp.wrap.off('click'+ns);
				mfp.arrowRight = mfp.arrowLeft = null;
			});

		},
		next: function() {
			mfp.direction = true;
			mfp.index = _getLoopedId(mfp.index + 1);
			mfp.updateItemHTML();
		},
		prev: function() {
			mfp.direction = false;
			mfp.index = _getLoopedId(mfp.index - 1);
			mfp.updateItemHTML();
		},
		goTo: function(newIndex) {
			mfp.direction = (newIndex >= mfp.index);
			mfp.index = newIndex;
			mfp.updateItemHTML();
		},
		preloadNearbyImages: function() {
			var p = mfp.st.gallery.preload,
				preloadBefore = Math.min(p[0], mfp.items.length),
				preloadAfter = Math.min(p[1], mfp.items.length),
				i;

			for(i = 1; i <= (mfp.direction ? preloadAfter : preloadBefore); i++) {
				mfp._preloadItem(mfp.index+i);
			}
			for(i = 1; i <= (mfp.direction ? preloadBefore : preloadAfter); i++) {
				mfp._preloadItem(mfp.index-i);
			}
		},
		_preloadItem: function(index) {
			index = _getLoopedId(index);

			if(mfp.items[index].preloaded) {
				return;
			}

			var item = mfp.items[index];
			if(!item.parsed) {
				item = mfp.parseEl( index );
			}

			_mfpTrigger('LazyLoad', item);

			if(item.type === 'image') {
				item.img = $('<img class="mfp-img" />').on('load.mfploader', function() {
					item.hasSize = true;
				}).on('error.mfploader', function() {
					item.hasSize = true;
					item.loadError = true;
					_mfpTrigger('LazyLoadError', item);
				}).attr('src', item.src);
			}


			item.preloaded = true;
		}
	}
});

/*>>gallery*/

/*>>retina*/

var RETINA_NS = 'retina';

$.magnificPopup.registerModule(RETINA_NS, {
	options: {
		replaceSrc: function(item) {
			return item.src.replace(/\.\w+$/, function(m) { return '@2x' + m; });
		},
		ratio: 1 // Function or number.  Set to 1 to disable.
	},
	proto: {
		initRetina: function() {
			if(window.devicePixelRatio > 1) {

				var st = mfp.st.retina,
					ratio = st.ratio;

				ratio = !isNaN(ratio) ? ratio : ratio();

				if(ratio > 1) {
					_mfpOn('ImageHasSize' + '.' + RETINA_NS, function(e, item) {
						item.img.css({
							'max-width': item.img[0].naturalWidth / ratio,
							'width': '100%'
						});
					});
					_mfpOn('ElementParse' + '.' + RETINA_NS, function(e, item) {
						item.src = st.replaceSrc(item, ratio);
					});
				}
			}

		}
	}
});

/*>>retina*/
 _checkInstance(); }));
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJsaWJzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIVxyXG4gKiBqUXVlcnkgTWlncmF0ZSAtIHYzLjAuMCAtIDIwMTYtMDYtMDlcclxuICogQ29weXJpZ2h0IGpRdWVyeSBGb3VuZGF0aW9uIGFuZCBvdGhlciBjb250cmlidXRvcnNcclxuICovXHJcbihmdW5jdGlvbiggalF1ZXJ5LCB3aW5kb3cgKSB7XHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbmpRdWVyeS5taWdyYXRlVmVyc2lvbiA9IFwiMy4wLjBcIjtcclxuXHJcblxyXG4oIGZ1bmN0aW9uKCkge1xyXG5cclxuXHQvLyBTdXBwb3J0OiBJRTkgb25seVxyXG5cdC8vIElFOSBvbmx5IGNyZWF0ZXMgY29uc29sZSBvYmplY3Qgd2hlbiBkZXYgdG9vbHMgYXJlIGZpcnN0IG9wZW5lZFxyXG5cdC8vIEFsc28sIGF2b2lkIEZ1bmN0aW9uI2JpbmQgaGVyZSB0byBzaW1wbGlmeSBQaGFudG9tSlMgdXNhZ2VcclxuXHR2YXIgbG9nID0gd2luZG93LmNvbnNvbGUgJiYgd2luZG93LmNvbnNvbGUubG9nICYmXHJcblx0XHRcdGZ1bmN0aW9uKCkgeyB3aW5kb3cuY29uc29sZS5sb2cuYXBwbHkoIHdpbmRvdy5jb25zb2xlLCBhcmd1bWVudHMgKTsgfSxcclxuXHRcdHJiYWRWZXJzaW9ucyA9IC9eWzEyXVxcLi87XHJcblxyXG5cdGlmICggIWxvZyApIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblxyXG5cdC8vIE5lZWQgalF1ZXJ5IDMuMC4wKyBhbmQgbm8gb2xkZXIgTWlncmF0ZSBsb2FkZWRcclxuXHRpZiAoICFqUXVlcnkgfHwgcmJhZFZlcnNpb25zLnRlc3QoIGpRdWVyeS5mbi5qcXVlcnkgKSApIHtcclxuXHRcdGxvZyggXCJKUU1JR1JBVEU6IGpRdWVyeSAzLjAuMCsgUkVRVUlSRURcIiApO1xyXG5cdH1cclxuXHRpZiAoIGpRdWVyeS5taWdyYXRlV2FybmluZ3MgKSB7XHJcblx0XHRsb2coIFwiSlFNSUdSQVRFOiBNaWdyYXRlIHBsdWdpbiBsb2FkZWQgbXVsdGlwbGUgdGltZXNcIiApO1xyXG5cdH1cclxuXHJcblx0Ly8gU2hvdyBhIG1lc3NhZ2Ugb24gdGhlIGNvbnNvbGUgc28gZGV2cyBrbm93IHdlJ3JlIGFjdGl2ZVxyXG5cdGxvZyggXCJKUU1JR1JBVEU6IE1pZ3JhdGUgaXMgaW5zdGFsbGVkXCIgK1xyXG5cdFx0KCBqUXVlcnkubWlncmF0ZU11dGUgPyBcIlwiIDogXCIgd2l0aCBsb2dnaW5nIGFjdGl2ZVwiICkgK1xyXG5cdFx0XCIsIHZlcnNpb24gXCIgKyBqUXVlcnkubWlncmF0ZVZlcnNpb24gKTtcclxuXHJcbn0gKSgpO1xyXG5cclxudmFyIHdhcm5lZEFib3V0ID0ge307XHJcblxyXG4vLyBMaXN0IG9mIHdhcm5pbmdzIGFscmVhZHkgZ2l2ZW47IHB1YmxpYyByZWFkIG9ubHlcclxualF1ZXJ5Lm1pZ3JhdGVXYXJuaW5ncyA9IFtdO1xyXG5cclxuLy8gU2V0IHRvIGZhbHNlIHRvIGRpc2FibGUgdHJhY2VzIHRoYXQgYXBwZWFyIHdpdGggd2FybmluZ3NcclxuaWYgKCBqUXVlcnkubWlncmF0ZVRyYWNlID09PSB1bmRlZmluZWQgKSB7XHJcblx0alF1ZXJ5Lm1pZ3JhdGVUcmFjZSA9IHRydWU7XHJcbn1cclxuXHJcbi8vIEZvcmdldCBhbnkgd2FybmluZ3Mgd2UndmUgYWxyZWFkeSBnaXZlbjsgcHVibGljXHJcbmpRdWVyeS5taWdyYXRlUmVzZXQgPSBmdW5jdGlvbigpIHtcclxuXHR3YXJuZWRBYm91dCA9IHt9O1xyXG5cdGpRdWVyeS5taWdyYXRlV2FybmluZ3MubGVuZ3RoID0gMDtcclxufTtcclxuXHJcbmZ1bmN0aW9uIG1pZ3JhdGVXYXJuKCBtc2cgKSB7XHJcblx0dmFyIGNvbnNvbGUgPSB3aW5kb3cuY29uc29sZTtcclxuXHRpZiAoICF3YXJuZWRBYm91dFsgbXNnIF0gKSB7XHJcblx0XHR3YXJuZWRBYm91dFsgbXNnIF0gPSB0cnVlO1xyXG5cdFx0alF1ZXJ5Lm1pZ3JhdGVXYXJuaW5ncy5wdXNoKCBtc2cgKTtcclxuXHRcdGlmICggY29uc29sZSAmJiBjb25zb2xlLndhcm4gJiYgIWpRdWVyeS5taWdyYXRlTXV0ZSApIHtcclxuXHRcdFx0Y29uc29sZS53YXJuKCBcIkpRTUlHUkFURTogXCIgKyBtc2cgKTtcclxuXHRcdFx0aWYgKCBqUXVlcnkubWlncmF0ZVRyYWNlICYmIGNvbnNvbGUudHJhY2UgKSB7XHJcblx0XHRcdFx0Y29uc29sZS50cmFjZSgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBtaWdyYXRlV2FyblByb3AoIG9iaiwgcHJvcCwgdmFsdWUsIG1zZyApIHtcclxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoIG9iaiwgcHJvcCwge1xyXG5cdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxyXG5cdFx0ZW51bWVyYWJsZTogdHJ1ZSxcclxuXHRcdGdldDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdG1pZ3JhdGVXYXJuKCBtc2cgKTtcclxuXHRcdFx0cmV0dXJuIHZhbHVlO1xyXG5cdFx0fVxyXG5cdH0gKTtcclxufVxyXG5cclxuaWYgKCBkb2N1bWVudC5jb21wYXRNb2RlID09PSBcIkJhY2tDb21wYXRcIiApIHtcclxuXHJcblx0Ly8gSlF1ZXJ5IGhhcyBuZXZlciBzdXBwb3J0ZWQgb3IgdGVzdGVkIFF1aXJrcyBNb2RlXHJcblx0bWlncmF0ZVdhcm4oIFwialF1ZXJ5IGlzIG5vdCBjb21wYXRpYmxlIHdpdGggUXVpcmtzIE1vZGVcIiApO1xyXG59XHJcblxyXG5cclxudmFyIG9sZEluaXQgPSBqUXVlcnkuZm4uaW5pdCxcclxuXHRvbGRJc051bWVyaWMgPSBqUXVlcnkuaXNOdW1lcmljLFxyXG5cdG9sZEZpbmQgPSBqUXVlcnkuZmluZCxcclxuXHRyYXR0ckhhc2hUZXN0ID0gL1xcWyhcXHMqWy1cXHddK1xccyopKFt+fF4kKl0/PSlcXHMqKFstXFx3I10qPyNbLVxcdyNdKilcXHMqXFxdLyxcclxuXHRyYXR0ckhhc2hHbG9iID0gL1xcWyhcXHMqWy1cXHddK1xccyopKFt+fF4kKl0/PSlcXHMqKFstXFx3I10qPyNbLVxcdyNdKilcXHMqXFxdL2c7XHJcblxyXG5qUXVlcnkuZm4uaW5pdCA9IGZ1bmN0aW9uKCBhcmcxICkge1xyXG5cdHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGFyZ3VtZW50cyApO1xyXG5cclxuXHRpZiAoIHR5cGVvZiBhcmcxID09PSBcInN0cmluZ1wiICYmIGFyZzEgPT09IFwiI1wiICkge1xyXG5cclxuXHRcdC8vIEpRdWVyeSggXCIjXCIgKSBpcyBhIGJvZ3VzIElEIHNlbGVjdG9yLCBidXQgaXQgcmV0dXJuZWQgYW4gZW1wdHkgc2V0IGJlZm9yZSBqUXVlcnkgMy4wXHJcblx0XHRtaWdyYXRlV2FybiggXCJqUXVlcnkoICcjJyApIGlzIG5vdCBhIHZhbGlkIHNlbGVjdG9yXCIgKTtcclxuXHRcdGFyZ3NbIDAgXSA9IFtdO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIG9sZEluaXQuYXBwbHkoIHRoaXMsIGFyZ3MgKTtcclxufTtcclxualF1ZXJ5LmZuLmluaXQucHJvdG90eXBlID0galF1ZXJ5LmZuO1xyXG5cclxualF1ZXJ5LmZpbmQgPSBmdW5jdGlvbiggc2VsZWN0b3IgKSB7XHJcblx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCggYXJndW1lbnRzICk7XHJcblxyXG5cdC8vIFN1cHBvcnQ6IFBoYW50b21KUyAxLnhcclxuXHQvLyBTdHJpbmcjbWF0Y2ggZmFpbHMgdG8gbWF0Y2ggd2hlbiB1c2VkIHdpdGggYSAvL2cgUmVnRXhwLCBvbmx5IG9uIHNvbWUgc3RyaW5nc1xyXG5cdGlmICggdHlwZW9mIHNlbGVjdG9yID09PSBcInN0cmluZ1wiICYmIHJhdHRySGFzaFRlc3QudGVzdCggc2VsZWN0b3IgKSApIHtcclxuXHJcblx0XHQvLyBUaGUgbm9uc3RhbmRhcmQgYW5kIHVuZG9jdW1lbnRlZCB1bnF1b3RlZC1oYXNoIHdhcyByZW1vdmVkIGluIGpRdWVyeSAxLjEyLjBcclxuXHRcdC8vIEZpcnN0IHNlZSBpZiBxUyB0aGlua3MgaXQncyBhIHZhbGlkIHNlbGVjdG9yLCBpZiBzbyBhdm9pZCBhIGZhbHNlIHBvc2l0aXZlXHJcblx0XHR0cnkge1xyXG5cdFx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCBzZWxlY3RvciApO1xyXG5cdFx0fSBjYXRjaCAoIGVycjEgKSB7XHJcblxyXG5cdFx0XHQvLyBEaWRuJ3QgKmxvb2sqIHZhbGlkIHRvIHFTQSwgd2FybiBhbmQgdHJ5IHF1b3Rpbmcgd2hhdCB3ZSB0aGluayBpcyB0aGUgdmFsdWVcclxuXHRcdFx0c2VsZWN0b3IgPSBzZWxlY3Rvci5yZXBsYWNlKCByYXR0ckhhc2hHbG9iLCBmdW5jdGlvbiggXywgYXR0ciwgb3AsIHZhbHVlICkge1xyXG5cdFx0XHRcdHJldHVybiBcIltcIiArIGF0dHIgKyBvcCArIFwiXFxcIlwiICsgdmFsdWUgKyBcIlxcXCJdXCI7XHJcblx0XHRcdH0gKTtcclxuXHJcblx0XHRcdC8vIElmIHRoZSByZWdleHAgKm1heSogaGF2ZSBjcmVhdGVkIGFuIGludmFsaWQgc2VsZWN0b3IsIGRvbid0IHVwZGF0ZSBpdFxyXG5cdFx0XHQvLyBOb3RlIHRoYXQgdGhlcmUgbWF5IGJlIGZhbHNlIGFsYXJtcyBpZiBzZWxlY3RvciB1c2VzIGpRdWVyeSBleHRlbnNpb25zXHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3Rvciggc2VsZWN0b3IgKTtcclxuXHRcdFx0XHRtaWdyYXRlV2FybiggXCJBdHRyaWJ1dGUgc2VsZWN0b3Igd2l0aCAnIycgbXVzdCBiZSBxdW90ZWQ6IFwiICsgYXJnc1sgMCBdICk7XHJcblx0XHRcdFx0YXJnc1sgMCBdID0gc2VsZWN0b3I7XHJcblx0XHRcdH0gY2F0Y2ggKCBlcnIyICkge1xyXG5cdFx0XHRcdG1pZ3JhdGVXYXJuKCBcIkF0dHJpYnV0ZSBzZWxlY3RvciB3aXRoICcjJyB3YXMgbm90IGZpeGVkOiBcIiArIGFyZ3NbIDAgXSApO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gb2xkRmluZC5hcHBseSggdGhpcywgYXJncyApO1xyXG59O1xyXG5cclxuLy8gQ29weSBwcm9wZXJ0aWVzIGF0dGFjaGVkIHRvIG9yaWdpbmFsIGpRdWVyeS5maW5kIG1ldGhvZCAoZS5nLiAuYXR0ciwgLmlzWE1MKVxyXG52YXIgZmluZFByb3A7XHJcbmZvciAoIGZpbmRQcm9wIGluIG9sZEZpbmQgKSB7XHJcblx0aWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIG9sZEZpbmQsIGZpbmRQcm9wICkgKSB7XHJcblx0XHRqUXVlcnkuZmluZFsgZmluZFByb3AgXSA9IG9sZEZpbmRbIGZpbmRQcm9wIF07XHJcblx0fVxyXG59XHJcblxyXG4vLyBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIGNvbnRhaW5lZCBpbiB0aGUgbWF0Y2hlZCBlbGVtZW50IHNldFxyXG5qUXVlcnkuZm4uc2l6ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdG1pZ3JhdGVXYXJuKCBcImpRdWVyeS5mbi5zaXplKCkgaXMgZGVwcmVjYXRlZDsgdXNlIHRoZSAubGVuZ3RoIHByb3BlcnR5XCIgKTtcclxuXHRyZXR1cm4gdGhpcy5sZW5ndGg7XHJcbn07XHJcblxyXG5qUXVlcnkucGFyc2VKU09OID0gZnVuY3Rpb24oKSB7XHJcblx0bWlncmF0ZVdhcm4oIFwialF1ZXJ5LnBhcnNlSlNPTiBpcyBkZXByZWNhdGVkOyB1c2UgSlNPTi5wYXJzZVwiICk7XHJcblx0cmV0dXJuIEpTT04ucGFyc2UuYXBwbHkoIG51bGwsIGFyZ3VtZW50cyApO1xyXG59O1xyXG5cclxualF1ZXJ5LmlzTnVtZXJpYyA9IGZ1bmN0aW9uKCB2YWwgKSB7XHJcblxyXG5cdC8vIFRoZSBqUXVlcnkgMi4yLjMgaW1wbGVtZW50YXRpb24gb2YgaXNOdW1lcmljXHJcblx0ZnVuY3Rpb24gaXNOdW1lcmljMiggb2JqICkge1xyXG5cdFx0dmFyIHJlYWxTdHJpbmdPYmogPSBvYmogJiYgb2JqLnRvU3RyaW5nKCk7XHJcblx0XHRyZXR1cm4gIWpRdWVyeS5pc0FycmF5KCBvYmogKSAmJiAoIHJlYWxTdHJpbmdPYmogLSBwYXJzZUZsb2F0KCByZWFsU3RyaW5nT2JqICkgKyAxICkgPj0gMDtcclxuXHR9XHJcblxyXG5cdHZhciBuZXdWYWx1ZSA9IG9sZElzTnVtZXJpYyggdmFsICksXHJcblx0XHRvbGRWYWx1ZSA9IGlzTnVtZXJpYzIoIHZhbCApO1xyXG5cclxuXHRpZiAoIG5ld1ZhbHVlICE9PSBvbGRWYWx1ZSApIHtcclxuXHRcdG1pZ3JhdGVXYXJuKCBcImpRdWVyeS5pc051bWVyaWMoKSBzaG91bGQgbm90IGJlIGNhbGxlZCBvbiBjb25zdHJ1Y3RlZCBvYmplY3RzXCIgKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBvbGRWYWx1ZTtcclxufTtcclxuXHJcbm1pZ3JhdGVXYXJuUHJvcCggalF1ZXJ5LCBcInVuaXF1ZVwiLCBqUXVlcnkudW5pcXVlU29ydCxcclxuXHRcImpRdWVyeS51bmlxdWUgaXMgZGVwcmVjYXRlZCwgdXNlIGpRdWVyeS51bmlxdWVTb3J0XCIgKTtcclxuXHJcbi8vIE5vdyBqUXVlcnkuZXhwci5wc2V1ZG9zIGlzIHRoZSBzdGFuZGFyZCBpbmNhbnRhdGlvblxyXG5taWdyYXRlV2FyblByb3AoIGpRdWVyeS5leHByLCBcImZpbHRlcnNcIiwgalF1ZXJ5LmV4cHIucHNldWRvcyxcclxuXHRcImpRdWVyeS5leHByLmZpbHRlcnMgaXMgbm93IGpRdWVyeS5leHByLnBzZXVkb3NcIiApO1xyXG5taWdyYXRlV2FyblByb3AoIGpRdWVyeS5leHByLCBcIjpcIiwgalF1ZXJ5LmV4cHIucHNldWRvcyxcclxuXHRcImpRdWVyeS5leHByW1xcXCI6XFxcIl0gaXMgbm93IGpRdWVyeS5leHByLnBzZXVkb3NcIiApO1xyXG5cclxuXHJcbnZhciBvbGRBamF4ID0galF1ZXJ5LmFqYXg7XHJcblxyXG5qUXVlcnkuYWpheCA9IGZ1bmN0aW9uKCApIHtcclxuXHR2YXIgalFYSFIgPSBvbGRBamF4LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcclxuXHJcblx0Ly8gQmUgc3VyZSB3ZSBnb3QgYSBqUVhIUiAoZS5nLiwgbm90IHN5bmMpXHJcblx0aWYgKCBqUVhIUi5wcm9taXNlICkge1xyXG5cdFx0bWlncmF0ZVdhcm5Qcm9wKCBqUVhIUiwgXCJzdWNjZXNzXCIsIGpRWEhSLmRvbmUsXHJcblx0XHRcdFwialFYSFIuc3VjY2VzcyBpcyBkZXByZWNhdGVkIGFuZCByZW1vdmVkXCIgKTtcclxuXHRcdG1pZ3JhdGVXYXJuUHJvcCggalFYSFIsIFwiZXJyb3JcIiwgalFYSFIuZmFpbCxcclxuXHRcdFx0XCJqUVhIUi5lcnJvciBpcyBkZXByZWNhdGVkIGFuZCByZW1vdmVkXCIgKTtcclxuXHRcdG1pZ3JhdGVXYXJuUHJvcCggalFYSFIsIFwiY29tcGxldGVcIiwgalFYSFIuYWx3YXlzLFxyXG5cdFx0XHRcImpRWEhSLmNvbXBsZXRlIGlzIGRlcHJlY2F0ZWQgYW5kIHJlbW92ZWRcIiApO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIGpRWEhSO1xyXG59O1xyXG5cclxuXHJcbnZhciBvbGRSZW1vdmVBdHRyID0galF1ZXJ5LmZuLnJlbW92ZUF0dHIsXHJcblx0b2xkVG9nZ2xlQ2xhc3MgPSBqUXVlcnkuZm4udG9nZ2xlQ2xhc3MsXHJcblx0cm1hdGNoTm9uU3BhY2UgPSAvXFxTKy9nO1xyXG5cclxualF1ZXJ5LmZuLnJlbW92ZUF0dHIgPSBmdW5jdGlvbiggbmFtZSApIHtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cdGpRdWVyeS5lYWNoKCBuYW1lLm1hdGNoKCBybWF0Y2hOb25TcGFjZSApLCBmdW5jdGlvbiggaSwgYXR0ciApIHtcclxuXHRcdGlmICggalF1ZXJ5LmV4cHIubWF0Y2guYm9vbC50ZXN0KCBhdHRyICkgKSB7XHJcblx0XHRcdG1pZ3JhdGVXYXJuKCBcImpRdWVyeS5mbi5yZW1vdmVBdHRyIG5vIGxvbmdlciBzZXRzIGJvb2xlYW4gcHJvcGVydGllczogXCIgKyBhdHRyICk7XHJcblx0XHRcdHNlbGYucHJvcCggYXR0ciwgZmFsc2UgKTtcclxuXHRcdH1cclxuXHR9ICk7XHJcblxyXG5cdHJldHVybiBvbGRSZW1vdmVBdHRyLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcclxufTtcclxuXHJcbmpRdWVyeS5mbi50b2dnbGVDbGFzcyA9IGZ1bmN0aW9uKCBzdGF0ZSApIHtcclxuXHJcblx0Ly8gT25seSBkZXByZWNhdGluZyBuby1hcmdzIG9yIHNpbmdsZSBib29sZWFuIGFyZ1xyXG5cdGlmICggc3RhdGUgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygc3RhdGUgIT09IFwiYm9vbGVhblwiICkge1xyXG5cdFx0cmV0dXJuIG9sZFRvZ2dsZUNsYXNzLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcclxuXHR9XHJcblxyXG5cdG1pZ3JhdGVXYXJuKCBcImpRdWVyeS5mbi50b2dnbGVDbGFzcyggYm9vbGVhbiApIGlzIGRlcHJlY2F0ZWRcIiApO1xyXG5cclxuXHQvLyBUb2dnbGUgZW50aXJlIGNsYXNzIG5hbWUgb2YgZWFjaCBlbGVtZW50XHJcblx0cmV0dXJuIHRoaXMuZWFjaCggZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgY2xhc3NOYW1lID0gdGhpcy5nZXRBdHRyaWJ1dGUgJiYgdGhpcy5nZXRBdHRyaWJ1dGUoIFwiY2xhc3NcIiApIHx8IFwiXCI7XHJcblxyXG5cdFx0aWYgKCBjbGFzc05hbWUgKSB7XHJcblx0XHRcdGpRdWVyeS5kYXRhKCB0aGlzLCBcIl9fY2xhc3NOYW1lX19cIiwgY2xhc3NOYW1lICk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gSWYgdGhlIGVsZW1lbnQgaGFzIGEgY2xhc3MgbmFtZSBvciBpZiB3ZSdyZSBwYXNzZWQgYGZhbHNlYCxcclxuXHRcdC8vIHRoZW4gcmVtb3ZlIHRoZSB3aG9sZSBjbGFzc25hbWUgKGlmIHRoZXJlIHdhcyBvbmUsIHRoZSBhYm92ZSBzYXZlZCBpdCkuXHJcblx0XHQvLyBPdGhlcndpc2UgYnJpbmcgYmFjayB3aGF0ZXZlciB3YXMgcHJldmlvdXNseSBzYXZlZCAoaWYgYW55dGhpbmcpLFxyXG5cdFx0Ly8gZmFsbGluZyBiYWNrIHRvIHRoZSBlbXB0eSBzdHJpbmcgaWYgbm90aGluZyB3YXMgc3RvcmVkLlxyXG5cdFx0aWYgKCB0aGlzLnNldEF0dHJpYnV0ZSApIHtcclxuXHRcdFx0dGhpcy5zZXRBdHRyaWJ1dGUoIFwiY2xhc3NcIixcclxuXHRcdFx0XHRjbGFzc05hbWUgfHwgc3RhdGUgPT09IGZhbHNlID9cclxuXHRcdFx0XHRcIlwiIDpcclxuXHRcdFx0XHRqUXVlcnkuZGF0YSggdGhpcywgXCJfX2NsYXNzTmFtZV9fXCIgKSB8fCBcIlwiXHJcblx0XHRcdCk7XHJcblx0XHR9XHJcblx0fSApO1xyXG59O1xyXG5cclxuXHJcbnZhciBpbnRlcm5hbFN3YXBDYWxsID0gZmFsc2U7XHJcblxyXG4vLyBJZiB0aGlzIHZlcnNpb24gb2YgalF1ZXJ5IGhhcyAuc3dhcCgpLCBkb24ndCBmYWxzZS1hbGFybSBvbiBpbnRlcm5hbCB1c2VzXHJcbmlmICggalF1ZXJ5LnN3YXAgKSB7XHJcblx0alF1ZXJ5LmVhY2goIFsgXCJoZWlnaHRcIiwgXCJ3aWR0aFwiLCBcInJlbGlhYmxlTWFyZ2luUmlnaHRcIiBdLCBmdW5jdGlvbiggXywgbmFtZSApIHtcclxuXHRcdHZhciBvbGRIb29rID0galF1ZXJ5LmNzc0hvb2tzWyBuYW1lIF0gJiYgalF1ZXJ5LmNzc0hvb2tzWyBuYW1lIF0uZ2V0O1xyXG5cclxuXHRcdGlmICggb2xkSG9vayApIHtcclxuXHRcdFx0alF1ZXJ5LmNzc0hvb2tzWyBuYW1lIF0uZ2V0ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dmFyIHJldDtcclxuXHJcblx0XHRcdFx0aW50ZXJuYWxTd2FwQ2FsbCA9IHRydWU7XHJcblx0XHRcdFx0cmV0ID0gb2xkSG9vay5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XHJcblx0XHRcdFx0aW50ZXJuYWxTd2FwQ2FsbCA9IGZhbHNlO1xyXG5cdFx0XHRcdHJldHVybiByZXQ7XHJcblx0XHRcdH07XHJcblx0XHR9XHJcblx0fSApO1xyXG59XHJcblxyXG5qUXVlcnkuc3dhcCA9IGZ1bmN0aW9uKCBlbGVtLCBvcHRpb25zLCBjYWxsYmFjaywgYXJncyApIHtcclxuXHR2YXIgcmV0LCBuYW1lLFxyXG5cdFx0b2xkID0ge307XHJcblxyXG5cdGlmICggIWludGVybmFsU3dhcENhbGwgKSB7XHJcblx0XHRtaWdyYXRlV2FybiggXCJqUXVlcnkuc3dhcCgpIGlzIHVuZG9jdW1lbnRlZCBhbmQgZGVwcmVjYXRlZFwiICk7XHJcblx0fVxyXG5cclxuXHQvLyBSZW1lbWJlciB0aGUgb2xkIHZhbHVlcywgYW5kIGluc2VydCB0aGUgbmV3IG9uZXNcclxuXHRmb3IgKCBuYW1lIGluIG9wdGlvbnMgKSB7XHJcblx0XHRvbGRbIG5hbWUgXSA9IGVsZW0uc3R5bGVbIG5hbWUgXTtcclxuXHRcdGVsZW0uc3R5bGVbIG5hbWUgXSA9IG9wdGlvbnNbIG5hbWUgXTtcclxuXHR9XHJcblxyXG5cdHJldCA9IGNhbGxiYWNrLmFwcGx5KCBlbGVtLCBhcmdzIHx8IFtdICk7XHJcblxyXG5cdC8vIFJldmVydCB0aGUgb2xkIHZhbHVlc1xyXG5cdGZvciAoIG5hbWUgaW4gb3B0aW9ucyApIHtcclxuXHRcdGVsZW0uc3R5bGVbIG5hbWUgXSA9IG9sZFsgbmFtZSBdO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHJldDtcclxufTtcclxuXHJcbnZhciBvbGREYXRhID0galF1ZXJ5LmRhdGE7XHJcblxyXG5qUXVlcnkuZGF0YSA9IGZ1bmN0aW9uKCBlbGVtLCBuYW1lLCB2YWx1ZSApIHtcclxuXHR2YXIgY3VyRGF0YTtcclxuXHJcblx0Ly8gSWYgdGhlIG5hbWUgaXMgdHJhbnNmb3JtZWQsIGxvb2sgZm9yIHRoZSB1bi10cmFuc2Zvcm1lZCBuYW1lIGluIHRoZSBkYXRhIG9iamVjdFxyXG5cdGlmICggbmFtZSAmJiBuYW1lICE9PSBqUXVlcnkuY2FtZWxDYXNlKCBuYW1lICkgKSB7XHJcblx0XHRjdXJEYXRhID0galF1ZXJ5Lmhhc0RhdGEoIGVsZW0gKSAmJiBvbGREYXRhLmNhbGwoIHRoaXMsIGVsZW0gKTtcclxuXHRcdGlmICggY3VyRGF0YSAmJiBuYW1lIGluIGN1ckRhdGEgKSB7XHJcblx0XHRcdG1pZ3JhdGVXYXJuKCBcImpRdWVyeS5kYXRhKCkgYWx3YXlzIHNldHMvZ2V0cyBjYW1lbENhc2VkIG5hbWVzOiBcIiArIG5hbWUgKTtcclxuXHRcdFx0aWYgKCBhcmd1bWVudHMubGVuZ3RoID4gMiApIHtcclxuXHRcdFx0XHRjdXJEYXRhWyBuYW1lIF0gPSB2YWx1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gY3VyRGF0YVsgbmFtZSBdO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIG9sZERhdGEuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xyXG59O1xyXG5cclxudmFyIG9sZFR3ZWVuUnVuID0galF1ZXJ5LlR3ZWVuLnByb3RvdHlwZS5ydW47XHJcblxyXG5qUXVlcnkuVHdlZW4ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uKCBwZXJjZW50ICkge1xyXG5cdGlmICggalF1ZXJ5LmVhc2luZ1sgdGhpcy5lYXNpbmcgXS5sZW5ndGggPiAxICkge1xyXG5cdFx0bWlncmF0ZVdhcm4oXHJcblx0XHRcdFwiZWFzaW5nIGZ1bmN0aW9uIFwiICtcclxuXHRcdFx0XCJcXFwialF1ZXJ5LmVhc2luZy5cIiArIHRoaXMuZWFzaW5nLnRvU3RyaW5nKCkgK1xyXG5cdFx0XHRcIlxcXCIgc2hvdWxkIHVzZSBvbmx5IGZpcnN0IGFyZ3VtZW50XCJcclxuXHRcdCk7XHJcblxyXG5cdFx0alF1ZXJ5LmVhc2luZ1sgdGhpcy5lYXNpbmcgXSA9IGpRdWVyeS5lYXNpbmdbIHRoaXMuZWFzaW5nIF0uYmluZChcclxuXHRcdFx0alF1ZXJ5LmVhc2luZyxcclxuXHRcdFx0cGVyY2VudCwgdGhpcy5vcHRpb25zLmR1cmF0aW9uICogcGVyY2VudCwgMCwgMSwgdGhpcy5vcHRpb25zLmR1cmF0aW9uXHJcblx0XHQpO1xyXG5cdH1cclxuXHJcblx0b2xkVHdlZW5SdW4uYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xyXG59O1xyXG5cclxudmFyIG9sZExvYWQgPSBqUXVlcnkuZm4ubG9hZCxcclxuXHRvcmlnaW5hbEZpeCA9IGpRdWVyeS5ldmVudC5maXg7XHJcblxyXG5qUXVlcnkuZXZlbnQucHJvcHMgPSBbXTtcclxualF1ZXJ5LmV2ZW50LmZpeEhvb2tzID0ge307XHJcblxyXG5qUXVlcnkuZXZlbnQuZml4ID0gZnVuY3Rpb24oIG9yaWdpbmFsRXZlbnQgKSB7XHJcblx0dmFyIGV2ZW50LFxyXG5cdFx0dHlwZSA9IG9yaWdpbmFsRXZlbnQudHlwZSxcclxuXHRcdGZpeEhvb2sgPSB0aGlzLmZpeEhvb2tzWyB0eXBlIF0sXHJcblx0XHRwcm9wcyA9IGpRdWVyeS5ldmVudC5wcm9wcztcclxuXHJcblx0aWYgKCBwcm9wcy5sZW5ndGggKSB7XHJcblx0XHRtaWdyYXRlV2FybiggXCJqUXVlcnkuZXZlbnQucHJvcHMgYXJlIGRlcHJlY2F0ZWQgYW5kIHJlbW92ZWQ6IFwiICsgcHJvcHMuam9pbigpICk7XHJcblx0XHR3aGlsZSAoIHByb3BzLmxlbmd0aCApIHtcclxuXHRcdFx0alF1ZXJ5LmV2ZW50LmFkZFByb3AoIHByb3BzLnBvcCgpICk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRpZiAoIGZpeEhvb2sgJiYgIWZpeEhvb2suX21pZ3JhdGVkXyApIHtcclxuXHRcdGZpeEhvb2suX21pZ3JhdGVkXyA9IHRydWU7XHJcblx0XHRtaWdyYXRlV2FybiggXCJqUXVlcnkuZXZlbnQuZml4SG9va3MgYXJlIGRlcHJlY2F0ZWQgYW5kIHJlbW92ZWQ6IFwiICsgdHlwZSApO1xyXG5cdFx0aWYgKCAoIHByb3BzID0gZml4SG9vay5wcm9wcyApICYmIHByb3BzLmxlbmd0aCApIHtcclxuXHRcdFx0d2hpbGUgKCBwcm9wcy5sZW5ndGggKSB7XHJcblx0XHRcdCAgIGpRdWVyeS5ldmVudC5hZGRQcm9wKCBwcm9wcy5wb3AoKSApO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRldmVudCA9IG9yaWdpbmFsRml4LmNhbGwoIHRoaXMsIG9yaWdpbmFsRXZlbnQgKTtcclxuXHJcblx0cmV0dXJuIGZpeEhvb2sgJiYgZml4SG9vay5maWx0ZXIgPyBmaXhIb29rLmZpbHRlciggZXZlbnQsIG9yaWdpbmFsRXZlbnQgKSA6IGV2ZW50O1xyXG59O1xyXG5cclxualF1ZXJ5LmVhY2goIFsgXCJsb2FkXCIsIFwidW5sb2FkXCIsIFwiZXJyb3JcIiBdLCBmdW5jdGlvbiggXywgbmFtZSApIHtcclxuXHJcblx0alF1ZXJ5LmZuWyBuYW1lIF0gPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMCApO1xyXG5cclxuXHRcdC8vIElmIHRoaXMgaXMgYW4gYWpheCBsb2FkKCkgdGhlIGZpcnN0IGFyZyBzaG91bGQgYmUgdGhlIHN0cmluZyBVUkw7XHJcblx0XHQvLyB0ZWNobmljYWxseSB0aGlzIGNvdWxkIGFsc28gYmUgdGhlIFwiQW55dGhpbmdcIiBhcmcgb2YgdGhlIGV2ZW50IC5sb2FkKClcclxuXHRcdC8vIHdoaWNoIGp1c3QgZ29lcyB0byBzaG93IHdoeSB0aGlzIGR1bWIgc2lnbmF0dXJlIGhhcyBiZWVuIGRlcHJlY2F0ZWQhXHJcblx0XHQvLyBqUXVlcnkgY3VzdG9tIGJ1aWxkcyB0aGF0IGV4Y2x1ZGUgdGhlIEFqYXggbW9kdWxlIGp1c3RpZmlhYmx5IGRpZSBoZXJlLlxyXG5cdFx0aWYgKCBuYW1lID09PSBcImxvYWRcIiAmJiB0eXBlb2YgYXJnc1sgMCBdID09PSBcInN0cmluZ1wiICkge1xyXG5cdFx0XHRyZXR1cm4gb2xkTG9hZC5hcHBseSggdGhpcywgYXJncyApO1xyXG5cdFx0fVxyXG5cclxuXHRcdG1pZ3JhdGVXYXJuKCBcImpRdWVyeS5mbi5cIiArIG5hbWUgKyBcIigpIGlzIGRlcHJlY2F0ZWRcIiApO1xyXG5cclxuXHRcdGFyZ3Muc3BsaWNlKCAwLCAwLCBuYW1lICk7XHJcblx0XHRpZiAoIGFyZ3VtZW50cy5sZW5ndGggKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLm9uLmFwcGx5KCB0aGlzLCBhcmdzICk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gVXNlIC50cmlnZ2VySGFuZGxlciBoZXJlIGJlY2F1c2U6XHJcblx0XHQvLyAtIGxvYWQgYW5kIHVubG9hZCBldmVudHMgZG9uJ3QgbmVlZCB0byBidWJibGUsIG9ubHkgYXBwbGllZCB0byB3aW5kb3cgb3IgaW1hZ2VcclxuXHRcdC8vIC0gZXJyb3IgZXZlbnQgc2hvdWxkIG5vdCBidWJibGUgdG8gd2luZG93LCBhbHRob3VnaCBpdCBkb2VzIHByZS0xLjdcclxuXHRcdC8vIFNlZSBodHRwOi8vYnVncy5qcXVlcnkuY29tL3RpY2tldC8xMTgyMFxyXG5cdFx0dGhpcy50cmlnZ2VySGFuZGxlci5hcHBseSggdGhpcywgYXJncyApO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fTtcclxuXHJcbn0gKTtcclxuXHJcbi8vIFRyaWdnZXIgXCJyZWFkeVwiIGV2ZW50IG9ubHkgb25jZSwgb24gZG9jdW1lbnQgcmVhZHlcclxualF1ZXJ5KCBmdW5jdGlvbigpIHtcclxuXHRqUXVlcnkoIGRvY3VtZW50ICkudHJpZ2dlckhhbmRsZXIoIFwicmVhZHlcIiApO1xyXG59ICk7XHJcblxyXG5qUXVlcnkuZXZlbnQuc3BlY2lhbC5yZWFkeSA9IHtcclxuXHRzZXR1cDogZnVuY3Rpb24oKSB7XHJcblx0XHRpZiAoIHRoaXMgPT09IGRvY3VtZW50ICkge1xyXG5cdFx0XHRtaWdyYXRlV2FybiggXCIncmVhZHknIGV2ZW50IGlzIGRlcHJlY2F0ZWRcIiApO1xyXG5cdFx0fVxyXG5cdH1cclxufTtcclxuXHJcbmpRdWVyeS5mbi5leHRlbmQoIHtcclxuXHJcblx0YmluZDogZnVuY3Rpb24oIHR5cGVzLCBkYXRhLCBmbiApIHtcclxuXHRcdG1pZ3JhdGVXYXJuKCBcImpRdWVyeS5mbi5iaW5kKCkgaXMgZGVwcmVjYXRlZFwiICk7XHJcblx0XHRyZXR1cm4gdGhpcy5vbiggdHlwZXMsIG51bGwsIGRhdGEsIGZuICk7XHJcblx0fSxcclxuXHR1bmJpbmQ6IGZ1bmN0aW9uKCB0eXBlcywgZm4gKSB7XHJcblx0XHRtaWdyYXRlV2FybiggXCJqUXVlcnkuZm4udW5iaW5kKCkgaXMgZGVwcmVjYXRlZFwiICk7XHJcblx0XHRyZXR1cm4gdGhpcy5vZmYoIHR5cGVzLCBudWxsLCBmbiApO1xyXG5cdH0sXHJcblx0ZGVsZWdhdGU6IGZ1bmN0aW9uKCBzZWxlY3RvciwgdHlwZXMsIGRhdGEsIGZuICkge1xyXG5cdFx0bWlncmF0ZVdhcm4oIFwialF1ZXJ5LmZuLmRlbGVnYXRlKCkgaXMgZGVwcmVjYXRlZFwiICk7XHJcblx0XHRyZXR1cm4gdGhpcy5vbiggdHlwZXMsIHNlbGVjdG9yLCBkYXRhLCBmbiApO1xyXG5cdH0sXHJcblx0dW5kZWxlZ2F0ZTogZnVuY3Rpb24oIHNlbGVjdG9yLCB0eXBlcywgZm4gKSB7XHJcblx0XHRtaWdyYXRlV2FybiggXCJqUXVlcnkuZm4udW5kZWxlZ2F0ZSgpIGlzIGRlcHJlY2F0ZWRcIiApO1xyXG5cdFx0cmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgP1xyXG5cdFx0XHR0aGlzLm9mZiggc2VsZWN0b3IsIFwiKipcIiApIDpcclxuXHRcdFx0dGhpcy5vZmYoIHR5cGVzLCBzZWxlY3RvciB8fCBcIioqXCIsIGZuICk7XHJcblx0fVxyXG59ICk7XHJcblxyXG5cclxudmFyIG9sZE9mZnNldCA9IGpRdWVyeS5mbi5vZmZzZXQ7XHJcblxyXG5qUXVlcnkuZm4ub2Zmc2V0ID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIGRvY0VsZW0sXHJcblx0XHRlbGVtID0gdGhpc1sgMCBdLFxyXG5cdFx0b3JpZ2luID0geyB0b3A6IDAsIGxlZnQ6IDAgfTtcclxuXHJcblx0aWYgKCAhZWxlbSB8fCAhZWxlbS5ub2RlVHlwZSApIHtcclxuXHRcdG1pZ3JhdGVXYXJuKCBcImpRdWVyeS5mbi5vZmZzZXQoKSByZXF1aXJlcyBhIHZhbGlkIERPTSBlbGVtZW50XCIgKTtcclxuXHRcdHJldHVybiBvcmlnaW47XHJcblx0fVxyXG5cclxuXHRkb2NFbGVtID0gKCBlbGVtLm93bmVyRG9jdW1lbnQgfHwgZG9jdW1lbnQgKS5kb2N1bWVudEVsZW1lbnQ7XHJcblx0aWYgKCAhalF1ZXJ5LmNvbnRhaW5zKCBkb2NFbGVtLCBlbGVtICkgKSB7XHJcblx0XHRtaWdyYXRlV2FybiggXCJqUXVlcnkuZm4ub2Zmc2V0KCkgcmVxdWlyZXMgYW4gZWxlbWVudCBjb25uZWN0ZWQgdG8gYSBkb2N1bWVudFwiICk7XHJcblx0XHRyZXR1cm4gb3JpZ2luO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIG9sZE9mZnNldC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XHJcbn07XHJcblxyXG5cclxudmFyIG9sZFBhcmFtID0galF1ZXJ5LnBhcmFtO1xyXG5cclxualF1ZXJ5LnBhcmFtID0gZnVuY3Rpb24oIGRhdGEsIHRyYWRpdGlvbmFsICkge1xyXG5cdHZhciBhamF4VHJhZGl0aW9uYWwgPSBqUXVlcnkuYWpheFNldHRpbmdzICYmIGpRdWVyeS5hamF4U2V0dGluZ3MudHJhZGl0aW9uYWw7XHJcblxyXG5cdGlmICggdHJhZGl0aW9uYWwgPT09IHVuZGVmaW5lZCAmJiBhamF4VHJhZGl0aW9uYWwgKSB7XHJcblxyXG5cdFx0bWlncmF0ZVdhcm4oIFwialF1ZXJ5LnBhcmFtKCkgbm8gbG9uZ2VyIHVzZXMgalF1ZXJ5LmFqYXhTZXR0aW5ncy50cmFkaXRpb25hbFwiICk7XHJcblx0XHR0cmFkaXRpb25hbCA9IGFqYXhUcmFkaXRpb25hbDtcclxuXHR9XHJcblxyXG5cdHJldHVybiBvbGRQYXJhbS5jYWxsKCB0aGlzLCBkYXRhLCB0cmFkaXRpb25hbCApO1xyXG59O1xyXG5cclxudmFyIG9sZFNlbGYgPSBqUXVlcnkuZm4uYW5kU2VsZiB8fCBqUXVlcnkuZm4uYWRkQmFjaztcclxuXHJcbmpRdWVyeS5mbi5hbmRTZWxmID0gZnVuY3Rpb24oKSB7XHJcblx0bWlncmF0ZVdhcm4oIFwialF1ZXJ5LmZuLmFuZFNlbGYoKSByZXBsYWNlZCBieSBqUXVlcnkuZm4uYWRkQmFjaygpXCIgKTtcclxuXHRyZXR1cm4gb2xkU2VsZi5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XHJcbn07XHJcblxyXG5cclxudmFyIG9sZERlZmVycmVkID0galF1ZXJ5LkRlZmVycmVkLFxyXG5cdHR1cGxlcyA9IFtcclxuXHJcblx0XHQvLyBBY3Rpb24sIGFkZCBsaXN0ZW5lciwgY2FsbGJhY2tzLCAudGhlbiBoYW5kbGVycywgZmluYWwgc3RhdGVcclxuXHRcdFsgXCJyZXNvbHZlXCIsIFwiZG9uZVwiLCBqUXVlcnkuQ2FsbGJhY2tzKCBcIm9uY2UgbWVtb3J5XCIgKSxcclxuXHRcdFx0alF1ZXJ5LkNhbGxiYWNrcyggXCJvbmNlIG1lbW9yeVwiICksIFwicmVzb2x2ZWRcIiBdLFxyXG5cdFx0WyBcInJlamVjdFwiLCBcImZhaWxcIiwgalF1ZXJ5LkNhbGxiYWNrcyggXCJvbmNlIG1lbW9yeVwiICksXHJcblx0XHRcdGpRdWVyeS5DYWxsYmFja3MoIFwib25jZSBtZW1vcnlcIiApLCBcInJlamVjdGVkXCIgXSxcclxuXHRcdFsgXCJub3RpZnlcIiwgXCJwcm9ncmVzc1wiLCBqUXVlcnkuQ2FsbGJhY2tzKCBcIm1lbW9yeVwiICksXHJcblx0XHRcdGpRdWVyeS5DYWxsYmFja3MoIFwibWVtb3J5XCIgKSBdXHJcblx0XTtcclxuXHJcbmpRdWVyeS5EZWZlcnJlZCA9IGZ1bmN0aW9uKCBmdW5jICkge1xyXG5cdHZhciBkZWZlcnJlZCA9IG9sZERlZmVycmVkKCksXHJcblx0XHRwcm9taXNlID0gZGVmZXJyZWQucHJvbWlzZSgpO1xyXG5cclxuXHRkZWZlcnJlZC5waXBlID0gcHJvbWlzZS5waXBlID0gZnVuY3Rpb24oIC8qIGZuRG9uZSwgZm5GYWlsLCBmblByb2dyZXNzICovICkge1xyXG5cdFx0dmFyIGZucyA9IGFyZ3VtZW50cztcclxuXHJcblx0XHRtaWdyYXRlV2FybiggXCJkZWZlcnJlZC5waXBlKCkgaXMgZGVwcmVjYXRlZFwiICk7XHJcblxyXG5cdFx0cmV0dXJuIGpRdWVyeS5EZWZlcnJlZCggZnVuY3Rpb24oIG5ld0RlZmVyICkge1xyXG5cdFx0XHRqUXVlcnkuZWFjaCggdHVwbGVzLCBmdW5jdGlvbiggaSwgdHVwbGUgKSB7XHJcblx0XHRcdFx0dmFyIGZuID0galF1ZXJ5LmlzRnVuY3Rpb24oIGZuc1sgaSBdICkgJiYgZm5zWyBpIF07XHJcblxyXG5cdFx0XHRcdC8vIERlZmVycmVkLmRvbmUoZnVuY3Rpb24oKSB7IGJpbmQgdG8gbmV3RGVmZXIgb3IgbmV3RGVmZXIucmVzb2x2ZSB9KVxyXG5cdFx0XHRcdC8vIGRlZmVycmVkLmZhaWwoZnVuY3Rpb24oKSB7IGJpbmQgdG8gbmV3RGVmZXIgb3IgbmV3RGVmZXIucmVqZWN0IH0pXHJcblx0XHRcdFx0Ly8gZGVmZXJyZWQucHJvZ3Jlc3MoZnVuY3Rpb24oKSB7IGJpbmQgdG8gbmV3RGVmZXIgb3IgbmV3RGVmZXIubm90aWZ5IH0pXHJcblx0XHRcdFx0ZGVmZXJyZWRbIHR1cGxlWyAxIF0gXSggZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHR2YXIgcmV0dXJuZWQgPSBmbiAmJiBmbi5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XHJcblx0XHRcdFx0XHRpZiAoIHJldHVybmVkICYmIGpRdWVyeS5pc0Z1bmN0aW9uKCByZXR1cm5lZC5wcm9taXNlICkgKSB7XHJcblx0XHRcdFx0XHRcdHJldHVybmVkLnByb21pc2UoKVxyXG5cdFx0XHRcdFx0XHRcdC5kb25lKCBuZXdEZWZlci5yZXNvbHZlIClcclxuXHRcdFx0XHRcdFx0XHQuZmFpbCggbmV3RGVmZXIucmVqZWN0IClcclxuXHRcdFx0XHRcdFx0XHQucHJvZ3Jlc3MoIG5ld0RlZmVyLm5vdGlmeSApO1xyXG5cdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0bmV3RGVmZXJbIHR1cGxlWyAwIF0gKyBcIldpdGhcIiBdKFxyXG5cdFx0XHRcdFx0XHRcdHRoaXMgPT09IHByb21pc2UgPyBuZXdEZWZlci5wcm9taXNlKCkgOiB0aGlzLFxyXG5cdFx0XHRcdFx0XHRcdGZuID8gWyByZXR1cm5lZCBdIDogYXJndW1lbnRzXHJcblx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSApO1xyXG5cdFx0XHR9ICk7XHJcblx0XHRcdGZucyA9IG51bGw7XHJcblx0XHR9ICkucHJvbWlzZSgpO1xyXG5cclxuXHR9O1xyXG5cclxuXHRpZiAoIGZ1bmMgKSB7XHJcblx0XHRmdW5jLmNhbGwoIGRlZmVycmVkLCBkZWZlcnJlZCApO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIGRlZmVycmVkO1xyXG59O1xyXG5cclxuXHJcblxyXG59KSggalF1ZXJ5LCB3aW5kb3cgKTtcclxuLyohIE1hZ25pZmljIFBvcHVwIC0gdjEuMS4wIC0gMjAxNi0wMi0yMFxyXG4qIGh0dHA6Ly9kaW1zZW1lbm92LmNvbS9wbHVnaW5zL21hZ25pZmljLXBvcHVwL1xyXG4qIENvcHlyaWdodCAoYykgMjAxNiBEbWl0cnkgU2VtZW5vdjsgKi9cclxuOyhmdW5jdGlvbiAoZmFjdG9yeSkgeyBcclxuaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkgeyBcclxuIC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS4gXHJcbiBkZWZpbmUoWydqcXVlcnknXSwgZmFjdG9yeSk7IFxyXG4gfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHsgXHJcbiAvLyBOb2RlL0NvbW1vbkpTIFxyXG4gZmFjdG9yeShyZXF1aXJlKCdqcXVlcnknKSk7IFxyXG4gfSBlbHNlIHsgXHJcbiAvLyBCcm93c2VyIGdsb2JhbHMgXHJcbiBmYWN0b3J5KHdpbmRvdy5qUXVlcnkgfHwgd2luZG93LlplcHRvKTsgXHJcbiB9IFxyXG4gfShmdW5jdGlvbigkKSB7IFxyXG5cclxuLyo+PmNvcmUqL1xyXG4vKipcclxuICogXHJcbiAqIE1hZ25pZmljIFBvcHVwIENvcmUgSlMgZmlsZVxyXG4gKiBcclxuICovXHJcblxyXG5cclxuLyoqXHJcbiAqIFByaXZhdGUgc3RhdGljIGNvbnN0YW50c1xyXG4gKi9cclxudmFyIENMT1NFX0VWRU5UID0gJ0Nsb3NlJyxcclxuXHRCRUZPUkVfQ0xPU0VfRVZFTlQgPSAnQmVmb3JlQ2xvc2UnLFxyXG5cdEFGVEVSX0NMT1NFX0VWRU5UID0gJ0FmdGVyQ2xvc2UnLFxyXG5cdEJFRk9SRV9BUFBFTkRfRVZFTlQgPSAnQmVmb3JlQXBwZW5kJyxcclxuXHRNQVJLVVBfUEFSU0VfRVZFTlQgPSAnTWFya3VwUGFyc2UnLFxyXG5cdE9QRU5fRVZFTlQgPSAnT3BlbicsXHJcblx0Q0hBTkdFX0VWRU5UID0gJ0NoYW5nZScsXHJcblx0TlMgPSAnbWZwJyxcclxuXHRFVkVOVF9OUyA9ICcuJyArIE5TLFxyXG5cdFJFQURZX0NMQVNTID0gJ21mcC1yZWFkeScsXHJcblx0UkVNT1ZJTkdfQ0xBU1MgPSAnbWZwLXJlbW92aW5nJyxcclxuXHRQUkVWRU5UX0NMT1NFX0NMQVNTID0gJ21mcC1wcmV2ZW50LWNsb3NlJztcclxuXHJcblxyXG4vKipcclxuICogUHJpdmF0ZSB2YXJzIFxyXG4gKi9cclxuLypqc2hpbnQgLVcwNzkgKi9cclxudmFyIG1mcCwgLy8gQXMgd2UgaGF2ZSBvbmx5IG9uZSBpbnN0YW5jZSBvZiBNYWduaWZpY1BvcHVwIG9iamVjdCwgd2UgZGVmaW5lIGl0IGxvY2FsbHkgdG8gbm90IHRvIHVzZSAndGhpcydcclxuXHRNYWduaWZpY1BvcHVwID0gZnVuY3Rpb24oKXt9LFxyXG5cdF9pc0pRID0gISEod2luZG93LmpRdWVyeSksXHJcblx0X3ByZXZTdGF0dXMsXHJcblx0X3dpbmRvdyA9ICQod2luZG93KSxcclxuXHRfZG9jdW1lbnQsXHJcblx0X3ByZXZDb250ZW50VHlwZSxcclxuXHRfd3JhcENsYXNzZXMsXHJcblx0X2N1cnJQb3B1cFR5cGU7XHJcblxyXG5cclxuLyoqXHJcbiAqIFByaXZhdGUgZnVuY3Rpb25zXHJcbiAqL1xyXG52YXIgX21mcE9uID0gZnVuY3Rpb24obmFtZSwgZikge1xyXG5cdFx0bWZwLmV2Lm9uKE5TICsgbmFtZSArIEVWRU5UX05TLCBmKTtcclxuXHR9LFxyXG5cdF9nZXRFbCA9IGZ1bmN0aW9uKGNsYXNzTmFtZSwgYXBwZW5kVG8sIGh0bWwsIHJhdykge1xyXG5cdFx0dmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRlbC5jbGFzc05hbWUgPSAnbWZwLScrY2xhc3NOYW1lO1xyXG5cdFx0aWYoaHRtbCkge1xyXG5cdFx0XHRlbC5pbm5lckhUTUwgPSBodG1sO1xyXG5cdFx0fVxyXG5cdFx0aWYoIXJhdykge1xyXG5cdFx0XHRlbCA9ICQoZWwpO1xyXG5cdFx0XHRpZihhcHBlbmRUbykge1xyXG5cdFx0XHRcdGVsLmFwcGVuZFRvKGFwcGVuZFRvKTtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIGlmKGFwcGVuZFRvKSB7XHJcblx0XHRcdGFwcGVuZFRvLmFwcGVuZENoaWxkKGVsKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBlbDtcclxuXHR9LFxyXG5cdF9tZnBUcmlnZ2VyID0gZnVuY3Rpb24oZSwgZGF0YSkge1xyXG5cdFx0bWZwLmV2LnRyaWdnZXJIYW5kbGVyKE5TICsgZSwgZGF0YSk7XHJcblxyXG5cdFx0aWYobWZwLnN0LmNhbGxiYWNrcykge1xyXG5cdFx0XHQvLyBjb252ZXJ0cyBcIm1mcEV2ZW50TmFtZVwiIHRvIFwiZXZlbnROYW1lXCIgY2FsbGJhY2sgYW5kIHRyaWdnZXJzIGl0IGlmIGl0J3MgcHJlc2VudFxyXG5cdFx0XHRlID0gZS5jaGFyQXQoMCkudG9Mb3dlckNhc2UoKSArIGUuc2xpY2UoMSk7XHJcblx0XHRcdGlmKG1mcC5zdC5jYWxsYmFja3NbZV0pIHtcclxuXHRcdFx0XHRtZnAuc3QuY2FsbGJhY2tzW2VdLmFwcGx5KG1mcCwgJC5pc0FycmF5KGRhdGEpID8gZGF0YSA6IFtkYXRhXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9LFxyXG5cdF9nZXRDbG9zZUJ0biA9IGZ1bmN0aW9uKHR5cGUpIHtcclxuXHRcdGlmKHR5cGUgIT09IF9jdXJyUG9wdXBUeXBlIHx8ICFtZnAuY3VyclRlbXBsYXRlLmNsb3NlQnRuKSB7XHJcblx0XHRcdG1mcC5jdXJyVGVtcGxhdGUuY2xvc2VCdG4gPSAkKCBtZnAuc3QuY2xvc2VNYXJrdXAucmVwbGFjZSgnJXRpdGxlJScsIG1mcC5zdC50Q2xvc2UgKSApO1xyXG5cdFx0XHRfY3VyclBvcHVwVHlwZSA9IHR5cGU7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gbWZwLmN1cnJUZW1wbGF0ZS5jbG9zZUJ0bjtcclxuXHR9LFxyXG5cdC8vIEluaXRpYWxpemUgTWFnbmlmaWMgUG9wdXAgb25seSB3aGVuIGNhbGxlZCBhdCBsZWFzdCBvbmNlXHJcblx0X2NoZWNrSW5zdGFuY2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdGlmKCEkLm1hZ25pZmljUG9wdXAuaW5zdGFuY2UpIHtcclxuXHRcdFx0Lypqc2hpbnQgLVcwMjAgKi9cclxuXHRcdFx0bWZwID0gbmV3IE1hZ25pZmljUG9wdXAoKTtcclxuXHRcdFx0bWZwLmluaXQoKTtcclxuXHRcdFx0JC5tYWduaWZpY1BvcHVwLmluc3RhbmNlID0gbWZwO1xyXG5cdFx0fVxyXG5cdH0sXHJcblx0Ly8gQ1NTIHRyYW5zaXRpb24gZGV0ZWN0aW9uLCBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzcyNjQ4OTkvZGV0ZWN0LWNzcy10cmFuc2l0aW9ucy11c2luZy1qYXZhc2NyaXB0LWFuZC13aXRob3V0LW1vZGVybml6clxyXG5cdHN1cHBvcnRzVHJhbnNpdGlvbnMgPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpLnN0eWxlLCAvLyAncycgZm9yIHN0eWxlLiBiZXR0ZXIgdG8gY3JlYXRlIGFuIGVsZW1lbnQgaWYgYm9keSB5ZXQgdG8gZXhpc3RcclxuXHRcdFx0diA9IFsnbXMnLCdPJywnTW96JywnV2Via2l0J107IC8vICd2JyBmb3IgdmVuZG9yXHJcblxyXG5cdFx0aWYoIHNbJ3RyYW5zaXRpb24nXSAhPT0gdW5kZWZpbmVkICkge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTsgXHJcblx0XHR9XHJcblx0XHRcdFxyXG5cdFx0d2hpbGUoIHYubGVuZ3RoICkge1xyXG5cdFx0XHRpZiggdi5wb3AoKSArICdUcmFuc2l0aW9uJyBpbiBzICkge1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fTtcclxuXHJcblxyXG5cclxuLyoqXHJcbiAqIFB1YmxpYyBmdW5jdGlvbnNcclxuICovXHJcbk1hZ25pZmljUG9wdXAucHJvdG90eXBlID0ge1xyXG5cclxuXHRjb25zdHJ1Y3RvcjogTWFnbmlmaWNQb3B1cCxcclxuXHJcblx0LyoqXHJcblx0ICogSW5pdGlhbGl6ZXMgTWFnbmlmaWMgUG9wdXAgcGx1Z2luLiBcclxuXHQgKiBUaGlzIGZ1bmN0aW9uIGlzIHRyaWdnZXJlZCBvbmx5IG9uY2Ugd2hlbiAkLmZuLm1hZ25pZmljUG9wdXAgb3IgJC5tYWduaWZpY1BvcHVwIGlzIGV4ZWN1dGVkXHJcblx0ICovXHJcblx0aW5pdDogZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgYXBwVmVyc2lvbiA9IG5hdmlnYXRvci5hcHBWZXJzaW9uO1xyXG5cdFx0bWZwLmlzTG93SUUgPSBtZnAuaXNJRTggPSBkb2N1bWVudC5hbGwgJiYgIWRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXI7XHJcblx0XHRtZnAuaXNBbmRyb2lkID0gKC9hbmRyb2lkL2dpKS50ZXN0KGFwcFZlcnNpb24pO1xyXG5cdFx0bWZwLmlzSU9TID0gKC9pcGhvbmV8aXBhZHxpcG9kL2dpKS50ZXN0KGFwcFZlcnNpb24pO1xyXG5cdFx0bWZwLnN1cHBvcnRzVHJhbnNpdGlvbiA9IHN1cHBvcnRzVHJhbnNpdGlvbnMoKTtcclxuXHJcblx0XHQvLyBXZSBkaXNhYmxlIGZpeGVkIHBvc2l0aW9uZWQgbGlnaHRib3ggb24gZGV2aWNlcyB0aGF0IGRvbid0IGhhbmRsZSBpdCBuaWNlbHkuXHJcblx0XHQvLyBJZiB5b3Uga25vdyBhIGJldHRlciB3YXkgb2YgZGV0ZWN0aW5nIHRoaXMgLSBsZXQgbWUga25vdy5cclxuXHRcdG1mcC5wcm9iYWJseU1vYmlsZSA9IChtZnAuaXNBbmRyb2lkIHx8IG1mcC5pc0lPUyB8fCAvKE9wZXJhIE1pbmkpfEtpbmRsZXx3ZWJPU3xCbGFja0JlcnJ5fChPcGVyYSBNb2JpKXwoV2luZG93cyBQaG9uZSl8SUVNb2JpbGUvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICk7XHJcblx0XHRfZG9jdW1lbnQgPSAkKGRvY3VtZW50KTtcclxuXHJcblx0XHRtZnAucG9wdXBzQ2FjaGUgPSB7fTtcclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBPcGVucyBwb3B1cFxyXG5cdCAqIEBwYXJhbSAgZGF0YSBbZGVzY3JpcHRpb25dXHJcblx0ICovXHJcblx0b3BlbjogZnVuY3Rpb24oZGF0YSkge1xyXG5cclxuXHRcdHZhciBpO1xyXG5cclxuXHRcdGlmKGRhdGEuaXNPYmogPT09IGZhbHNlKSB7IFxyXG5cdFx0XHQvLyBjb252ZXJ0IGpRdWVyeSBjb2xsZWN0aW9uIHRvIGFycmF5IHRvIGF2b2lkIGNvbmZsaWN0cyBsYXRlclxyXG5cdFx0XHRtZnAuaXRlbXMgPSBkYXRhLml0ZW1zLnRvQXJyYXkoKTtcclxuXHJcblx0XHRcdG1mcC5pbmRleCA9IDA7XHJcblx0XHRcdHZhciBpdGVtcyA9IGRhdGEuaXRlbXMsXHJcblx0XHRcdFx0aXRlbTtcclxuXHRcdFx0Zm9yKGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRpdGVtID0gaXRlbXNbaV07XHJcblx0XHRcdFx0aWYoaXRlbS5wYXJzZWQpIHtcclxuXHRcdFx0XHRcdGl0ZW0gPSBpdGVtLmVsWzBdO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZihpdGVtID09PSBkYXRhLmVsWzBdKSB7XHJcblx0XHRcdFx0XHRtZnAuaW5kZXggPSBpO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRtZnAuaXRlbXMgPSAkLmlzQXJyYXkoZGF0YS5pdGVtcykgPyBkYXRhLml0ZW1zIDogW2RhdGEuaXRlbXNdO1xyXG5cdFx0XHRtZnAuaW5kZXggPSBkYXRhLmluZGV4IHx8IDA7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gaWYgcG9wdXAgaXMgYWxyZWFkeSBvcGVuZWQgLSB3ZSBqdXN0IHVwZGF0ZSB0aGUgY29udGVudFxyXG5cdFx0aWYobWZwLmlzT3Blbikge1xyXG5cdFx0XHRtZnAudXBkYXRlSXRlbUhUTUwoKTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRtZnAudHlwZXMgPSBbXTsgXHJcblx0XHRfd3JhcENsYXNzZXMgPSAnJztcclxuXHRcdGlmKGRhdGEubWFpbkVsICYmIGRhdGEubWFpbkVsLmxlbmd0aCkge1xyXG5cdFx0XHRtZnAuZXYgPSBkYXRhLm1haW5FbC5lcSgwKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdG1mcC5ldiA9IF9kb2N1bWVudDtcclxuXHRcdH1cclxuXHJcblx0XHRpZihkYXRhLmtleSkge1xyXG5cdFx0XHRpZighbWZwLnBvcHVwc0NhY2hlW2RhdGEua2V5XSkge1xyXG5cdFx0XHRcdG1mcC5wb3B1cHNDYWNoZVtkYXRhLmtleV0gPSB7fTtcclxuXHRcdFx0fVxyXG5cdFx0XHRtZnAuY3VyclRlbXBsYXRlID0gbWZwLnBvcHVwc0NhY2hlW2RhdGEua2V5XTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdG1mcC5jdXJyVGVtcGxhdGUgPSB7fTtcclxuXHRcdH1cclxuXHJcblxyXG5cclxuXHRcdG1mcC5zdCA9ICQuZXh0ZW5kKHRydWUsIHt9LCAkLm1hZ25pZmljUG9wdXAuZGVmYXVsdHMsIGRhdGEgKTsgXHJcblx0XHRtZnAuZml4ZWRDb250ZW50UG9zID0gbWZwLnN0LmZpeGVkQ29udGVudFBvcyA9PT0gJ2F1dG8nID8gIW1mcC5wcm9iYWJseU1vYmlsZSA6IG1mcC5zdC5maXhlZENvbnRlbnRQb3M7XHJcblxyXG5cdFx0aWYobWZwLnN0Lm1vZGFsKSB7XHJcblx0XHRcdG1mcC5zdC5jbG9zZU9uQ29udGVudENsaWNrID0gZmFsc2U7XHJcblx0XHRcdG1mcC5zdC5jbG9zZU9uQmdDbGljayA9IGZhbHNlO1xyXG5cdFx0XHRtZnAuc3Quc2hvd0Nsb3NlQnRuID0gZmFsc2U7XHJcblx0XHRcdG1mcC5zdC5lbmFibGVFc2NhcGVLZXkgPSBmYWxzZTtcclxuXHRcdH1cclxuXHRcdFxyXG5cclxuXHRcdC8vIEJ1aWxkaW5nIG1hcmt1cFxyXG5cdFx0Ly8gbWFpbiBjb250YWluZXJzIGFyZSBjcmVhdGVkIG9ubHkgb25jZVxyXG5cdFx0aWYoIW1mcC5iZ092ZXJsYXkpIHtcclxuXHJcblx0XHRcdC8vIERhcmsgb3ZlcmxheVxyXG5cdFx0XHRtZnAuYmdPdmVybGF5ID0gX2dldEVsKCdiZycpLm9uKCdjbGljaycrRVZFTlRfTlMsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdG1mcC5jbG9zZSgpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdG1mcC53cmFwID0gX2dldEVsKCd3cmFwJykuYXR0cigndGFiaW5kZXgnLCAtMSkub24oJ2NsaWNrJytFVkVOVF9OUywgZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRcdGlmKG1mcC5fY2hlY2tJZkNsb3NlKGUudGFyZ2V0KSkge1xyXG5cdFx0XHRcdFx0bWZwLmNsb3NlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdG1mcC5jb250YWluZXIgPSBfZ2V0RWwoJ2NvbnRhaW5lcicsIG1mcC53cmFwKTtcclxuXHRcdH1cclxuXHJcblx0XHRtZnAuY29udGVudENvbnRhaW5lciA9IF9nZXRFbCgnY29udGVudCcpO1xyXG5cdFx0aWYobWZwLnN0LnByZWxvYWRlcikge1xyXG5cdFx0XHRtZnAucHJlbG9hZGVyID0gX2dldEVsKCdwcmVsb2FkZXInLCBtZnAuY29udGFpbmVyLCBtZnAuc3QudExvYWRpbmcpO1xyXG5cdFx0fVxyXG5cclxuXHJcblx0XHQvLyBJbml0aWFsaXppbmcgbW9kdWxlc1xyXG5cdFx0dmFyIG1vZHVsZXMgPSAkLm1hZ25pZmljUG9wdXAubW9kdWxlcztcclxuXHRcdGZvcihpID0gMDsgaSA8IG1vZHVsZXMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0dmFyIG4gPSBtb2R1bGVzW2ldO1xyXG5cdFx0XHRuID0gbi5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIG4uc2xpY2UoMSk7XHJcblx0XHRcdG1mcFsnaW5pdCcrbl0uY2FsbChtZnApO1xyXG5cdFx0fVxyXG5cdFx0X21mcFRyaWdnZXIoJ0JlZm9yZU9wZW4nKTtcclxuXHJcblxyXG5cdFx0aWYobWZwLnN0LnNob3dDbG9zZUJ0bikge1xyXG5cdFx0XHQvLyBDbG9zZSBidXR0b25cclxuXHRcdFx0aWYoIW1mcC5zdC5jbG9zZUJ0bkluc2lkZSkge1xyXG5cdFx0XHRcdG1mcC53cmFwLmFwcGVuZCggX2dldENsb3NlQnRuKCkgKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRfbWZwT24oTUFSS1VQX1BBUlNFX0VWRU5ULCBmdW5jdGlvbihlLCB0ZW1wbGF0ZSwgdmFsdWVzLCBpdGVtKSB7XHJcblx0XHRcdFx0XHR2YWx1ZXMuY2xvc2VfcmVwbGFjZVdpdGggPSBfZ2V0Q2xvc2VCdG4oaXRlbS50eXBlKTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHRfd3JhcENsYXNzZXMgKz0gJyBtZnAtY2xvc2UtYnRuLWluJztcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmKG1mcC5zdC5hbGlnblRvcCkge1xyXG5cdFx0XHRfd3JhcENsYXNzZXMgKz0gJyBtZnAtYWxpZ24tdG9wJztcclxuXHRcdH1cclxuXHJcblx0XHJcblxyXG5cdFx0aWYobWZwLmZpeGVkQ29udGVudFBvcykge1xyXG5cdFx0XHRtZnAud3JhcC5jc3Moe1xyXG5cdFx0XHRcdG92ZXJmbG93OiBtZnAuc3Qub3ZlcmZsb3dZLFxyXG5cdFx0XHRcdG92ZXJmbG93WDogJ2hpZGRlbicsXHJcblx0XHRcdFx0b3ZlcmZsb3dZOiBtZnAuc3Qub3ZlcmZsb3dZXHJcblx0XHRcdH0pO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0bWZwLndyYXAuY3NzKHsgXHJcblx0XHRcdFx0dG9wOiBfd2luZG93LnNjcm9sbFRvcCgpLFxyXG5cdFx0XHRcdHBvc2l0aW9uOiAnYWJzb2x1dGUnXHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdFx0aWYoIG1mcC5zdC5maXhlZEJnUG9zID09PSBmYWxzZSB8fCAobWZwLnN0LmZpeGVkQmdQb3MgPT09ICdhdXRvJyAmJiAhbWZwLmZpeGVkQ29udGVudFBvcykgKSB7XHJcblx0XHRcdG1mcC5iZ092ZXJsYXkuY3NzKHtcclxuXHRcdFx0XHRoZWlnaHQ6IF9kb2N1bWVudC5oZWlnaHQoKSxcclxuXHRcdFx0XHRwb3NpdGlvbjogJ2Fic29sdXRlJ1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRcclxuXHJcblx0XHRpZihtZnAuc3QuZW5hYmxlRXNjYXBlS2V5KSB7XHJcblx0XHRcdC8vIENsb3NlIG9uIEVTQyBrZXlcclxuXHRcdFx0X2RvY3VtZW50Lm9uKCdrZXl1cCcgKyBFVkVOVF9OUywgZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRcdGlmKGUua2V5Q29kZSA9PT0gMjcpIHtcclxuXHRcdFx0XHRcdG1mcC5jbG9zZSgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdFx0X3dpbmRvdy5vbigncmVzaXplJyArIEVWRU5UX05TLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0bWZwLnVwZGF0ZVNpemUoKTtcclxuXHRcdH0pO1xyXG5cclxuXHJcblx0XHRpZighbWZwLnN0LmNsb3NlT25Db250ZW50Q2xpY2spIHtcclxuXHRcdFx0X3dyYXBDbGFzc2VzICs9ICcgbWZwLWF1dG8tY3Vyc29yJztcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0aWYoX3dyYXBDbGFzc2VzKVxyXG5cdFx0XHRtZnAud3JhcC5hZGRDbGFzcyhfd3JhcENsYXNzZXMpO1xyXG5cclxuXHJcblx0XHQvLyB0aGlzIHRyaWdnZXJzIHJlY2FsY3VsYXRpb24gb2YgbGF5b3V0LCBzbyB3ZSBnZXQgaXQgb25jZSB0byBub3QgdG8gdHJpZ2dlciB0d2ljZVxyXG5cdFx0dmFyIHdpbmRvd0hlaWdodCA9IG1mcC53SCA9IF93aW5kb3cuaGVpZ2h0KCk7XHJcblxyXG5cdFx0XHJcblx0XHR2YXIgd2luZG93U3R5bGVzID0ge307XHJcblxyXG5cdFx0aWYoIG1mcC5maXhlZENvbnRlbnRQb3MgKSB7XHJcbiAgICAgICAgICAgIGlmKG1mcC5faGFzU2Nyb2xsQmFyKHdpbmRvd0hlaWdodCkpe1xyXG4gICAgICAgICAgICAgICAgdmFyIHMgPSBtZnAuX2dldFNjcm9sbGJhclNpemUoKTtcclxuICAgICAgICAgICAgICAgIGlmKHMpIHtcclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3dTdHlsZXMubWFyZ2luUmlnaHQgPSBzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuXHRcdGlmKG1mcC5maXhlZENvbnRlbnRQb3MpIHtcclxuXHRcdFx0aWYoIW1mcC5pc0lFNykge1xyXG5cdFx0XHRcdHdpbmRvd1N0eWxlcy5vdmVyZmxvdyA9ICdoaWRkZW4nO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdC8vIGllNyBkb3VibGUtc2Nyb2xsIGJ1Z1xyXG5cdFx0XHRcdCQoJ2JvZHksIGh0bWwnKS5jc3MoJ292ZXJmbG93JywgJ2hpZGRlbicpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0XHJcblx0XHRcclxuXHRcdHZhciBjbGFzc2VzVG9hZGQgPSBtZnAuc3QubWFpbkNsYXNzO1xyXG5cdFx0aWYobWZwLmlzSUU3KSB7XHJcblx0XHRcdGNsYXNzZXNUb2FkZCArPSAnIG1mcC1pZTcnO1xyXG5cdFx0fVxyXG5cdFx0aWYoY2xhc3Nlc1RvYWRkKSB7XHJcblx0XHRcdG1mcC5fYWRkQ2xhc3NUb01GUCggY2xhc3Nlc1RvYWRkICk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gYWRkIGNvbnRlbnRcclxuXHRcdG1mcC51cGRhdGVJdGVtSFRNTCgpO1xyXG5cclxuXHRcdF9tZnBUcmlnZ2VyKCdCdWlsZENvbnRyb2xzJyk7XHJcblxyXG5cdFx0Ly8gcmVtb3ZlIHNjcm9sbGJhciwgYWRkIG1hcmdpbiBlLnQuY1xyXG5cdFx0JCgnaHRtbCcpLmNzcyh3aW5kb3dTdHlsZXMpO1xyXG5cdFx0XHJcblx0XHQvLyBhZGQgZXZlcnl0aGluZyB0byBET01cclxuXHRcdG1mcC5iZ092ZXJsYXkuYWRkKG1mcC53cmFwKS5wcmVwZW5kVG8oIG1mcC5zdC5wcmVwZW5kVG8gfHwgJChkb2N1bWVudC5ib2R5KSApO1xyXG5cclxuXHRcdC8vIFNhdmUgbGFzdCBmb2N1c2VkIGVsZW1lbnRcclxuXHRcdG1mcC5fbGFzdEZvY3VzZWRFbCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XHJcblx0XHRcclxuXHRcdC8vIFdhaXQgZm9yIG5leHQgY3ljbGUgdG8gYWxsb3cgQ1NTIHRyYW5zaXRpb25cclxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblx0XHRcdFxyXG5cdFx0XHRpZihtZnAuY29udGVudCkge1xyXG5cdFx0XHRcdG1mcC5fYWRkQ2xhc3NUb01GUChSRUFEWV9DTEFTUyk7XHJcblx0XHRcdFx0bWZwLl9zZXRGb2N1cygpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdC8vIGlmIGNvbnRlbnQgaXMgbm90IGRlZmluZWQgKG5vdCBsb2FkZWQgZS50LmMpIHdlIGFkZCBjbGFzcyBvbmx5IGZvciBCR1xyXG5cdFx0XHRcdG1mcC5iZ092ZXJsYXkuYWRkQ2xhc3MoUkVBRFlfQ0xBU1MpO1xyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHQvLyBUcmFwIHRoZSBmb2N1cyBpbiBwb3B1cFxyXG5cdFx0XHRfZG9jdW1lbnQub24oJ2ZvY3VzaW4nICsgRVZFTlRfTlMsIG1mcC5fb25Gb2N1c0luKTtcclxuXHJcblx0XHR9LCAxNik7XHJcblxyXG5cdFx0bWZwLmlzT3BlbiA9IHRydWU7XHJcblx0XHRtZnAudXBkYXRlU2l6ZSh3aW5kb3dIZWlnaHQpO1xyXG5cdFx0X21mcFRyaWdnZXIoT1BFTl9FVkVOVCk7XHJcblxyXG5cdFx0cmV0dXJuIGRhdGE7XHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogQ2xvc2VzIHRoZSBwb3B1cFxyXG5cdCAqL1xyXG5cdGNsb3NlOiBmdW5jdGlvbigpIHtcclxuXHRcdGlmKCFtZnAuaXNPcGVuKSByZXR1cm47XHJcblx0XHRfbWZwVHJpZ2dlcihCRUZPUkVfQ0xPU0VfRVZFTlQpO1xyXG5cclxuXHRcdG1mcC5pc09wZW4gPSBmYWxzZTtcclxuXHRcdC8vIGZvciBDU1MzIGFuaW1hdGlvblxyXG5cdFx0aWYobWZwLnN0LnJlbW92YWxEZWxheSAmJiAhbWZwLmlzTG93SUUgJiYgbWZwLnN1cHBvcnRzVHJhbnNpdGlvbiApICB7XHJcblx0XHRcdG1mcC5fYWRkQ2xhc3NUb01GUChSRU1PVklOR19DTEFTUyk7XHJcblx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0bWZwLl9jbG9zZSgpO1xyXG5cdFx0XHR9LCBtZnAuc3QucmVtb3ZhbERlbGF5KTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdG1mcC5fY2xvc2UoKTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBIZWxwZXIgZm9yIGNsb3NlKCkgZnVuY3Rpb25cclxuXHQgKi9cclxuXHRfY2xvc2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0X21mcFRyaWdnZXIoQ0xPU0VfRVZFTlQpO1xyXG5cclxuXHRcdHZhciBjbGFzc2VzVG9SZW1vdmUgPSBSRU1PVklOR19DTEFTUyArICcgJyArIFJFQURZX0NMQVNTICsgJyAnO1xyXG5cclxuXHRcdG1mcC5iZ092ZXJsYXkuZGV0YWNoKCk7XHJcblx0XHRtZnAud3JhcC5kZXRhY2goKTtcclxuXHRcdG1mcC5jb250YWluZXIuZW1wdHkoKTtcclxuXHJcblx0XHRpZihtZnAuc3QubWFpbkNsYXNzKSB7XHJcblx0XHRcdGNsYXNzZXNUb1JlbW92ZSArPSBtZnAuc3QubWFpbkNsYXNzICsgJyAnO1xyXG5cdFx0fVxyXG5cclxuXHRcdG1mcC5fcmVtb3ZlQ2xhc3NGcm9tTUZQKGNsYXNzZXNUb1JlbW92ZSk7XHJcblxyXG5cdFx0aWYobWZwLmZpeGVkQ29udGVudFBvcykge1xyXG5cdFx0XHR2YXIgd2luZG93U3R5bGVzID0ge21hcmdpblJpZ2h0OiAnJ307XHJcblx0XHRcdGlmKG1mcC5pc0lFNykge1xyXG5cdFx0XHRcdCQoJ2JvZHksIGh0bWwnKS5jc3MoJ292ZXJmbG93JywgJycpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHdpbmRvd1N0eWxlcy5vdmVyZmxvdyA9ICcnO1xyXG5cdFx0XHR9XHJcblx0XHRcdCQoJ2h0bWwnKS5jc3Mod2luZG93U3R5bGVzKTtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0X2RvY3VtZW50Lm9mZigna2V5dXAnICsgRVZFTlRfTlMgKyAnIGZvY3VzaW4nICsgRVZFTlRfTlMpO1xyXG5cdFx0bWZwLmV2Lm9mZihFVkVOVF9OUyk7XHJcblxyXG5cdFx0Ly8gY2xlYW4gdXAgRE9NIGVsZW1lbnRzIHRoYXQgYXJlbid0IHJlbW92ZWRcclxuXHRcdG1mcC53cmFwLmF0dHIoJ2NsYXNzJywgJ21mcC13cmFwJykucmVtb3ZlQXR0cignc3R5bGUnKTtcclxuXHRcdG1mcC5iZ092ZXJsYXkuYXR0cignY2xhc3MnLCAnbWZwLWJnJyk7XHJcblx0XHRtZnAuY29udGFpbmVyLmF0dHIoJ2NsYXNzJywgJ21mcC1jb250YWluZXInKTtcclxuXHJcblx0XHQvLyByZW1vdmUgY2xvc2UgYnV0dG9uIGZyb20gdGFyZ2V0IGVsZW1lbnRcclxuXHRcdGlmKG1mcC5zdC5zaG93Q2xvc2VCdG4gJiZcclxuXHRcdCghbWZwLnN0LmNsb3NlQnRuSW5zaWRlIHx8IG1mcC5jdXJyVGVtcGxhdGVbbWZwLmN1cnJJdGVtLnR5cGVdID09PSB0cnVlKSkge1xyXG5cdFx0XHRpZihtZnAuY3VyclRlbXBsYXRlLmNsb3NlQnRuKVxyXG5cdFx0XHRcdG1mcC5jdXJyVGVtcGxhdGUuY2xvc2VCdG4uZGV0YWNoKCk7XHJcblx0XHR9XHJcblxyXG5cclxuXHRcdGlmKG1mcC5zdC5hdXRvRm9jdXNMYXN0ICYmIG1mcC5fbGFzdEZvY3VzZWRFbCkge1xyXG5cdFx0XHQkKG1mcC5fbGFzdEZvY3VzZWRFbCkuZm9jdXMoKTsgLy8gcHV0IHRhYiBmb2N1cyBiYWNrXHJcblx0XHR9XHJcblx0XHRtZnAuY3Vyckl0ZW0gPSBudWxsO1x0XHJcblx0XHRtZnAuY29udGVudCA9IG51bGw7XHJcblx0XHRtZnAuY3VyclRlbXBsYXRlID0gbnVsbDtcclxuXHRcdG1mcC5wcmV2SGVpZ2h0ID0gMDtcclxuXHJcblx0XHRfbWZwVHJpZ2dlcihBRlRFUl9DTE9TRV9FVkVOVCk7XHJcblx0fSxcclxuXHRcclxuXHR1cGRhdGVTaXplOiBmdW5jdGlvbih3aW5IZWlnaHQpIHtcclxuXHJcblx0XHRpZihtZnAuaXNJT1MpIHtcclxuXHRcdFx0Ly8gZml4ZXMgaU9TIG5hdiBiYXJzIGh0dHBzOi8vZ2l0aHViLmNvbS9kaW1zZW1lbm92L01hZ25pZmljLVBvcHVwL2lzc3Vlcy8yXHJcblx0XHRcdHZhciB6b29tTGV2ZWwgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggLyB3aW5kb3cuaW5uZXJXaWR0aDtcclxuXHRcdFx0dmFyIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodCAqIHpvb21MZXZlbDtcclxuXHRcdFx0bWZwLndyYXAuY3NzKCdoZWlnaHQnLCBoZWlnaHQpO1xyXG5cdFx0XHRtZnAud0ggPSBoZWlnaHQ7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRtZnAud0ggPSB3aW5IZWlnaHQgfHwgX3dpbmRvdy5oZWlnaHQoKTtcclxuXHRcdH1cclxuXHRcdC8vIEZpeGVzICM4NDogcG9wdXAgaW5jb3JyZWN0bHkgcG9zaXRpb25lZCB3aXRoIHBvc2l0aW9uOnJlbGF0aXZlIG9uIGJvZHlcclxuXHRcdGlmKCFtZnAuZml4ZWRDb250ZW50UG9zKSB7XHJcblx0XHRcdG1mcC53cmFwLmNzcygnaGVpZ2h0JywgbWZwLndIKTtcclxuXHRcdH1cclxuXHJcblx0XHRfbWZwVHJpZ2dlcignUmVzaXplJyk7XHJcblxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIFNldCBjb250ZW50IG9mIHBvcHVwIGJhc2VkIG9uIGN1cnJlbnQgaW5kZXhcclxuXHQgKi9cclxuXHR1cGRhdGVJdGVtSFRNTDogZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgaXRlbSA9IG1mcC5pdGVtc1ttZnAuaW5kZXhdO1xyXG5cclxuXHRcdC8vIERldGFjaCBhbmQgcGVyZm9ybSBtb2RpZmljYXRpb25zXHJcblx0XHRtZnAuY29udGVudENvbnRhaW5lci5kZXRhY2goKTtcclxuXHJcblx0XHRpZihtZnAuY29udGVudClcclxuXHRcdFx0bWZwLmNvbnRlbnQuZGV0YWNoKCk7XHJcblxyXG5cdFx0aWYoIWl0ZW0ucGFyc2VkKSB7XHJcblx0XHRcdGl0ZW0gPSBtZnAucGFyc2VFbCggbWZwLmluZGV4ICk7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIHR5cGUgPSBpdGVtLnR5cGU7XHJcblxyXG5cdFx0X21mcFRyaWdnZXIoJ0JlZm9yZUNoYW5nZScsIFttZnAuY3Vyckl0ZW0gPyBtZnAuY3Vyckl0ZW0udHlwZSA6ICcnLCB0eXBlXSk7XHJcblx0XHQvLyBCZWZvcmVDaGFuZ2UgZXZlbnQgd29ya3MgbGlrZSBzbzpcclxuXHRcdC8vIF9tZnBPbignQmVmb3JlQ2hhbmdlJywgZnVuY3Rpb24oZSwgcHJldlR5cGUsIG5ld1R5cGUpIHsgfSk7XHJcblxyXG5cdFx0bWZwLmN1cnJJdGVtID0gaXRlbTtcclxuXHJcblx0XHRpZighbWZwLmN1cnJUZW1wbGF0ZVt0eXBlXSkge1xyXG5cdFx0XHR2YXIgbWFya3VwID0gbWZwLnN0W3R5cGVdID8gbWZwLnN0W3R5cGVdLm1hcmt1cCA6IGZhbHNlO1xyXG5cclxuXHRcdFx0Ly8gYWxsb3dzIHRvIG1vZGlmeSBtYXJrdXBcclxuXHRcdFx0X21mcFRyaWdnZXIoJ0ZpcnN0TWFya3VwUGFyc2UnLCBtYXJrdXApO1xyXG5cclxuXHRcdFx0aWYobWFya3VwKSB7XHJcblx0XHRcdFx0bWZwLmN1cnJUZW1wbGF0ZVt0eXBlXSA9ICQobWFya3VwKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHQvLyBpZiB0aGVyZSBpcyBubyBtYXJrdXAgZm91bmQgd2UganVzdCBkZWZpbmUgdGhhdCB0ZW1wbGF0ZSBpcyBwYXJzZWRcclxuXHRcdFx0XHRtZnAuY3VyclRlbXBsYXRlW3R5cGVdID0gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmKF9wcmV2Q29udGVudFR5cGUgJiYgX3ByZXZDb250ZW50VHlwZSAhPT0gaXRlbS50eXBlKSB7XHJcblx0XHRcdG1mcC5jb250YWluZXIucmVtb3ZlQ2xhc3MoJ21mcC0nK19wcmV2Q29udGVudFR5cGUrJy1ob2xkZXInKTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgbmV3Q29udGVudCA9IG1mcFsnZ2V0JyArIHR5cGUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0eXBlLnNsaWNlKDEpXShpdGVtLCBtZnAuY3VyclRlbXBsYXRlW3R5cGVdKTtcclxuXHRcdG1mcC5hcHBlbmRDb250ZW50KG5ld0NvbnRlbnQsIHR5cGUpO1xyXG5cclxuXHRcdGl0ZW0ucHJlbG9hZGVkID0gdHJ1ZTtcclxuXHJcblx0XHRfbWZwVHJpZ2dlcihDSEFOR0VfRVZFTlQsIGl0ZW0pO1xyXG5cdFx0X3ByZXZDb250ZW50VHlwZSA9IGl0ZW0udHlwZTtcclxuXHJcblx0XHQvLyBBcHBlbmQgY29udGFpbmVyIGJhY2sgYWZ0ZXIgaXRzIGNvbnRlbnQgY2hhbmdlZFxyXG5cdFx0bWZwLmNvbnRhaW5lci5wcmVwZW5kKG1mcC5jb250ZW50Q29udGFpbmVyKTtcclxuXHJcblx0XHRfbWZwVHJpZ2dlcignQWZ0ZXJDaGFuZ2UnKTtcclxuXHR9LFxyXG5cclxuXHJcblx0LyoqXHJcblx0ICogU2V0IEhUTUwgY29udGVudCBvZiBwb3B1cFxyXG5cdCAqL1xyXG5cdGFwcGVuZENvbnRlbnQ6IGZ1bmN0aW9uKG5ld0NvbnRlbnQsIHR5cGUpIHtcclxuXHRcdG1mcC5jb250ZW50ID0gbmV3Q29udGVudDtcclxuXHJcblx0XHRpZihuZXdDb250ZW50KSB7XHJcblx0XHRcdGlmKG1mcC5zdC5zaG93Q2xvc2VCdG4gJiYgbWZwLnN0LmNsb3NlQnRuSW5zaWRlICYmXHJcblx0XHRcdFx0bWZwLmN1cnJUZW1wbGF0ZVt0eXBlXSA9PT0gdHJ1ZSkge1xyXG5cdFx0XHRcdC8vIGlmIHRoZXJlIGlzIG5vIG1hcmt1cCwgd2UganVzdCBhcHBlbmQgY2xvc2UgYnV0dG9uIGVsZW1lbnQgaW5zaWRlXHJcblx0XHRcdFx0aWYoIW1mcC5jb250ZW50LmZpbmQoJy5tZnAtY2xvc2UnKS5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdG1mcC5jb250ZW50LmFwcGVuZChfZ2V0Q2xvc2VCdG4oKSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdG1mcC5jb250ZW50ID0gbmV3Q29udGVudDtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0bWZwLmNvbnRlbnQgPSAnJztcclxuXHRcdH1cclxuXHJcblx0XHRfbWZwVHJpZ2dlcihCRUZPUkVfQVBQRU5EX0VWRU5UKTtcclxuXHRcdG1mcC5jb250YWluZXIuYWRkQ2xhc3MoJ21mcC0nK3R5cGUrJy1ob2xkZXInKTtcclxuXHJcblx0XHRtZnAuY29udGVudENvbnRhaW5lci5hcHBlbmQobWZwLmNvbnRlbnQpO1xyXG5cdH0sXHJcblxyXG5cclxuXHQvKipcclxuXHQgKiBDcmVhdGVzIE1hZ25pZmljIFBvcHVwIGRhdGEgb2JqZWN0IGJhc2VkIG9uIGdpdmVuIGRhdGFcclxuXHQgKiBAcGFyYW0gIHtpbnR9IGluZGV4IEluZGV4IG9mIGl0ZW0gdG8gcGFyc2VcclxuXHQgKi9cclxuXHRwYXJzZUVsOiBmdW5jdGlvbihpbmRleCkge1xyXG5cdFx0dmFyIGl0ZW0gPSBtZnAuaXRlbXNbaW5kZXhdLFxyXG5cdFx0XHR0eXBlO1xyXG5cclxuXHRcdGlmKGl0ZW0udGFnTmFtZSkge1xyXG5cdFx0XHRpdGVtID0geyBlbDogJChpdGVtKSB9O1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dHlwZSA9IGl0ZW0udHlwZTtcclxuXHRcdFx0aXRlbSA9IHsgZGF0YTogaXRlbSwgc3JjOiBpdGVtLnNyYyB9O1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmKGl0ZW0uZWwpIHtcclxuXHRcdFx0dmFyIHR5cGVzID0gbWZwLnR5cGVzO1xyXG5cclxuXHRcdFx0Ly8gY2hlY2sgZm9yICdtZnAtVFlQRScgY2xhc3NcclxuXHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IHR5cGVzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0aWYoIGl0ZW0uZWwuaGFzQ2xhc3MoJ21mcC0nK3R5cGVzW2ldKSApIHtcclxuXHRcdFx0XHRcdHR5cGUgPSB0eXBlc1tpXTtcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aXRlbS5zcmMgPSBpdGVtLmVsLmF0dHIoJ2RhdGEtbWZwLXNyYycpO1xyXG5cdFx0XHRpZighaXRlbS5zcmMpIHtcclxuXHRcdFx0XHRpdGVtLnNyYyA9IGl0ZW0uZWwuYXR0cignaHJlZicpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aXRlbS50eXBlID0gdHlwZSB8fCBtZnAuc3QudHlwZSB8fCAnaW5saW5lJztcclxuXHRcdGl0ZW0uaW5kZXggPSBpbmRleDtcclxuXHRcdGl0ZW0ucGFyc2VkID0gdHJ1ZTtcclxuXHRcdG1mcC5pdGVtc1tpbmRleF0gPSBpdGVtO1xyXG5cdFx0X21mcFRyaWdnZXIoJ0VsZW1lbnRQYXJzZScsIGl0ZW0pO1xyXG5cclxuXHRcdHJldHVybiBtZnAuaXRlbXNbaW5kZXhdO1xyXG5cdH0sXHJcblxyXG5cclxuXHQvKipcclxuXHQgKiBJbml0aWFsaXplcyBzaW5nbGUgcG9wdXAgb3IgYSBncm91cCBvZiBwb3B1cHNcclxuXHQgKi9cclxuXHRhZGRHcm91cDogZnVuY3Rpb24oZWwsIG9wdGlvbnMpIHtcclxuXHRcdHZhciBlSGFuZGxlciA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0ZS5tZnBFbCA9IHRoaXM7XHJcblx0XHRcdG1mcC5fb3BlbkNsaWNrKGUsIGVsLCBvcHRpb25zKTtcclxuXHRcdH07XHJcblxyXG5cdFx0aWYoIW9wdGlvbnMpIHtcclxuXHRcdFx0b3B0aW9ucyA9IHt9O1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBlTmFtZSA9ICdjbGljay5tYWduaWZpY1BvcHVwJztcclxuXHRcdG9wdGlvbnMubWFpbkVsID0gZWw7XHJcblxyXG5cdFx0aWYob3B0aW9ucy5pdGVtcykge1xyXG5cdFx0XHRvcHRpb25zLmlzT2JqID0gdHJ1ZTtcclxuXHRcdFx0ZWwub2ZmKGVOYW1lKS5vbihlTmFtZSwgZUhhbmRsZXIpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0b3B0aW9ucy5pc09iaiA9IGZhbHNlO1xyXG5cdFx0XHRpZihvcHRpb25zLmRlbGVnYXRlKSB7XHJcblx0XHRcdFx0ZWwub2ZmKGVOYW1lKS5vbihlTmFtZSwgb3B0aW9ucy5kZWxlZ2F0ZSAsIGVIYW5kbGVyKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRvcHRpb25zLml0ZW1zID0gZWw7XHJcblx0XHRcdFx0ZWwub2ZmKGVOYW1lKS5vbihlTmFtZSwgZUhhbmRsZXIpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSxcclxuXHRfb3BlbkNsaWNrOiBmdW5jdGlvbihlLCBlbCwgb3B0aW9ucykge1xyXG5cdFx0dmFyIG1pZENsaWNrID0gb3B0aW9ucy5taWRDbGljayAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5taWRDbGljayA6ICQubWFnbmlmaWNQb3B1cC5kZWZhdWx0cy5taWRDbGljaztcclxuXHJcblxyXG5cdFx0aWYoIW1pZENsaWNrICYmICggZS53aGljaCA9PT0gMiB8fCBlLmN0cmxLZXkgfHwgZS5tZXRhS2V5IHx8IGUuYWx0S2V5IHx8IGUuc2hpZnRLZXkgKSApIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBkaXNhYmxlT24gPSBvcHRpb25zLmRpc2FibGVPbiAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5kaXNhYmxlT24gOiAkLm1hZ25pZmljUG9wdXAuZGVmYXVsdHMuZGlzYWJsZU9uO1xyXG5cclxuXHRcdGlmKGRpc2FibGVPbikge1xyXG5cdFx0XHRpZigkLmlzRnVuY3Rpb24oZGlzYWJsZU9uKSkge1xyXG5cdFx0XHRcdGlmKCAhZGlzYWJsZU9uLmNhbGwobWZwKSApIHtcclxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIHsgLy8gZWxzZSBpdCdzIG51bWJlclxyXG5cdFx0XHRcdGlmKCBfd2luZG93LndpZHRoKCkgPCBkaXNhYmxlT24gKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZihlLnR5cGUpIHtcclxuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0Ly8gVGhpcyB3aWxsIHByZXZlbnQgcG9wdXAgZnJvbSBjbG9zaW5nIGlmIGVsZW1lbnQgaXMgaW5zaWRlIGFuZCBwb3B1cCBpcyBhbHJlYWR5IG9wZW5lZFxyXG5cdFx0XHRpZihtZnAuaXNPcGVuKSB7XHJcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdG9wdGlvbnMuZWwgPSAkKGUubWZwRWwpO1xyXG5cdFx0aWYob3B0aW9ucy5kZWxlZ2F0ZSkge1xyXG5cdFx0XHRvcHRpb25zLml0ZW1zID0gZWwuZmluZChvcHRpb25zLmRlbGVnYXRlKTtcclxuXHRcdH1cclxuXHRcdG1mcC5vcGVuKG9wdGlvbnMpO1xyXG5cdH0sXHJcblxyXG5cclxuXHQvKipcclxuXHQgKiBVcGRhdGVzIHRleHQgb24gcHJlbG9hZGVyXHJcblx0ICovXHJcblx0dXBkYXRlU3RhdHVzOiBmdW5jdGlvbihzdGF0dXMsIHRleHQpIHtcclxuXHJcblx0XHRpZihtZnAucHJlbG9hZGVyKSB7XHJcblx0XHRcdGlmKF9wcmV2U3RhdHVzICE9PSBzdGF0dXMpIHtcclxuXHRcdFx0XHRtZnAuY29udGFpbmVyLnJlbW92ZUNsYXNzKCdtZnAtcy0nK19wcmV2U3RhdHVzKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYoIXRleHQgJiYgc3RhdHVzID09PSAnbG9hZGluZycpIHtcclxuXHRcdFx0XHR0ZXh0ID0gbWZwLnN0LnRMb2FkaW5nO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgZGF0YSA9IHtcclxuXHRcdFx0XHRzdGF0dXM6IHN0YXR1cyxcclxuXHRcdFx0XHR0ZXh0OiB0ZXh0XHJcblx0XHRcdH07XHJcblx0XHRcdC8vIGFsbG93cyB0byBtb2RpZnkgc3RhdHVzXHJcblx0XHRcdF9tZnBUcmlnZ2VyKCdVcGRhdGVTdGF0dXMnLCBkYXRhKTtcclxuXHJcblx0XHRcdHN0YXR1cyA9IGRhdGEuc3RhdHVzO1xyXG5cdFx0XHR0ZXh0ID0gZGF0YS50ZXh0O1xyXG5cclxuXHRcdFx0bWZwLnByZWxvYWRlci5odG1sKHRleHQpO1xyXG5cclxuXHRcdFx0bWZwLnByZWxvYWRlci5maW5kKCdhJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRcdGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0bWZwLmNvbnRhaW5lci5hZGRDbGFzcygnbWZwLXMtJytzdGF0dXMpO1xyXG5cdFx0XHRfcHJldlN0YXR1cyA9IHN0YXR1cztcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHJcblx0LypcclxuXHRcdFwiUHJpdmF0ZVwiIGhlbHBlcnMgdGhhdCBhcmVuJ3QgcHJpdmF0ZSBhdCBhbGxcclxuXHQgKi9cclxuXHQvLyBDaGVjayB0byBjbG9zZSBwb3B1cCBvciBub3RcclxuXHQvLyBcInRhcmdldFwiIGlzIGFuIGVsZW1lbnQgdGhhdCB3YXMgY2xpY2tlZFxyXG5cdF9jaGVja0lmQ2xvc2U6IGZ1bmN0aW9uKHRhcmdldCkge1xyXG5cclxuXHRcdGlmKCQodGFyZ2V0KS5oYXNDbGFzcyhQUkVWRU5UX0NMT1NFX0NMQVNTKSkge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGNsb3NlT25Db250ZW50ID0gbWZwLnN0LmNsb3NlT25Db250ZW50Q2xpY2s7XHJcblx0XHR2YXIgY2xvc2VPbkJnID0gbWZwLnN0LmNsb3NlT25CZ0NsaWNrO1xyXG5cclxuXHRcdGlmKGNsb3NlT25Db250ZW50ICYmIGNsb3NlT25CZykge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH0gZWxzZSB7XHJcblxyXG5cdFx0XHQvLyBXZSBjbG9zZSB0aGUgcG9wdXAgaWYgY2xpY2sgaXMgb24gY2xvc2UgYnV0dG9uIG9yIG9uIHByZWxvYWRlci4gT3IgaWYgdGhlcmUgaXMgbm8gY29udGVudC5cclxuXHRcdFx0aWYoIW1mcC5jb250ZW50IHx8ICQodGFyZ2V0KS5oYXNDbGFzcygnbWZwLWNsb3NlJykgfHwgKG1mcC5wcmVsb2FkZXIgJiYgdGFyZ2V0ID09PSBtZnAucHJlbG9hZGVyWzBdKSApIHtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gaWYgY2xpY2sgaXMgb3V0c2lkZSB0aGUgY29udGVudFxyXG5cdFx0XHRpZiggICh0YXJnZXQgIT09IG1mcC5jb250ZW50WzBdICYmICEkLmNvbnRhaW5zKG1mcC5jb250ZW50WzBdLCB0YXJnZXQpKSAgKSB7XHJcblx0XHRcdFx0aWYoY2xvc2VPbkJnKSB7XHJcblx0XHRcdFx0XHQvLyBsYXN0IGNoZWNrLCBpZiB0aGUgY2xpY2tlZCBlbGVtZW50IGlzIGluIERPTSwgKGluIGNhc2UgaXQncyByZW1vdmVkIG9uY2xpY2spXHJcblx0XHRcdFx0XHRpZiggJC5jb250YWlucyhkb2N1bWVudCwgdGFyZ2V0KSApIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2UgaWYoY2xvc2VPbkNvbnRlbnQpIHtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9LFxyXG5cdF9hZGRDbGFzc1RvTUZQOiBmdW5jdGlvbihjTmFtZSkge1xyXG5cdFx0bWZwLmJnT3ZlcmxheS5hZGRDbGFzcyhjTmFtZSk7XHJcblx0XHRtZnAud3JhcC5hZGRDbGFzcyhjTmFtZSk7XHJcblx0fSxcclxuXHRfcmVtb3ZlQ2xhc3NGcm9tTUZQOiBmdW5jdGlvbihjTmFtZSkge1xyXG5cdFx0dGhpcy5iZ092ZXJsYXkucmVtb3ZlQ2xhc3MoY05hbWUpO1xyXG5cdFx0bWZwLndyYXAucmVtb3ZlQ2xhc3MoY05hbWUpO1xyXG5cdH0sXHJcblx0X2hhc1Njcm9sbEJhcjogZnVuY3Rpb24od2luSGVpZ2h0KSB7XHJcblx0XHRyZXR1cm4gKCAgKG1mcC5pc0lFNyA/IF9kb2N1bWVudC5oZWlnaHQoKSA6IGRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0KSA+ICh3aW5IZWlnaHQgfHwgX3dpbmRvdy5oZWlnaHQoKSkgKTtcclxuXHR9LFxyXG5cdF9zZXRGb2N1czogZnVuY3Rpb24oKSB7XHJcblx0XHQobWZwLnN0LmZvY3VzID8gbWZwLmNvbnRlbnQuZmluZChtZnAuc3QuZm9jdXMpLmVxKDApIDogbWZwLndyYXApLmZvY3VzKCk7XHJcblx0fSxcclxuXHRfb25Gb2N1c0luOiBmdW5jdGlvbihlKSB7XHJcblx0XHRpZiggZS50YXJnZXQgIT09IG1mcC53cmFwWzBdICYmICEkLmNvbnRhaW5zKG1mcC53cmFwWzBdLCBlLnRhcmdldCkgKSB7XHJcblx0XHRcdG1mcC5fc2V0Rm9jdXMoKTtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cdH0sXHJcblx0X3BhcnNlTWFya3VwOiBmdW5jdGlvbih0ZW1wbGF0ZSwgdmFsdWVzLCBpdGVtKSB7XHJcblx0XHR2YXIgYXJyO1xyXG5cdFx0aWYoaXRlbS5kYXRhKSB7XHJcblx0XHRcdHZhbHVlcyA9ICQuZXh0ZW5kKGl0ZW0uZGF0YSwgdmFsdWVzKTtcclxuXHRcdH1cclxuXHRcdF9tZnBUcmlnZ2VyKE1BUktVUF9QQVJTRV9FVkVOVCwgW3RlbXBsYXRlLCB2YWx1ZXMsIGl0ZW1dICk7XHJcblxyXG5cdFx0JC5lYWNoKHZhbHVlcywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG5cdFx0XHRpZih2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBmYWxzZSkge1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFyciA9IGtleS5zcGxpdCgnXycpO1xyXG5cdFx0XHRpZihhcnIubGVuZ3RoID4gMSkge1xyXG5cdFx0XHRcdHZhciBlbCA9IHRlbXBsYXRlLmZpbmQoRVZFTlRfTlMgKyAnLScrYXJyWzBdKTtcclxuXHJcblx0XHRcdFx0aWYoZWwubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRcdFx0dmFyIGF0dHIgPSBhcnJbMV07XHJcblx0XHRcdFx0XHRpZihhdHRyID09PSAncmVwbGFjZVdpdGgnKSB7XHJcblx0XHRcdFx0XHRcdGlmKGVsWzBdICE9PSB2YWx1ZVswXSkge1xyXG5cdFx0XHRcdFx0XHRcdGVsLnJlcGxhY2VXaXRoKHZhbHVlKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSBlbHNlIGlmKGF0dHIgPT09ICdpbWcnKSB7XHJcblx0XHRcdFx0XHRcdGlmKGVsLmlzKCdpbWcnKSkge1xyXG5cdFx0XHRcdFx0XHRcdGVsLmF0dHIoJ3NyYycsIHZhbHVlKTtcclxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRlbC5yZXBsYWNlV2l0aCggJCgnPGltZz4nKS5hdHRyKCdzcmMnLCB2YWx1ZSkuYXR0cignY2xhc3MnLCBlbC5hdHRyKCdjbGFzcycpKSApO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRlbC5hdHRyKGFyclsxXSwgdmFsdWUpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGVtcGxhdGUuZmluZChFVkVOVF9OUyArICctJytrZXkpLmh0bWwodmFsdWUpO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHR9LFxyXG5cclxuXHRfZ2V0U2Nyb2xsYmFyU2l6ZTogZnVuY3Rpb24oKSB7XHJcblx0XHQvLyB0aHggRGF2aWRcclxuXHRcdGlmKG1mcC5zY3JvbGxiYXJTaXplID09PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0dmFyIHNjcm9sbERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcblx0XHRcdHNjcm9sbERpdi5zdHlsZS5jc3NUZXh0ID0gJ3dpZHRoOiA5OXB4OyBoZWlnaHQ6IDk5cHg7IG92ZXJmbG93OiBzY3JvbGw7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAtOTk5OXB4Oyc7XHJcblx0XHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2Nyb2xsRGl2KTtcclxuXHRcdFx0bWZwLnNjcm9sbGJhclNpemUgPSBzY3JvbGxEaXYub2Zmc2V0V2lkdGggLSBzY3JvbGxEaXYuY2xpZW50V2lkdGg7XHJcblx0XHRcdGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoc2Nyb2xsRGl2KTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBtZnAuc2Nyb2xsYmFyU2l6ZTtcclxuXHR9XHJcblxyXG59OyAvKiBNYWduaWZpY1BvcHVwIGNvcmUgcHJvdG90eXBlIGVuZCAqL1xyXG5cclxuXHJcblxyXG5cclxuLyoqXHJcbiAqIFB1YmxpYyBzdGF0aWMgZnVuY3Rpb25zXHJcbiAqL1xyXG4kLm1hZ25pZmljUG9wdXAgPSB7XHJcblx0aW5zdGFuY2U6IG51bGwsXHJcblx0cHJvdG86IE1hZ25pZmljUG9wdXAucHJvdG90eXBlLFxyXG5cdG1vZHVsZXM6IFtdLFxyXG5cclxuXHRvcGVuOiBmdW5jdGlvbihvcHRpb25zLCBpbmRleCkge1xyXG5cdFx0X2NoZWNrSW5zdGFuY2UoKTtcclxuXHJcblx0XHRpZighb3B0aW9ucykge1xyXG5cdFx0XHRvcHRpb25zID0ge307XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIG9wdGlvbnMpO1xyXG5cdFx0fVxyXG5cclxuXHRcdG9wdGlvbnMuaXNPYmogPSB0cnVlO1xyXG5cdFx0b3B0aW9ucy5pbmRleCA9IGluZGV4IHx8IDA7XHJcblx0XHRyZXR1cm4gdGhpcy5pbnN0YW5jZS5vcGVuKG9wdGlvbnMpO1xyXG5cdH0sXHJcblxyXG5cdGNsb3NlOiBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiAkLm1hZ25pZmljUG9wdXAuaW5zdGFuY2UgJiYgJC5tYWduaWZpY1BvcHVwLmluc3RhbmNlLmNsb3NlKCk7XHJcblx0fSxcclxuXHJcblx0cmVnaXN0ZXJNb2R1bGU6IGZ1bmN0aW9uKG5hbWUsIG1vZHVsZSkge1xyXG5cdFx0aWYobW9kdWxlLm9wdGlvbnMpIHtcclxuXHRcdFx0JC5tYWduaWZpY1BvcHVwLmRlZmF1bHRzW25hbWVdID0gbW9kdWxlLm9wdGlvbnM7XHJcblx0XHR9XHJcblx0XHQkLmV4dGVuZCh0aGlzLnByb3RvLCBtb2R1bGUucHJvdG8pO1xyXG5cdFx0dGhpcy5tb2R1bGVzLnB1c2gobmFtZSk7XHJcblx0fSxcclxuXHJcblx0ZGVmYXVsdHM6IHtcclxuXHJcblx0XHQvLyBJbmZvIGFib3V0IG9wdGlvbnMgaXMgaW4gZG9jczpcclxuXHRcdC8vIGh0dHA6Ly9kaW1zZW1lbm92LmNvbS9wbHVnaW5zL21hZ25pZmljLXBvcHVwL2RvY3VtZW50YXRpb24uaHRtbCNvcHRpb25zXHJcblxyXG5cdFx0ZGlzYWJsZU9uOiAwLFxyXG5cclxuXHRcdGtleTogbnVsbCxcclxuXHJcblx0XHRtaWRDbGljazogZmFsc2UsXHJcblxyXG5cdFx0bWFpbkNsYXNzOiAnJyxcclxuXHJcblx0XHRwcmVsb2FkZXI6IHRydWUsXHJcblxyXG5cdFx0Zm9jdXM6ICcnLCAvLyBDU1Mgc2VsZWN0b3Igb2YgaW5wdXQgdG8gZm9jdXMgYWZ0ZXIgcG9wdXAgaXMgb3BlbmVkXHJcblxyXG5cdFx0Y2xvc2VPbkNvbnRlbnRDbGljazogZmFsc2UsXHJcblxyXG5cdFx0Y2xvc2VPbkJnQ2xpY2s6IHRydWUsXHJcblxyXG5cdFx0Y2xvc2VCdG5JbnNpZGU6IHRydWUsXHJcblxyXG5cdFx0c2hvd0Nsb3NlQnRuOiB0cnVlLFxyXG5cclxuXHRcdGVuYWJsZUVzY2FwZUtleTogdHJ1ZSxcclxuXHJcblx0XHRtb2RhbDogZmFsc2UsXHJcblxyXG5cdFx0YWxpZ25Ub3A6IGZhbHNlLFxyXG5cclxuXHRcdHJlbW92YWxEZWxheTogMCxcclxuXHJcblx0XHRwcmVwZW5kVG86IG51bGwsXHJcblxyXG5cdFx0Zml4ZWRDb250ZW50UG9zOiAnYXV0bycsXHJcblxyXG5cdFx0Zml4ZWRCZ1BvczogJ2F1dG8nLFxyXG5cclxuXHRcdG92ZXJmbG93WTogJ2F1dG8nLFxyXG5cclxuXHRcdGNsb3NlTWFya3VwOiAnPGJ1dHRvbiB0aXRsZT1cIiV0aXRsZSVcIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJtZnAtY2xvc2VcIj4mIzIxNTs8L2J1dHRvbj4nLFxyXG5cclxuXHRcdHRDbG9zZTogJ0Nsb3NlIChFc2MpJyxcclxuXHJcblx0XHR0TG9hZGluZzogJ0xvYWRpbmcuLi4nLFxyXG5cclxuXHRcdGF1dG9Gb2N1c0xhc3Q6IHRydWVcclxuXHJcblx0fVxyXG59O1xyXG5cclxuXHJcblxyXG4kLmZuLm1hZ25pZmljUG9wdXAgPSBmdW5jdGlvbihvcHRpb25zKSB7XHJcblx0X2NoZWNrSW5zdGFuY2UoKTtcclxuXHJcblx0dmFyIGpxRWwgPSAkKHRoaXMpO1xyXG5cclxuXHQvLyBXZSBjYWxsIHNvbWUgQVBJIG1ldGhvZCBvZiBmaXJzdCBwYXJhbSBpcyBhIHN0cmluZ1xyXG5cdGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJzdHJpbmdcIiApIHtcclxuXHJcblx0XHRpZihvcHRpb25zID09PSAnb3BlbicpIHtcclxuXHRcdFx0dmFyIGl0ZW1zLFxyXG5cdFx0XHRcdGl0ZW1PcHRzID0gX2lzSlEgPyBqcUVsLmRhdGEoJ21hZ25pZmljUG9wdXAnKSA6IGpxRWxbMF0ubWFnbmlmaWNQb3B1cCxcclxuXHRcdFx0XHRpbmRleCA9IHBhcnNlSW50KGFyZ3VtZW50c1sxXSwgMTApIHx8IDA7XHJcblxyXG5cdFx0XHRpZihpdGVtT3B0cy5pdGVtcykge1xyXG5cdFx0XHRcdGl0ZW1zID0gaXRlbU9wdHMuaXRlbXNbaW5kZXhdO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGl0ZW1zID0ganFFbDtcclxuXHRcdFx0XHRpZihpdGVtT3B0cy5kZWxlZ2F0ZSkge1xyXG5cdFx0XHRcdFx0aXRlbXMgPSBpdGVtcy5maW5kKGl0ZW1PcHRzLmRlbGVnYXRlKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aXRlbXMgPSBpdGVtcy5lcSggaW5kZXggKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRtZnAuX29wZW5DbGljayh7bWZwRWw6aXRlbXN9LCBqcUVsLCBpdGVtT3B0cyk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRpZihtZnAuaXNPcGVuKVxyXG5cdFx0XHRcdG1mcFtvcHRpb25zXS5hcHBseShtZnAsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xyXG5cdFx0fVxyXG5cclxuXHR9IGVsc2Uge1xyXG5cdFx0Ly8gY2xvbmUgb3B0aW9ucyBvYmpcclxuXHRcdG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgb3B0aW9ucyk7XHJcblxyXG5cdFx0LypcclxuXHRcdCAqIEFzIFplcHRvIGRvZXNuJ3Qgc3VwcG9ydCAuZGF0YSgpIG1ldGhvZCBmb3Igb2JqZWN0c1xyXG5cdFx0ICogYW5kIGl0IHdvcmtzIG9ubHkgaW4gbm9ybWFsIGJyb3dzZXJzXHJcblx0XHQgKiB3ZSBhc3NpZ24gXCJvcHRpb25zXCIgb2JqZWN0IGRpcmVjdGx5IHRvIHRoZSBET00gZWxlbWVudC4gRlRXIVxyXG5cdFx0ICovXHJcblx0XHRpZihfaXNKUSkge1xyXG5cdFx0XHRqcUVsLmRhdGEoJ21hZ25pZmljUG9wdXAnLCBvcHRpb25zKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGpxRWxbMF0ubWFnbmlmaWNQb3B1cCA9IG9wdGlvbnM7XHJcblx0XHR9XHJcblxyXG5cdFx0bWZwLmFkZEdyb3VwKGpxRWwsIG9wdGlvbnMpO1xyXG5cclxuXHR9XHJcblx0cmV0dXJuIGpxRWw7XHJcbn07XHJcblxyXG4vKj4+Y29yZSovXHJcblxyXG4vKj4+aW5saW5lKi9cclxuXHJcbnZhciBJTkxJTkVfTlMgPSAnaW5saW5lJyxcclxuXHRfaGlkZGVuQ2xhc3MsXHJcblx0X2lubGluZVBsYWNlaG9sZGVyLFxyXG5cdF9sYXN0SW5saW5lRWxlbWVudCxcclxuXHRfcHV0SW5saW5lRWxlbWVudHNCYWNrID0gZnVuY3Rpb24oKSB7XHJcblx0XHRpZihfbGFzdElubGluZUVsZW1lbnQpIHtcclxuXHRcdFx0X2lubGluZVBsYWNlaG9sZGVyLmFmdGVyKCBfbGFzdElubGluZUVsZW1lbnQuYWRkQ2xhc3MoX2hpZGRlbkNsYXNzKSApLmRldGFjaCgpO1xyXG5cdFx0XHRfbGFzdElubGluZUVsZW1lbnQgPSBudWxsO1xyXG5cdFx0fVxyXG5cdH07XHJcblxyXG4kLm1hZ25pZmljUG9wdXAucmVnaXN0ZXJNb2R1bGUoSU5MSU5FX05TLCB7XHJcblx0b3B0aW9uczoge1xyXG5cdFx0aGlkZGVuQ2xhc3M6ICdoaWRlJywgLy8gd2lsbCBiZSBhcHBlbmRlZCB3aXRoIGBtZnAtYCBwcmVmaXhcclxuXHRcdG1hcmt1cDogJycsXHJcblx0XHR0Tm90Rm91bmQ6ICdDb250ZW50IG5vdCBmb3VuZCdcclxuXHR9LFxyXG5cdHByb3RvOiB7XHJcblxyXG5cdFx0aW5pdElubGluZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdG1mcC50eXBlcy5wdXNoKElOTElORV9OUyk7XHJcblxyXG5cdFx0XHRfbWZwT24oQ0xPU0VfRVZFTlQrJy4nK0lOTElORV9OUywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0X3B1dElubGluZUVsZW1lbnRzQmFjaygpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0sXHJcblxyXG5cdFx0Z2V0SW5saW5lOiBmdW5jdGlvbihpdGVtLCB0ZW1wbGF0ZSkge1xyXG5cclxuXHRcdFx0X3B1dElubGluZUVsZW1lbnRzQmFjaygpO1xyXG5cclxuXHRcdFx0aWYoaXRlbS5zcmMpIHtcclxuXHRcdFx0XHR2YXIgaW5saW5lU3QgPSBtZnAuc3QuaW5saW5lLFxyXG5cdFx0XHRcdFx0ZWwgPSAkKGl0ZW0uc3JjKTtcclxuXHJcblx0XHRcdFx0aWYoZWwubGVuZ3RoKSB7XHJcblxyXG5cdFx0XHRcdFx0Ly8gSWYgdGFyZ2V0IGVsZW1lbnQgaGFzIHBhcmVudCAtIHdlIHJlcGxhY2UgaXQgd2l0aCBwbGFjZWhvbGRlciBhbmQgcHV0IGl0IGJhY2sgYWZ0ZXIgcG9wdXAgaXMgY2xvc2VkXHJcblx0XHRcdFx0XHR2YXIgcGFyZW50ID0gZWxbMF0ucGFyZW50Tm9kZTtcclxuXHRcdFx0XHRcdGlmKHBhcmVudCAmJiBwYXJlbnQudGFnTmFtZSkge1xyXG5cdFx0XHRcdFx0XHRpZighX2lubGluZVBsYWNlaG9sZGVyKSB7XHJcblx0XHRcdFx0XHRcdFx0X2hpZGRlbkNsYXNzID0gaW5saW5lU3QuaGlkZGVuQ2xhc3M7XHJcblx0XHRcdFx0XHRcdFx0X2lubGluZVBsYWNlaG9sZGVyID0gX2dldEVsKF9oaWRkZW5DbGFzcyk7XHJcblx0XHRcdFx0XHRcdFx0X2hpZGRlbkNsYXNzID0gJ21mcC0nK19oaWRkZW5DbGFzcztcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHQvLyByZXBsYWNlIHRhcmdldCBpbmxpbmUgZWxlbWVudCB3aXRoIHBsYWNlaG9sZGVyXHJcblx0XHRcdFx0XHRcdF9sYXN0SW5saW5lRWxlbWVudCA9IGVsLmFmdGVyKF9pbmxpbmVQbGFjZWhvbGRlcikuZGV0YWNoKCkucmVtb3ZlQ2xhc3MoX2hpZGRlbkNsYXNzKTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRtZnAudXBkYXRlU3RhdHVzKCdyZWFkeScpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRtZnAudXBkYXRlU3RhdHVzKCdlcnJvcicsIGlubGluZVN0LnROb3RGb3VuZCk7XHJcblx0XHRcdFx0XHRlbCA9ICQoJzxkaXY+Jyk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpdGVtLmlubGluZUVsZW1lbnQgPSBlbDtcclxuXHRcdFx0XHRyZXR1cm4gZWw7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdG1mcC51cGRhdGVTdGF0dXMoJ3JlYWR5Jyk7XHJcblx0XHRcdG1mcC5fcGFyc2VNYXJrdXAodGVtcGxhdGUsIHt9LCBpdGVtKTtcclxuXHRcdFx0cmV0dXJuIHRlbXBsYXRlO1xyXG5cdFx0fVxyXG5cdH1cclxufSk7XHJcblxyXG4vKj4+aW5saW5lKi9cclxuXHJcbi8qPj5hamF4Ki9cclxudmFyIEFKQVhfTlMgPSAnYWpheCcsXHJcblx0X2FqYXhDdXIsXHJcblx0X3JlbW92ZUFqYXhDdXJzb3IgPSBmdW5jdGlvbigpIHtcclxuXHRcdGlmKF9hamF4Q3VyKSB7XHJcblx0XHRcdCQoZG9jdW1lbnQuYm9keSkucmVtb3ZlQ2xhc3MoX2FqYXhDdXIpO1xyXG5cdFx0fVxyXG5cdH0sXHJcblx0X2Rlc3Ryb3lBamF4UmVxdWVzdCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0X3JlbW92ZUFqYXhDdXJzb3IoKTtcclxuXHRcdGlmKG1mcC5yZXEpIHtcclxuXHRcdFx0bWZwLnJlcS5hYm9ydCgpO1xyXG5cdFx0fVxyXG5cdH07XHJcblxyXG4kLm1hZ25pZmljUG9wdXAucmVnaXN0ZXJNb2R1bGUoQUpBWF9OUywge1xyXG5cclxuXHRvcHRpb25zOiB7XHJcblx0XHRzZXR0aW5nczogbnVsbCxcclxuXHRcdGN1cnNvcjogJ21mcC1hamF4LWN1cicsXHJcblx0XHR0RXJyb3I6ICc8YSBocmVmPVwiJXVybCVcIj5UaGUgY29udGVudDwvYT4gY291bGQgbm90IGJlIGxvYWRlZC4nXHJcblx0fSxcclxuXHJcblx0cHJvdG86IHtcclxuXHRcdGluaXRBamF4OiBmdW5jdGlvbigpIHtcclxuXHRcdFx0bWZwLnR5cGVzLnB1c2goQUpBWF9OUyk7XHJcblx0XHRcdF9hamF4Q3VyID0gbWZwLnN0LmFqYXguY3Vyc29yO1xyXG5cclxuXHRcdFx0X21mcE9uKENMT1NFX0VWRU5UKycuJytBSkFYX05TLCBfZGVzdHJveUFqYXhSZXF1ZXN0KTtcclxuXHRcdFx0X21mcE9uKCdCZWZvcmVDaGFuZ2UuJyArIEFKQVhfTlMsIF9kZXN0cm95QWpheFJlcXVlc3QpO1xyXG5cdFx0fSxcclxuXHRcdGdldEFqYXg6IGZ1bmN0aW9uKGl0ZW0pIHtcclxuXHJcblx0XHRcdGlmKF9hamF4Q3VyKSB7XHJcblx0XHRcdFx0JChkb2N1bWVudC5ib2R5KS5hZGRDbGFzcyhfYWpheEN1cik7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdG1mcC51cGRhdGVTdGF0dXMoJ2xvYWRpbmcnKTtcclxuXHJcblx0XHRcdHZhciBvcHRzID0gJC5leHRlbmQoe1xyXG5cdFx0XHRcdHVybDogaXRlbS5zcmMsXHJcblx0XHRcdFx0c3VjY2VzczogZnVuY3Rpb24oZGF0YSwgdGV4dFN0YXR1cywganFYSFIpIHtcclxuXHRcdFx0XHRcdHZhciB0ZW1wID0ge1xyXG5cdFx0XHRcdFx0XHRkYXRhOmRhdGEsXHJcblx0XHRcdFx0XHRcdHhocjpqcVhIUlxyXG5cdFx0XHRcdFx0fTtcclxuXHJcblx0XHRcdFx0XHRfbWZwVHJpZ2dlcignUGFyc2VBamF4JywgdGVtcCk7XHJcblxyXG5cdFx0XHRcdFx0bWZwLmFwcGVuZENvbnRlbnQoICQodGVtcC5kYXRhKSwgQUpBWF9OUyApO1xyXG5cclxuXHRcdFx0XHRcdGl0ZW0uZmluaXNoZWQgPSB0cnVlO1xyXG5cclxuXHRcdFx0XHRcdF9yZW1vdmVBamF4Q3Vyc29yKCk7XHJcblxyXG5cdFx0XHRcdFx0bWZwLl9zZXRGb2N1cygpO1xyXG5cclxuXHRcdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdG1mcC53cmFwLmFkZENsYXNzKFJFQURZX0NMQVNTKTtcclxuXHRcdFx0XHRcdH0sIDE2KTtcclxuXHJcblx0XHRcdFx0XHRtZnAudXBkYXRlU3RhdHVzKCdyZWFkeScpO1xyXG5cclxuXHRcdFx0XHRcdF9tZnBUcmlnZ2VyKCdBamF4Q29udGVudEFkZGVkJyk7XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRlcnJvcjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRfcmVtb3ZlQWpheEN1cnNvcigpO1xyXG5cdFx0XHRcdFx0aXRlbS5maW5pc2hlZCA9IGl0ZW0ubG9hZEVycm9yID0gdHJ1ZTtcclxuXHRcdFx0XHRcdG1mcC51cGRhdGVTdGF0dXMoJ2Vycm9yJywgbWZwLnN0LmFqYXgudEVycm9yLnJlcGxhY2UoJyV1cmwlJywgaXRlbS5zcmMpKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0sIG1mcC5zdC5hamF4LnNldHRpbmdzKTtcclxuXHJcblx0XHRcdG1mcC5yZXEgPSAkLmFqYXgob3B0cyk7XHJcblxyXG5cdFx0XHRyZXR1cm4gJyc7XHJcblx0XHR9XHJcblx0fVxyXG59KTtcclxuXHJcbi8qPj5hamF4Ki9cclxuXHJcbi8qPj5pbWFnZSovXHJcbnZhciBfaW1nSW50ZXJ2YWwsXHJcblx0X2dldFRpdGxlID0gZnVuY3Rpb24oaXRlbSkge1xyXG5cdFx0aWYoaXRlbS5kYXRhICYmIGl0ZW0uZGF0YS50aXRsZSAhPT0gdW5kZWZpbmVkKVxyXG5cdFx0XHRyZXR1cm4gaXRlbS5kYXRhLnRpdGxlO1xyXG5cclxuXHRcdHZhciBzcmMgPSBtZnAuc3QuaW1hZ2UudGl0bGVTcmM7XHJcblxyXG5cdFx0aWYoc3JjKSB7XHJcblx0XHRcdGlmKCQuaXNGdW5jdGlvbihzcmMpKSB7XHJcblx0XHRcdFx0cmV0dXJuIHNyYy5jYWxsKG1mcCwgaXRlbSk7XHJcblx0XHRcdH0gZWxzZSBpZihpdGVtLmVsKSB7XHJcblx0XHRcdFx0cmV0dXJuIGl0ZW0uZWwuYXR0cihzcmMpIHx8ICcnO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gJyc7XHJcblx0fTtcclxuXHJcbiQubWFnbmlmaWNQb3B1cC5yZWdpc3Rlck1vZHVsZSgnaW1hZ2UnLCB7XHJcblxyXG5cdG9wdGlvbnM6IHtcclxuXHRcdG1hcmt1cDogJzxkaXYgY2xhc3M9XCJtZnAtZmlndXJlXCI+JytcclxuXHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwibWZwLWNsb3NlXCI+PC9kaXY+JytcclxuXHRcdFx0XHRcdCc8ZmlndXJlPicrXHJcblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwibWZwLWltZ1wiPjwvZGl2PicrXHJcblx0XHRcdFx0XHRcdCc8ZmlnY2FwdGlvbj4nK1xyXG5cdFx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwibWZwLWJvdHRvbS1iYXJcIj4nK1xyXG5cdFx0XHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJtZnAtdGl0bGVcIj48L2Rpdj4nK1xyXG5cdFx0XHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJtZnAtY291bnRlclwiPjwvZGl2PicrXHJcblx0XHRcdFx0XHRcdFx0JzwvZGl2PicrXHJcblx0XHRcdFx0XHRcdCc8L2ZpZ2NhcHRpb24+JytcclxuXHRcdFx0XHRcdCc8L2ZpZ3VyZT4nK1xyXG5cdFx0XHRcdCc8L2Rpdj4nLFxyXG5cdFx0Y3Vyc29yOiAnbWZwLXpvb20tb3V0LWN1cicsXHJcblx0XHR0aXRsZVNyYzogJ3RpdGxlJyxcclxuXHRcdHZlcnRpY2FsRml0OiB0cnVlLFxyXG5cdFx0dEVycm9yOiAnPGEgaHJlZj1cIiV1cmwlXCI+VGhlIGltYWdlPC9hPiBjb3VsZCBub3QgYmUgbG9hZGVkLidcclxuXHR9LFxyXG5cclxuXHRwcm90bzoge1xyXG5cdFx0aW5pdEltYWdlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIGltZ1N0ID0gbWZwLnN0LmltYWdlLFxyXG5cdFx0XHRcdG5zID0gJy5pbWFnZSc7XHJcblxyXG5cdFx0XHRtZnAudHlwZXMucHVzaCgnaW1hZ2UnKTtcclxuXHJcblx0XHRcdF9tZnBPbihPUEVOX0VWRU5UK25zLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRpZihtZnAuY3Vyckl0ZW0udHlwZSA9PT0gJ2ltYWdlJyAmJiBpbWdTdC5jdXJzb3IpIHtcclxuXHRcdFx0XHRcdCQoZG9jdW1lbnQuYm9keSkuYWRkQ2xhc3MoaW1nU3QuY3Vyc29yKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0X21mcE9uKENMT1NFX0VWRU5UK25zLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRpZihpbWdTdC5jdXJzb3IpIHtcclxuXHRcdFx0XHRcdCQoZG9jdW1lbnQuYm9keSkucmVtb3ZlQ2xhc3MoaW1nU3QuY3Vyc29yKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0X3dpbmRvdy5vZmYoJ3Jlc2l6ZScgKyBFVkVOVF9OUyk7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0X21mcE9uKCdSZXNpemUnK25zLCBtZnAucmVzaXplSW1hZ2UpO1xyXG5cdFx0XHRpZihtZnAuaXNMb3dJRSkge1xyXG5cdFx0XHRcdF9tZnBPbignQWZ0ZXJDaGFuZ2UnLCBtZnAucmVzaXplSW1hZ2UpO1xyXG5cdFx0XHR9XHJcblx0XHR9LFxyXG5cdFx0cmVzaXplSW1hZ2U6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgaXRlbSA9IG1mcC5jdXJySXRlbTtcclxuXHRcdFx0aWYoIWl0ZW0gfHwgIWl0ZW0uaW1nKSByZXR1cm47XHJcblxyXG5cdFx0XHRpZihtZnAuc3QuaW1hZ2UudmVydGljYWxGaXQpIHtcclxuXHRcdFx0XHR2YXIgZGVjciA9IDA7XHJcblx0XHRcdFx0Ly8gZml4IGJveC1zaXppbmcgaW4gaWU3LzhcclxuXHRcdFx0XHRpZihtZnAuaXNMb3dJRSkge1xyXG5cdFx0XHRcdFx0ZGVjciA9IHBhcnNlSW50KGl0ZW0uaW1nLmNzcygncGFkZGluZy10b3AnKSwgMTApICsgcGFyc2VJbnQoaXRlbS5pbWcuY3NzKCdwYWRkaW5nLWJvdHRvbScpLDEwKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aXRlbS5pbWcuY3NzKCdtYXgtaGVpZ2h0JywgbWZwLndILWRlY3IpO1xyXG5cdFx0XHR9XHJcblx0XHR9LFxyXG5cdFx0X29uSW1hZ2VIYXNTaXplOiBmdW5jdGlvbihpdGVtKSB7XHJcblx0XHRcdGlmKGl0ZW0uaW1nKSB7XHJcblxyXG5cdFx0XHRcdGl0ZW0uaGFzU2l6ZSA9IHRydWU7XHJcblxyXG5cdFx0XHRcdGlmKF9pbWdJbnRlcnZhbCkge1xyXG5cdFx0XHRcdFx0Y2xlYXJJbnRlcnZhbChfaW1nSW50ZXJ2YWwpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aXRlbS5pc0NoZWNraW5nSW1nU2l6ZSA9IGZhbHNlO1xyXG5cclxuXHRcdFx0XHRfbWZwVHJpZ2dlcignSW1hZ2VIYXNTaXplJywgaXRlbSk7XHJcblxyXG5cdFx0XHRcdGlmKGl0ZW0uaW1nSGlkZGVuKSB7XHJcblx0XHRcdFx0XHRpZihtZnAuY29udGVudClcclxuXHRcdFx0XHRcdFx0bWZwLmNvbnRlbnQucmVtb3ZlQ2xhc3MoJ21mcC1sb2FkaW5nJyk7XHJcblxyXG5cdFx0XHRcdFx0aXRlbS5pbWdIaWRkZW4gPSBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblx0XHR9LFxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogRnVuY3Rpb24gdGhhdCBsb29wcyB1bnRpbCB0aGUgaW1hZ2UgaGFzIHNpemUgdG8gZGlzcGxheSBlbGVtZW50cyB0aGF0IHJlbHkgb24gaXQgYXNhcFxyXG5cdFx0ICovXHJcblx0XHRmaW5kSW1hZ2VTaXplOiBmdW5jdGlvbihpdGVtKSB7XHJcblxyXG5cdFx0XHR2YXIgY291bnRlciA9IDAsXHJcblx0XHRcdFx0aW1nID0gaXRlbS5pbWdbMF0sXHJcblx0XHRcdFx0bWZwU2V0SW50ZXJ2YWwgPSBmdW5jdGlvbihkZWxheSkge1xyXG5cclxuXHRcdFx0XHRcdGlmKF9pbWdJbnRlcnZhbCkge1xyXG5cdFx0XHRcdFx0XHRjbGVhckludGVydmFsKF9pbWdJbnRlcnZhbCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvLyBkZWNlbGVyYXRpbmcgaW50ZXJ2YWwgdGhhdCBjaGVja3MgZm9yIHNpemUgb2YgYW4gaW1hZ2VcclxuXHRcdFx0XHRcdF9pbWdJbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRpZihpbWcubmF0dXJhbFdpZHRoID4gMCkge1xyXG5cdFx0XHRcdFx0XHRcdG1mcC5fb25JbWFnZUhhc1NpemUoaXRlbSk7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRpZihjb3VudGVyID4gMjAwKSB7XHJcblx0XHRcdFx0XHRcdFx0Y2xlYXJJbnRlcnZhbChfaW1nSW50ZXJ2YWwpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRjb3VudGVyKys7XHJcblx0XHRcdFx0XHRcdGlmKGNvdW50ZXIgPT09IDMpIHtcclxuXHRcdFx0XHRcdFx0XHRtZnBTZXRJbnRlcnZhbCgxMCk7XHJcblx0XHRcdFx0XHRcdH0gZWxzZSBpZihjb3VudGVyID09PSA0MCkge1xyXG5cdFx0XHRcdFx0XHRcdG1mcFNldEludGVydmFsKDUwKTtcclxuXHRcdFx0XHRcdFx0fSBlbHNlIGlmKGNvdW50ZXIgPT09IDEwMCkge1xyXG5cdFx0XHRcdFx0XHRcdG1mcFNldEludGVydmFsKDUwMCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0sIGRlbGF5KTtcclxuXHRcdFx0XHR9O1xyXG5cclxuXHRcdFx0bWZwU2V0SW50ZXJ2YWwoMSk7XHJcblx0XHR9LFxyXG5cclxuXHRcdGdldEltYWdlOiBmdW5jdGlvbihpdGVtLCB0ZW1wbGF0ZSkge1xyXG5cclxuXHRcdFx0dmFyIGd1YXJkID0gMCxcclxuXHJcblx0XHRcdFx0Ly8gaW1hZ2UgbG9hZCBjb21wbGV0ZSBoYW5kbGVyXHJcblx0XHRcdFx0b25Mb2FkQ29tcGxldGUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdGlmKGl0ZW0pIHtcclxuXHRcdFx0XHRcdFx0aWYgKGl0ZW0uaW1nWzBdLmNvbXBsZXRlKSB7XHJcblx0XHRcdFx0XHRcdFx0aXRlbS5pbWcub2ZmKCcubWZwbG9hZGVyJyk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmKGl0ZW0gPT09IG1mcC5jdXJySXRlbSl7XHJcblx0XHRcdFx0XHRcdFx0XHRtZnAuX29uSW1hZ2VIYXNTaXplKGl0ZW0pO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdG1mcC51cGRhdGVTdGF0dXMoJ3JlYWR5Jyk7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0XHRpdGVtLmhhc1NpemUgPSB0cnVlO1xyXG5cdFx0XHRcdFx0XHRcdGl0ZW0ubG9hZGVkID0gdHJ1ZTtcclxuXHJcblx0XHRcdFx0XHRcdFx0X21mcFRyaWdnZXIoJ0ltYWdlTG9hZENvbXBsZXRlJyk7XHJcblxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdC8vIGlmIGltYWdlIGNvbXBsZXRlIGNoZWNrIGZhaWxzIDIwMCB0aW1lcyAoMjAgc2VjKSwgd2UgYXNzdW1lIHRoYXQgdGhlcmUgd2FzIGFuIGVycm9yLlxyXG5cdFx0XHRcdFx0XHRcdGd1YXJkKys7XHJcblx0XHRcdFx0XHRcdFx0aWYoZ3VhcmQgPCAyMDApIHtcclxuXHRcdFx0XHRcdFx0XHRcdHNldFRpbWVvdXQob25Mb2FkQ29tcGxldGUsMTAwKTtcclxuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdFx0b25Mb2FkRXJyb3IoKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9LFxyXG5cclxuXHRcdFx0XHQvLyBpbWFnZSBlcnJvciBoYW5kbGVyXHJcblx0XHRcdFx0b25Mb2FkRXJyb3IgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdGlmKGl0ZW0pIHtcclxuXHRcdFx0XHRcdFx0aXRlbS5pbWcub2ZmKCcubWZwbG9hZGVyJyk7XHJcblx0XHRcdFx0XHRcdGlmKGl0ZW0gPT09IG1mcC5jdXJySXRlbSl7XHJcblx0XHRcdFx0XHRcdFx0bWZwLl9vbkltYWdlSGFzU2l6ZShpdGVtKTtcclxuXHRcdFx0XHRcdFx0XHRtZnAudXBkYXRlU3RhdHVzKCdlcnJvcicsIGltZ1N0LnRFcnJvci5yZXBsYWNlKCcldXJsJScsIGl0ZW0uc3JjKSApO1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRpdGVtLmhhc1NpemUgPSB0cnVlO1xyXG5cdFx0XHRcdFx0XHRpdGVtLmxvYWRlZCA9IHRydWU7XHJcblx0XHRcdFx0XHRcdGl0ZW0ubG9hZEVycm9yID0gdHJ1ZTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdGltZ1N0ID0gbWZwLnN0LmltYWdlO1xyXG5cclxuXHJcblx0XHRcdHZhciBlbCA9IHRlbXBsYXRlLmZpbmQoJy5tZnAtaW1nJyk7XHJcblx0XHRcdGlmKGVsLmxlbmd0aCkge1xyXG5cdFx0XHRcdHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuXHRcdFx0XHRpbWcuY2xhc3NOYW1lID0gJ21mcC1pbWcnO1xyXG5cdFx0XHRcdGlmKGl0ZW0uZWwgJiYgaXRlbS5lbC5maW5kKCdpbWcnKS5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdGltZy5hbHQgPSBpdGVtLmVsLmZpbmQoJ2ltZycpLmF0dHIoJ2FsdCcpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpdGVtLmltZyA9ICQoaW1nKS5vbignbG9hZC5tZnBsb2FkZXInLCBvbkxvYWRDb21wbGV0ZSkub24oJ2Vycm9yLm1mcGxvYWRlcicsIG9uTG9hZEVycm9yKTtcclxuXHRcdFx0XHRpbWcuc3JjID0gaXRlbS5zcmM7XHJcblxyXG5cdFx0XHRcdC8vIHdpdGhvdXQgY2xvbmUoKSBcImVycm9yXCIgZXZlbnQgaXMgbm90IGZpcmluZyB3aGVuIElNRyBpcyByZXBsYWNlZCBieSBuZXcgSU1HXHJcblx0XHRcdFx0Ly8gVE9ETzogZmluZCBhIHdheSB0byBhdm9pZCBzdWNoIGNsb25pbmdcclxuXHRcdFx0XHRpZihlbC5pcygnaW1nJykpIHtcclxuXHRcdFx0XHRcdGl0ZW0uaW1nID0gaXRlbS5pbWcuY2xvbmUoKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGltZyA9IGl0ZW0uaW1nWzBdO1xyXG5cdFx0XHRcdGlmKGltZy5uYXR1cmFsV2lkdGggPiAwKSB7XHJcblx0XHRcdFx0XHRpdGVtLmhhc1NpemUgPSB0cnVlO1xyXG5cdFx0XHRcdH0gZWxzZSBpZighaW1nLndpZHRoKSB7XHJcblx0XHRcdFx0XHRpdGVtLmhhc1NpemUgPSBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdG1mcC5fcGFyc2VNYXJrdXAodGVtcGxhdGUsIHtcclxuXHRcdFx0XHR0aXRsZTogX2dldFRpdGxlKGl0ZW0pLFxyXG5cdFx0XHRcdGltZ19yZXBsYWNlV2l0aDogaXRlbS5pbWdcclxuXHRcdFx0fSwgaXRlbSk7XHJcblxyXG5cdFx0XHRtZnAucmVzaXplSW1hZ2UoKTtcclxuXHJcblx0XHRcdGlmKGl0ZW0uaGFzU2l6ZSkge1xyXG5cdFx0XHRcdGlmKF9pbWdJbnRlcnZhbCkgY2xlYXJJbnRlcnZhbChfaW1nSW50ZXJ2YWwpO1xyXG5cclxuXHRcdFx0XHRpZihpdGVtLmxvYWRFcnJvcikge1xyXG5cdFx0XHRcdFx0dGVtcGxhdGUuYWRkQ2xhc3MoJ21mcC1sb2FkaW5nJyk7XHJcblx0XHRcdFx0XHRtZnAudXBkYXRlU3RhdHVzKCdlcnJvcicsIGltZ1N0LnRFcnJvci5yZXBsYWNlKCcldXJsJScsIGl0ZW0uc3JjKSApO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR0ZW1wbGF0ZS5yZW1vdmVDbGFzcygnbWZwLWxvYWRpbmcnKTtcclxuXHRcdFx0XHRcdG1mcC51cGRhdGVTdGF0dXMoJ3JlYWR5Jyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiB0ZW1wbGF0ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0bWZwLnVwZGF0ZVN0YXR1cygnbG9hZGluZycpO1xyXG5cdFx0XHRpdGVtLmxvYWRpbmcgPSB0cnVlO1xyXG5cclxuXHRcdFx0aWYoIWl0ZW0uaGFzU2l6ZSkge1xyXG5cdFx0XHRcdGl0ZW0uaW1nSGlkZGVuID0gdHJ1ZTtcclxuXHRcdFx0XHR0ZW1wbGF0ZS5hZGRDbGFzcygnbWZwLWxvYWRpbmcnKTtcclxuXHRcdFx0XHRtZnAuZmluZEltYWdlU2l6ZShpdGVtKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIHRlbXBsYXRlO1xyXG5cdFx0fVxyXG5cdH1cclxufSk7XHJcblxyXG4vKj4+aW1hZ2UqL1xyXG5cclxuLyo+Pnpvb20qL1xyXG52YXIgaGFzTW96VHJhbnNmb3JtLFxyXG5cdGdldEhhc01velRyYW5zZm9ybSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYoaGFzTW96VHJhbnNmb3JtID09PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0aGFzTW96VHJhbnNmb3JtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpLnN0eWxlLk1velRyYW5zZm9ybSAhPT0gdW5kZWZpbmVkO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGhhc01velRyYW5zZm9ybTtcclxuXHR9O1xyXG5cclxuJC5tYWduaWZpY1BvcHVwLnJlZ2lzdGVyTW9kdWxlKCd6b29tJywge1xyXG5cclxuXHRvcHRpb25zOiB7XHJcblx0XHRlbmFibGVkOiBmYWxzZSxcclxuXHRcdGVhc2luZzogJ2Vhc2UtaW4tb3V0JyxcclxuXHRcdGR1cmF0aW9uOiAzMDAsXHJcblx0XHRvcGVuZXI6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuXHRcdFx0cmV0dXJuIGVsZW1lbnQuaXMoJ2ltZycpID8gZWxlbWVudCA6IGVsZW1lbnQuZmluZCgnaW1nJyk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0cHJvdG86IHtcclxuXHJcblx0XHRpbml0Wm9vbTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciB6b29tU3QgPSBtZnAuc3Quem9vbSxcclxuXHRcdFx0XHRucyA9ICcuem9vbScsXHJcblx0XHRcdFx0aW1hZ2U7XHJcblxyXG5cdFx0XHRpZighem9vbVN0LmVuYWJsZWQgfHwgIW1mcC5zdXBwb3J0c1RyYW5zaXRpb24pIHtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciBkdXJhdGlvbiA9IHpvb21TdC5kdXJhdGlvbixcclxuXHRcdFx0XHRnZXRFbFRvQW5pbWF0ZSA9IGZ1bmN0aW9uKGltYWdlKSB7XHJcblx0XHRcdFx0XHR2YXIgbmV3SW1nID0gaW1hZ2UuY2xvbmUoKS5yZW1vdmVBdHRyKCdzdHlsZScpLnJlbW92ZUF0dHIoJ2NsYXNzJykuYWRkQ2xhc3MoJ21mcC1hbmltYXRlZC1pbWFnZScpLFxyXG5cdFx0XHRcdFx0XHR0cmFuc2l0aW9uID0gJ2FsbCAnKyh6b29tU3QuZHVyYXRpb24vMTAwMCkrJ3MgJyArIHpvb21TdC5lYXNpbmcsXHJcblx0XHRcdFx0XHRcdGNzc09iaiA9IHtcclxuXHRcdFx0XHRcdFx0XHRwb3NpdGlvbjogJ2ZpeGVkJyxcclxuXHRcdFx0XHRcdFx0XHR6SW5kZXg6IDk5OTksXHJcblx0XHRcdFx0XHRcdFx0bGVmdDogMCxcclxuXHRcdFx0XHRcdFx0XHR0b3A6IDAsXHJcblx0XHRcdFx0XHRcdFx0Jy13ZWJraXQtYmFja2ZhY2UtdmlzaWJpbGl0eSc6ICdoaWRkZW4nXHJcblx0XHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRcdHQgPSAndHJhbnNpdGlvbic7XHJcblxyXG5cdFx0XHRcdFx0Y3NzT2JqWyctd2Via2l0LScrdF0gPSBjc3NPYmpbJy1tb3otJyt0XSA9IGNzc09ialsnLW8tJyt0XSA9IGNzc09ialt0XSA9IHRyYW5zaXRpb247XHJcblxyXG5cdFx0XHRcdFx0bmV3SW1nLmNzcyhjc3NPYmopO1xyXG5cdFx0XHRcdFx0cmV0dXJuIG5ld0ltZztcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdHNob3dNYWluQ29udGVudCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0bWZwLmNvbnRlbnQuY3NzKCd2aXNpYmlsaXR5JywgJ3Zpc2libGUnKTtcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9wZW5UaW1lb3V0LFxyXG5cdFx0XHRcdGFuaW1hdGVkSW1nO1xyXG5cclxuXHRcdFx0X21mcE9uKCdCdWlsZENvbnRyb2xzJytucywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0aWYobWZwLl9hbGxvd1pvb20oKSkge1xyXG5cclxuXHRcdFx0XHRcdGNsZWFyVGltZW91dChvcGVuVGltZW91dCk7XHJcblx0XHRcdFx0XHRtZnAuY29udGVudC5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XHJcblxyXG5cdFx0XHRcdFx0Ly8gQmFzaWNhbGx5LCBhbGwgY29kZSBiZWxvdyBkb2VzIGlzIGNsb25lcyBleGlzdGluZyBpbWFnZSwgcHV0cyBpbiBvbiB0b3Agb2YgdGhlIGN1cnJlbnQgb25lIGFuZCBhbmltYXRlZCBpdFxyXG5cclxuXHRcdFx0XHRcdGltYWdlID0gbWZwLl9nZXRJdGVtVG9ab29tKCk7XHJcblxyXG5cdFx0XHRcdFx0aWYoIWltYWdlKSB7XHJcblx0XHRcdFx0XHRcdHNob3dNYWluQ29udGVudCgpO1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0YW5pbWF0ZWRJbWcgPSBnZXRFbFRvQW5pbWF0ZShpbWFnZSk7XHJcblxyXG5cdFx0XHRcdFx0YW5pbWF0ZWRJbWcuY3NzKCBtZnAuX2dldE9mZnNldCgpICk7XHJcblxyXG5cdFx0XHRcdFx0bWZwLndyYXAuYXBwZW5kKGFuaW1hdGVkSW1nKTtcclxuXHJcblx0XHRcdFx0XHRvcGVuVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdGFuaW1hdGVkSW1nLmNzcyggbWZwLl9nZXRPZmZzZXQoIHRydWUgKSApO1xyXG5cdFx0XHRcdFx0XHRvcGVuVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHRcdFx0XHRcdHNob3dNYWluQ29udGVudCgpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0YW5pbWF0ZWRJbWcucmVtb3ZlKCk7XHJcblx0XHRcdFx0XHRcdFx0XHRpbWFnZSA9IGFuaW1hdGVkSW1nID0gbnVsbDtcclxuXHRcdFx0XHRcdFx0XHRcdF9tZnBUcmlnZ2VyKCdab29tQW5pbWF0aW9uRW5kZWQnKTtcclxuXHRcdFx0XHRcdFx0XHR9LCAxNik7IC8vIGF2b2lkIGJsaW5rIHdoZW4gc3dpdGNoaW5nIGltYWdlc1xyXG5cclxuXHRcdFx0XHRcdFx0fSwgZHVyYXRpb24pOyAvLyB0aGlzIHRpbWVvdXQgZXF1YWxzIGFuaW1hdGlvbiBkdXJhdGlvblxyXG5cclxuXHRcdFx0XHRcdH0sIDE2KTsgLy8gYnkgYWRkaW5nIHRoaXMgdGltZW91dCB3ZSBhdm9pZCBzaG9ydCBnbGl0Y2ggYXQgdGhlIGJlZ2lubmluZyBvZiBhbmltYXRpb25cclxuXHJcblxyXG5cdFx0XHRcdFx0Ly8gTG90cyBvZiB0aW1lb3V0cy4uLlxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHRcdF9tZnBPbihCRUZPUkVfQ0xPU0VfRVZFTlQrbnMsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGlmKG1mcC5fYWxsb3dab29tKCkpIHtcclxuXHJcblx0XHRcdFx0XHRjbGVhclRpbWVvdXQob3BlblRpbWVvdXQpO1xyXG5cclxuXHRcdFx0XHRcdG1mcC5zdC5yZW1vdmFsRGVsYXkgPSBkdXJhdGlvbjtcclxuXHJcblx0XHRcdFx0XHRpZighaW1hZ2UpIHtcclxuXHRcdFx0XHRcdFx0aW1hZ2UgPSBtZnAuX2dldEl0ZW1Ub1pvb20oKTtcclxuXHRcdFx0XHRcdFx0aWYoIWltYWdlKSB7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGFuaW1hdGVkSW1nID0gZ2V0RWxUb0FuaW1hdGUoaW1hZ2UpO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGFuaW1hdGVkSW1nLmNzcyggbWZwLl9nZXRPZmZzZXQodHJ1ZSkgKTtcclxuXHRcdFx0XHRcdG1mcC53cmFwLmFwcGVuZChhbmltYXRlZEltZyk7XHJcblx0XHRcdFx0XHRtZnAuY29udGVudC5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XHJcblxyXG5cdFx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0YW5pbWF0ZWRJbWcuY3NzKCBtZnAuX2dldE9mZnNldCgpICk7XHJcblx0XHRcdFx0XHR9LCAxNik7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRfbWZwT24oQ0xPU0VfRVZFTlQrbnMsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGlmKG1mcC5fYWxsb3dab29tKCkpIHtcclxuXHRcdFx0XHRcdHNob3dNYWluQ29udGVudCgpO1xyXG5cdFx0XHRcdFx0aWYoYW5pbWF0ZWRJbWcpIHtcclxuXHRcdFx0XHRcdFx0YW5pbWF0ZWRJbWcucmVtb3ZlKCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpbWFnZSA9IG51bGw7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH0sXHJcblxyXG5cdFx0X2FsbG93Wm9vbTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiBtZnAuY3Vyckl0ZW0udHlwZSA9PT0gJ2ltYWdlJztcclxuXHRcdH0sXHJcblxyXG5cdFx0X2dldEl0ZW1Ub1pvb206IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRpZihtZnAuY3Vyckl0ZW0uaGFzU2l6ZSkge1xyXG5cdFx0XHRcdHJldHVybiBtZnAuY3Vyckl0ZW0uaW1nO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0fSxcclxuXHJcblx0XHQvLyBHZXQgZWxlbWVudCBwb3N0aW9uIHJlbGF0aXZlIHRvIHZpZXdwb3J0XHJcblx0XHRfZ2V0T2Zmc2V0OiBmdW5jdGlvbihpc0xhcmdlKSB7XHJcblx0XHRcdHZhciBlbDtcclxuXHRcdFx0aWYoaXNMYXJnZSkge1xyXG5cdFx0XHRcdGVsID0gbWZwLmN1cnJJdGVtLmltZztcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRlbCA9IG1mcC5zdC56b29tLm9wZW5lcihtZnAuY3Vyckl0ZW0uZWwgfHwgbWZwLmN1cnJJdGVtKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIG9mZnNldCA9IGVsLm9mZnNldCgpO1xyXG5cdFx0XHR2YXIgcGFkZGluZ1RvcCA9IHBhcnNlSW50KGVsLmNzcygncGFkZGluZy10b3AnKSwxMCk7XHJcblx0XHRcdHZhciBwYWRkaW5nQm90dG9tID0gcGFyc2VJbnQoZWwuY3NzKCdwYWRkaW5nLWJvdHRvbScpLDEwKTtcclxuXHRcdFx0b2Zmc2V0LnRvcCAtPSAoICQod2luZG93KS5zY3JvbGxUb3AoKSAtIHBhZGRpbmdUb3AgKTtcclxuXHJcblxyXG5cdFx0XHQvKlxyXG5cclxuXHRcdFx0QW5pbWF0aW5nIGxlZnQgKyB0b3AgKyB3aWR0aC9oZWlnaHQgbG9va3MgZ2xpdGNoeSBpbiBGaXJlZm94LCBidXQgcGVyZmVjdCBpbiBDaHJvbWUuIEFuZCB2aWNlLXZlcnNhLlxyXG5cclxuXHRcdFx0ICovXHJcblx0XHRcdHZhciBvYmogPSB7XHJcblx0XHRcdFx0d2lkdGg6IGVsLndpZHRoKCksXHJcblx0XHRcdFx0Ly8gZml4IFplcHRvIGhlaWdodCtwYWRkaW5nIGlzc3VlXHJcblx0XHRcdFx0aGVpZ2h0OiAoX2lzSlEgPyBlbC5pbm5lckhlaWdodCgpIDogZWxbMF0ub2Zmc2V0SGVpZ2h0KSAtIHBhZGRpbmdCb3R0b20gLSBwYWRkaW5nVG9wXHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHQvLyBJIGhhdGUgdG8gZG8gdGhpcywgYnV0IHRoZXJlIGlzIG5vIGFub3RoZXIgb3B0aW9uXHJcblx0XHRcdGlmKCBnZXRIYXNNb3pUcmFuc2Zvcm0oKSApIHtcclxuXHRcdFx0XHRvYmpbJy1tb3otdHJhbnNmb3JtJ10gPSBvYmpbJ3RyYW5zZm9ybSddID0gJ3RyYW5zbGF0ZSgnICsgb2Zmc2V0LmxlZnQgKyAncHgsJyArIG9mZnNldC50b3AgKyAncHgpJztcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRvYmoubGVmdCA9IG9mZnNldC5sZWZ0O1xyXG5cdFx0XHRcdG9iai50b3AgPSBvZmZzZXQudG9wO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBvYmo7XHJcblx0XHR9XHJcblxyXG5cdH1cclxufSk7XHJcblxyXG5cclxuXHJcbi8qPj56b29tKi9cclxuXHJcbi8qPj5pZnJhbWUqL1xyXG5cclxudmFyIElGUkFNRV9OUyA9ICdpZnJhbWUnLFxyXG5cdF9lbXB0eVBhZ2UgPSAnLy9hYm91dDpibGFuaycsXHJcblxyXG5cdF9maXhJZnJhbWVCdWdzID0gZnVuY3Rpb24oaXNTaG93aW5nKSB7XHJcblx0XHRpZihtZnAuY3VyclRlbXBsYXRlW0lGUkFNRV9OU10pIHtcclxuXHRcdFx0dmFyIGVsID0gbWZwLmN1cnJUZW1wbGF0ZVtJRlJBTUVfTlNdLmZpbmQoJ2lmcmFtZScpO1xyXG5cdFx0XHRpZihlbC5sZW5ndGgpIHtcclxuXHRcdFx0XHQvLyByZXNldCBzcmMgYWZ0ZXIgdGhlIHBvcHVwIGlzIGNsb3NlZCB0byBhdm9pZCBcInZpZGVvIGtlZXBzIHBsYXlpbmcgYWZ0ZXIgcG9wdXAgaXMgY2xvc2VkXCIgYnVnXHJcblx0XHRcdFx0aWYoIWlzU2hvd2luZykge1xyXG5cdFx0XHRcdFx0ZWxbMF0uc3JjID0gX2VtcHR5UGFnZTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdC8vIElFOCBibGFjayBzY3JlZW4gYnVnIGZpeFxyXG5cdFx0XHRcdGlmKG1mcC5pc0lFOCkge1xyXG5cdFx0XHRcdFx0ZWwuY3NzKCdkaXNwbGF5JywgaXNTaG93aW5nID8gJ2Jsb2NrJyA6ICdub25lJyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxuXHJcbiQubWFnbmlmaWNQb3B1cC5yZWdpc3Rlck1vZHVsZShJRlJBTUVfTlMsIHtcclxuXHJcblx0b3B0aW9uczoge1xyXG5cdFx0bWFya3VwOiAnPGRpdiBjbGFzcz1cIm1mcC1pZnJhbWUtc2NhbGVyXCI+JytcclxuXHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwibWZwLWNsb3NlXCI+PC9kaXY+JytcclxuXHRcdFx0XHRcdCc8aWZyYW1lIGNsYXNzPVwibWZwLWlmcmFtZVwiIHNyYz1cIi8vYWJvdXQ6YmxhbmtcIiBmcmFtZWJvcmRlcj1cIjBcIiBhbGxvd2Z1bGxzY3JlZW4+PC9pZnJhbWU+JytcclxuXHRcdFx0XHQnPC9kaXY+JyxcclxuXHJcblx0XHRzcmNBY3Rpb246ICdpZnJhbWVfc3JjJyxcclxuXHJcblx0XHQvLyB3ZSBkb24ndCBjYXJlIGFuZCBzdXBwb3J0IG9ubHkgb25lIGRlZmF1bHQgdHlwZSBvZiBVUkwgYnkgZGVmYXVsdFxyXG5cdFx0cGF0dGVybnM6IHtcclxuXHRcdFx0eW91dHViZToge1xyXG5cdFx0XHRcdGluZGV4OiAneW91dHViZS5jb20nLFxyXG5cdFx0XHRcdGlkOiAndj0nLFxyXG5cdFx0XHRcdHNyYzogJy8vd3d3LnlvdXR1YmUuY29tL2VtYmVkLyVpZCU/YXV0b3BsYXk9MSdcclxuXHRcdFx0fSxcclxuXHRcdFx0dmltZW86IHtcclxuXHRcdFx0XHRpbmRleDogJ3ZpbWVvLmNvbS8nLFxyXG5cdFx0XHRcdGlkOiAnLycsXHJcblx0XHRcdFx0c3JjOiAnLy9wbGF5ZXIudmltZW8uY29tL3ZpZGVvLyVpZCU/YXV0b3BsYXk9MSdcclxuXHRcdFx0fSxcclxuXHRcdFx0Z21hcHM6IHtcclxuXHRcdFx0XHRpbmRleDogJy8vbWFwcy5nb29nbGUuJyxcclxuXHRcdFx0XHRzcmM6ICclaWQlJm91dHB1dD1lbWJlZCdcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdHByb3RvOiB7XHJcblx0XHRpbml0SWZyYW1lOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0bWZwLnR5cGVzLnB1c2goSUZSQU1FX05TKTtcclxuXHJcblx0XHRcdF9tZnBPbignQmVmb3JlQ2hhbmdlJywgZnVuY3Rpb24oZSwgcHJldlR5cGUsIG5ld1R5cGUpIHtcclxuXHRcdFx0XHRpZihwcmV2VHlwZSAhPT0gbmV3VHlwZSkge1xyXG5cdFx0XHRcdFx0aWYocHJldlR5cGUgPT09IElGUkFNRV9OUykge1xyXG5cdFx0XHRcdFx0XHRfZml4SWZyYW1lQnVncygpOyAvLyBpZnJhbWUgaWYgcmVtb3ZlZFxyXG5cdFx0XHRcdFx0fSBlbHNlIGlmKG5ld1R5cGUgPT09IElGUkFNRV9OUykge1xyXG5cdFx0XHRcdFx0XHRfZml4SWZyYW1lQnVncyh0cnVlKTsgLy8gaWZyYW1lIGlzIHNob3dpbmdcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9Ly8gZWxzZSB7XHJcblx0XHRcdFx0XHQvLyBpZnJhbWUgc291cmNlIGlzIHN3aXRjaGVkLCBkb24ndCBkbyBhbnl0aGluZ1xyXG5cdFx0XHRcdC8vfVxyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdF9tZnBPbihDTE9TRV9FVkVOVCArICcuJyArIElGUkFNRV9OUywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0X2ZpeElmcmFtZUJ1Z3MoKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9LFxyXG5cclxuXHRcdGdldElmcmFtZTogZnVuY3Rpb24oaXRlbSwgdGVtcGxhdGUpIHtcclxuXHRcdFx0dmFyIGVtYmVkU3JjID0gaXRlbS5zcmM7XHJcblx0XHRcdHZhciBpZnJhbWVTdCA9IG1mcC5zdC5pZnJhbWU7XHJcblxyXG5cdFx0XHQkLmVhY2goaWZyYW1lU3QucGF0dGVybnMsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGlmKGVtYmVkU3JjLmluZGV4T2YoIHRoaXMuaW5kZXggKSA+IC0xKSB7XHJcblx0XHRcdFx0XHRpZih0aGlzLmlkKSB7XHJcblx0XHRcdFx0XHRcdGlmKHR5cGVvZiB0aGlzLmlkID09PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0XHRcdGVtYmVkU3JjID0gZW1iZWRTcmMuc3Vic3RyKGVtYmVkU3JjLmxhc3RJbmRleE9mKHRoaXMuaWQpK3RoaXMuaWQubGVuZ3RoLCBlbWJlZFNyYy5sZW5ndGgpO1xyXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdGVtYmVkU3JjID0gdGhpcy5pZC5jYWxsKCB0aGlzLCBlbWJlZFNyYyApO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbWJlZFNyYyA9IHRoaXMuc3JjLnJlcGxhY2UoJyVpZCUnLCBlbWJlZFNyYyApO1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlOyAvLyBicmVhaztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0dmFyIGRhdGFPYmogPSB7fTtcclxuXHRcdFx0aWYoaWZyYW1lU3Quc3JjQWN0aW9uKSB7XHJcblx0XHRcdFx0ZGF0YU9ialtpZnJhbWVTdC5zcmNBY3Rpb25dID0gZW1iZWRTcmM7XHJcblx0XHRcdH1cclxuXHRcdFx0bWZwLl9wYXJzZU1hcmt1cCh0ZW1wbGF0ZSwgZGF0YU9iaiwgaXRlbSk7XHJcblxyXG5cdFx0XHRtZnAudXBkYXRlU3RhdHVzKCdyZWFkeScpO1xyXG5cclxuXHRcdFx0cmV0dXJuIHRlbXBsYXRlO1xyXG5cdFx0fVxyXG5cdH1cclxufSk7XHJcblxyXG5cclxuXHJcbi8qPj5pZnJhbWUqL1xyXG5cclxuLyo+PmdhbGxlcnkqL1xyXG4vKipcclxuICogR2V0IGxvb3BlZCBpbmRleCBkZXBlbmRpbmcgb24gbnVtYmVyIG9mIHNsaWRlc1xyXG4gKi9cclxudmFyIF9nZXRMb29wZWRJZCA9IGZ1bmN0aW9uKGluZGV4KSB7XHJcblx0XHR2YXIgbnVtU2xpZGVzID0gbWZwLml0ZW1zLmxlbmd0aDtcclxuXHRcdGlmKGluZGV4ID4gbnVtU2xpZGVzIC0gMSkge1xyXG5cdFx0XHRyZXR1cm4gaW5kZXggLSBudW1TbGlkZXM7XHJcblx0XHR9IGVsc2UgIGlmKGluZGV4IDwgMCkge1xyXG5cdFx0XHRyZXR1cm4gbnVtU2xpZGVzICsgaW5kZXg7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gaW5kZXg7XHJcblx0fSxcclxuXHRfcmVwbGFjZUN1cnJUb3RhbCA9IGZ1bmN0aW9uKHRleHQsIGN1cnIsIHRvdGFsKSB7XHJcblx0XHRyZXR1cm4gdGV4dC5yZXBsYWNlKC8lY3VyciUvZ2ksIGN1cnIgKyAxKS5yZXBsYWNlKC8ldG90YWwlL2dpLCB0b3RhbCk7XHJcblx0fTtcclxuXHJcbiQubWFnbmlmaWNQb3B1cC5yZWdpc3Rlck1vZHVsZSgnZ2FsbGVyeScsIHtcclxuXHJcblx0b3B0aW9uczoge1xyXG5cdFx0ZW5hYmxlZDogZmFsc2UsXHJcblx0XHRhcnJvd01hcmt1cDogJzxidXR0b24gdGl0bGU9XCIldGl0bGUlXCIgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwibWZwLWFycm93IG1mcC1hcnJvdy0lZGlyJVwiPjwvYnV0dG9uPicsXHJcblx0XHRwcmVsb2FkOiBbMCwyXSxcclxuXHRcdG5hdmlnYXRlQnlJbWdDbGljazogdHJ1ZSxcclxuXHRcdGFycm93czogdHJ1ZSxcclxuXHJcblx0XHR0UHJldjogJ1ByZXZpb3VzIChMZWZ0IGFycm93IGtleSknLFxyXG5cdFx0dE5leHQ6ICdOZXh0IChSaWdodCBhcnJvdyBrZXkpJyxcclxuXHRcdHRDb3VudGVyOiAnJWN1cnIlIG9mICV0b3RhbCUnXHJcblx0fSxcclxuXHJcblx0cHJvdG86IHtcclxuXHRcdGluaXRHYWxsZXJ5OiBmdW5jdGlvbigpIHtcclxuXHJcblx0XHRcdHZhciBnU3QgPSBtZnAuc3QuZ2FsbGVyeSxcclxuXHRcdFx0XHRucyA9ICcubWZwLWdhbGxlcnknO1xyXG5cclxuXHRcdFx0bWZwLmRpcmVjdGlvbiA9IHRydWU7IC8vIHRydWUgLSBuZXh0LCBmYWxzZSAtIHByZXZcclxuXHJcblx0XHRcdGlmKCFnU3QgfHwgIWdTdC5lbmFibGVkICkgcmV0dXJuIGZhbHNlO1xyXG5cclxuXHRcdFx0X3dyYXBDbGFzc2VzICs9ICcgbWZwLWdhbGxlcnknO1xyXG5cclxuXHRcdFx0X21mcE9uKE9QRU5fRVZFTlQrbnMsIGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdFx0XHRpZihnU3QubmF2aWdhdGVCeUltZ0NsaWNrKSB7XHJcblx0XHRcdFx0XHRtZnAud3JhcC5vbignY2xpY2snK25zLCAnLm1mcC1pbWcnLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0aWYobWZwLml0ZW1zLmxlbmd0aCA+IDEpIHtcclxuXHRcdFx0XHRcdFx0XHRtZnAubmV4dCgpO1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRfZG9jdW1lbnQub24oJ2tleWRvd24nK25zLCBmdW5jdGlvbihlKSB7XHJcblx0XHRcdFx0XHRpZiAoZS5rZXlDb2RlID09PSAzNykge1xyXG5cdFx0XHRcdFx0XHRtZnAucHJldigpO1xyXG5cdFx0XHRcdFx0fSBlbHNlIGlmIChlLmtleUNvZGUgPT09IDM5KSB7XHJcblx0XHRcdFx0XHRcdG1mcC5uZXh0KCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0X21mcE9uKCdVcGRhdGVTdGF0dXMnK25zLCBmdW5jdGlvbihlLCBkYXRhKSB7XHJcblx0XHRcdFx0aWYoZGF0YS50ZXh0KSB7XHJcblx0XHRcdFx0XHRkYXRhLnRleHQgPSBfcmVwbGFjZUN1cnJUb3RhbChkYXRhLnRleHQsIG1mcC5jdXJySXRlbS5pbmRleCwgbWZwLml0ZW1zLmxlbmd0aCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdF9tZnBPbihNQVJLVVBfUEFSU0VfRVZFTlQrbnMsIGZ1bmN0aW9uKGUsIGVsZW1lbnQsIHZhbHVlcywgaXRlbSkge1xyXG5cdFx0XHRcdHZhciBsID0gbWZwLml0ZW1zLmxlbmd0aDtcclxuXHRcdFx0XHR2YWx1ZXMuY291bnRlciA9IGwgPiAxID8gX3JlcGxhY2VDdXJyVG90YWwoZ1N0LnRDb3VudGVyLCBpdGVtLmluZGV4LCBsKSA6ICcnO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdF9tZnBPbignQnVpbGRDb250cm9scycgKyBucywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0aWYobWZwLml0ZW1zLmxlbmd0aCA+IDEgJiYgZ1N0LmFycm93cyAmJiAhbWZwLmFycm93TGVmdCkge1xyXG5cdFx0XHRcdFx0dmFyIG1hcmt1cCA9IGdTdC5hcnJvd01hcmt1cCxcclxuXHRcdFx0XHRcdFx0YXJyb3dMZWZ0ID0gbWZwLmFycm93TGVmdCA9ICQoIG1hcmt1cC5yZXBsYWNlKC8ldGl0bGUlL2dpLCBnU3QudFByZXYpLnJlcGxhY2UoLyVkaXIlL2dpLCAnbGVmdCcpICkuYWRkQ2xhc3MoUFJFVkVOVF9DTE9TRV9DTEFTUyksXHJcblx0XHRcdFx0XHRcdGFycm93UmlnaHQgPSBtZnAuYXJyb3dSaWdodCA9ICQoIG1hcmt1cC5yZXBsYWNlKC8ldGl0bGUlL2dpLCBnU3QudE5leHQpLnJlcGxhY2UoLyVkaXIlL2dpLCAncmlnaHQnKSApLmFkZENsYXNzKFBSRVZFTlRfQ0xPU0VfQ0xBU1MpO1xyXG5cclxuXHRcdFx0XHRcdGFycm93TGVmdC5jbGljayhmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0bWZwLnByZXYoKTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0YXJyb3dSaWdodC5jbGljayhmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0bWZwLm5leHQoKTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHRcdG1mcC5jb250YWluZXIuYXBwZW5kKGFycm93TGVmdC5hZGQoYXJyb3dSaWdodCkpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRfbWZwT24oQ0hBTkdFX0VWRU5UK25zLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRpZihtZnAuX3ByZWxvYWRUaW1lb3V0KSBjbGVhclRpbWVvdXQobWZwLl9wcmVsb2FkVGltZW91dCk7XHJcblxyXG5cdFx0XHRcdG1mcC5fcHJlbG9hZFRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0bWZwLnByZWxvYWROZWFyYnlJbWFnZXMoKTtcclxuXHRcdFx0XHRcdG1mcC5fcHJlbG9hZFRpbWVvdXQgPSBudWxsO1xyXG5cdFx0XHRcdH0sIDE2KTtcclxuXHRcdFx0fSk7XHJcblxyXG5cclxuXHRcdFx0X21mcE9uKENMT1NFX0VWRU5UK25zLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRfZG9jdW1lbnQub2ZmKG5zKTtcclxuXHRcdFx0XHRtZnAud3JhcC5vZmYoJ2NsaWNrJytucyk7XHJcblx0XHRcdFx0bWZwLmFycm93UmlnaHQgPSBtZnAuYXJyb3dMZWZ0ID0gbnVsbDtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0fSxcclxuXHRcdG5leHQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRtZnAuZGlyZWN0aW9uID0gdHJ1ZTtcclxuXHRcdFx0bWZwLmluZGV4ID0gX2dldExvb3BlZElkKG1mcC5pbmRleCArIDEpO1xyXG5cdFx0XHRtZnAudXBkYXRlSXRlbUhUTUwoKTtcclxuXHRcdH0sXHJcblx0XHRwcmV2OiBmdW5jdGlvbigpIHtcclxuXHRcdFx0bWZwLmRpcmVjdGlvbiA9IGZhbHNlO1xyXG5cdFx0XHRtZnAuaW5kZXggPSBfZ2V0TG9vcGVkSWQobWZwLmluZGV4IC0gMSk7XHJcblx0XHRcdG1mcC51cGRhdGVJdGVtSFRNTCgpO1xyXG5cdFx0fSxcclxuXHRcdGdvVG86IGZ1bmN0aW9uKG5ld0luZGV4KSB7XHJcblx0XHRcdG1mcC5kaXJlY3Rpb24gPSAobmV3SW5kZXggPj0gbWZwLmluZGV4KTtcclxuXHRcdFx0bWZwLmluZGV4ID0gbmV3SW5kZXg7XHJcblx0XHRcdG1mcC51cGRhdGVJdGVtSFRNTCgpO1xyXG5cdFx0fSxcclxuXHRcdHByZWxvYWROZWFyYnlJbWFnZXM6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgcCA9IG1mcC5zdC5nYWxsZXJ5LnByZWxvYWQsXHJcblx0XHRcdFx0cHJlbG9hZEJlZm9yZSA9IE1hdGgubWluKHBbMF0sIG1mcC5pdGVtcy5sZW5ndGgpLFxyXG5cdFx0XHRcdHByZWxvYWRBZnRlciA9IE1hdGgubWluKHBbMV0sIG1mcC5pdGVtcy5sZW5ndGgpLFxyXG5cdFx0XHRcdGk7XHJcblxyXG5cdFx0XHRmb3IoaSA9IDE7IGkgPD0gKG1mcC5kaXJlY3Rpb24gPyBwcmVsb2FkQWZ0ZXIgOiBwcmVsb2FkQmVmb3JlKTsgaSsrKSB7XHJcblx0XHRcdFx0bWZwLl9wcmVsb2FkSXRlbShtZnAuaW5kZXgraSk7XHJcblx0XHRcdH1cclxuXHRcdFx0Zm9yKGkgPSAxOyBpIDw9IChtZnAuZGlyZWN0aW9uID8gcHJlbG9hZEJlZm9yZSA6IHByZWxvYWRBZnRlcik7IGkrKykge1xyXG5cdFx0XHRcdG1mcC5fcHJlbG9hZEl0ZW0obWZwLmluZGV4LWkpO1xyXG5cdFx0XHR9XHJcblx0XHR9LFxyXG5cdFx0X3ByZWxvYWRJdGVtOiBmdW5jdGlvbihpbmRleCkge1xyXG5cdFx0XHRpbmRleCA9IF9nZXRMb29wZWRJZChpbmRleCk7XHJcblxyXG5cdFx0XHRpZihtZnAuaXRlbXNbaW5kZXhdLnByZWxvYWRlZCkge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIGl0ZW0gPSBtZnAuaXRlbXNbaW5kZXhdO1xyXG5cdFx0XHRpZighaXRlbS5wYXJzZWQpIHtcclxuXHRcdFx0XHRpdGVtID0gbWZwLnBhcnNlRWwoIGluZGV4ICk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdF9tZnBUcmlnZ2VyKCdMYXp5TG9hZCcsIGl0ZW0pO1xyXG5cclxuXHRcdFx0aWYoaXRlbS50eXBlID09PSAnaW1hZ2UnKSB7XHJcblx0XHRcdFx0aXRlbS5pbWcgPSAkKCc8aW1nIGNsYXNzPVwibWZwLWltZ1wiIC8+Jykub24oJ2xvYWQubWZwbG9hZGVyJywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRpdGVtLmhhc1NpemUgPSB0cnVlO1xyXG5cdFx0XHRcdH0pLm9uKCdlcnJvci5tZnBsb2FkZXInLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdGl0ZW0uaGFzU2l6ZSA9IHRydWU7XHJcblx0XHRcdFx0XHRpdGVtLmxvYWRFcnJvciA9IHRydWU7XHJcblx0XHRcdFx0XHRfbWZwVHJpZ2dlcignTGF6eUxvYWRFcnJvcicsIGl0ZW0pO1xyXG5cdFx0XHRcdH0pLmF0dHIoJ3NyYycsIGl0ZW0uc3JjKTtcclxuXHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdGl0ZW0ucHJlbG9hZGVkID0gdHJ1ZTtcclxuXHRcdH1cclxuXHR9XHJcbn0pO1xyXG5cclxuLyo+PmdhbGxlcnkqL1xyXG5cclxuLyo+PnJldGluYSovXHJcblxyXG52YXIgUkVUSU5BX05TID0gJ3JldGluYSc7XHJcblxyXG4kLm1hZ25pZmljUG9wdXAucmVnaXN0ZXJNb2R1bGUoUkVUSU5BX05TLCB7XHJcblx0b3B0aW9uczoge1xyXG5cdFx0cmVwbGFjZVNyYzogZnVuY3Rpb24oaXRlbSkge1xyXG5cdFx0XHRyZXR1cm4gaXRlbS5zcmMucmVwbGFjZSgvXFwuXFx3KyQvLCBmdW5jdGlvbihtKSB7IHJldHVybiAnQDJ4JyArIG07IH0pO1xyXG5cdFx0fSxcclxuXHRcdHJhdGlvOiAxIC8vIEZ1bmN0aW9uIG9yIG51bWJlci4gIFNldCB0byAxIHRvIGRpc2FibGUuXHJcblx0fSxcclxuXHRwcm90bzoge1xyXG5cdFx0aW5pdFJldGluYTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdGlmKHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID4gMSkge1xyXG5cclxuXHRcdFx0XHR2YXIgc3QgPSBtZnAuc3QucmV0aW5hLFxyXG5cdFx0XHRcdFx0cmF0aW8gPSBzdC5yYXRpbztcclxuXHJcblx0XHRcdFx0cmF0aW8gPSAhaXNOYU4ocmF0aW8pID8gcmF0aW8gOiByYXRpbygpO1xyXG5cclxuXHRcdFx0XHRpZihyYXRpbyA+IDEpIHtcclxuXHRcdFx0XHRcdF9tZnBPbignSW1hZ2VIYXNTaXplJyArICcuJyArIFJFVElOQV9OUywgZnVuY3Rpb24oZSwgaXRlbSkge1xyXG5cdFx0XHRcdFx0XHRpdGVtLmltZy5jc3Moe1xyXG5cdFx0XHRcdFx0XHRcdCdtYXgtd2lkdGgnOiBpdGVtLmltZ1swXS5uYXR1cmFsV2lkdGggLyByYXRpbyxcclxuXHRcdFx0XHRcdFx0XHQnd2lkdGgnOiAnMTAwJSdcclxuXHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdF9tZnBPbignRWxlbWVudFBhcnNlJyArICcuJyArIFJFVElOQV9OUywgZnVuY3Rpb24oZSwgaXRlbSkge1xyXG5cdFx0XHRcdFx0XHRpdGVtLnNyYyA9IHN0LnJlcGxhY2VTcmMoaXRlbSwgcmF0aW8pO1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cdH1cclxufSk7XHJcblxyXG4vKj4+cmV0aW5hKi9cclxuIF9jaGVja0luc3RhbmNlKCk7IH0pKTsiXSwiZmlsZSI6ImxpYnMuanMifQ==
