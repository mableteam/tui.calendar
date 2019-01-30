/**
 * @fileoverview Handling creation events from drag handler and time grid view
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';

var util = require('tui-code-snippet');
var config = require('../../config');
var domutil = require('../../common/domutil');
var domevent = require('../../common/domevent');
var TimeCreationGuide = require('./creationGuide');
var timeCore = require('./core');

var CLICK_DELAY = 0;

/**
 * @constructor
 * @implements {Handler}
 * @mixes timeCore
 * @mixes CustomEvents
 * @param {Drag} [dragHandler] - Drag handler instance.
 * @param {TimeGrid} [timeGridView] - TimeGrid view instance.
 * @param {Base} [baseController] - Base controller instance.
 */
function MouseMove(dragHandler, timeGridView, baseController) {
    /**
	 * Drag handler instance.
	 * @type {Drag}
	 */
    this.dragHandler = dragHandler;

    /**
	 * TimeGrid view instance.
	 * @type {TimeGrid}
	 */
    this.timeGridView = timeGridView;

    /**
	 * Base controller instance.
	 * @type {Base}
	 */
    this.baseController = baseController;

    /**
	 * @type {TimeCreationGuide}
	 */
    this.guide = new TimeCreationGuide(this);

    /**
	 * Temporary function for single drag session's calc.
	 * @type {function}
	 */
    this._getScheduleDataFunc = null;

    /**
	 * Temporary function for drag start data cache.
	 * @type {object}
	 */
    this._dragStart = null;

    /**
	 * @type {boolean}
	 */
    this._requestOnClick = false;

    dragHandler.on('mousemove', this._onMouseMove, this);
    dragHandler.on('dragStart', this._onClick, this);
    dragHandler.on('drag', this._onClick, this);
}

/**
 * Destroy method
 */
MouseMove.prototype.destroy = function() {
    var timeGridView = this.timeGridView;

    this.guide.destroy();
    this.dragHandler.off(this);

    if (timeGridView && timeGridView.container) {
        domevent.off(timeGridView.container, 'dblclick', this._onDblClick, this);
    }

    this.dragHandler = this.timeGridView = this.baseController = this._getScheduleDataFunc = this._dragStart = this.guide = null;
};

/**
 * Check target element is expected condition for activate this plugins.
 * @param {HTMLElement} target - The element to check
 * @returns {(boolean|Time)} - return Time view instance when satiate condition.
 */
MouseMove.prototype.checkExpectedCondition = function(target) {
    var cssClass = domutil.getClass(target),
        matches;

    if (cssClass === config.classname('time-date-schedule-block-wrap')) {
        target = target.parentNode;
        cssClass = domutil.getClass(target);
    }

    matches = cssClass.match(config.time.getViewIDRegExp);

    if (!matches || matches.length < 2) {
        return false;
    }

    return util.pick(this.timeGridView.children.items, matches[1]);
};

/**
 * MouseMove#mousemove event handler
 * @emits TimeCreation#timeCreationClick
 * @param {object} mouseMoveEventData - event data from MouseMove#click.
 */
MouseMove.prototype._onMouseMove = function(mouseMoveEventData) {
    var self = this;
    var condResult, getScheduleDataFunc, eventData;

    this.dragHandler.off(
        {
            drag: this._onDrag,
            dragEnd: this._onDragEnd
        },
        this
    );

    condResult = this.checkExpectedCondition(mouseMoveEventData.target);
    if (!condResult) {
        return;
    }

    getScheduleDataFunc = this._retriveScheduleData(condResult);
    eventData = getScheduleDataFunc(mouseMoveEventData.originEvent);

    this._requestOnClick = true;
    setTimeout(function() {
        if (self._requestOnClick) {
            self.fire('timeCreationClick', eventData);
        }
        self._requestOnClick = false;
    }, CLICK_DELAY);
    this._dragStart = this._getScheduleDataFunc = null;
};

/**
 * MouseMove#click event handler
 * @emits TimeCreation#timeCreationClick
 * @param {object} clickEventData - event data from MouseMove#click.
 */
MouseMove.prototype._onClick = function(clickEventData) {
    this.guide.clearGuideElement();
};

timeCore.mixin(MouseMove);
util.CustomEvents.mixin(MouseMove);

module.exports = MouseMove;
