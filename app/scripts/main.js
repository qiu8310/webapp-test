/* jshint newcap:false */
/* global Hammer: true */

'use strict';
var rMatrix = /\s*([-\.\d]+),\s*([-\.\d]+)\)\s*$/; // 匹配 css transform 的属性 matrix
var util = {
	// 设置/获取 元素的 CSS 属性
	css: function(elem, key, val) {
		var style,
			t;

		style = typeof val === 'undefined' ?
				window.getComputedStyle(elem, null) : elem.style;

		if (!(key in style)) {
			['Webkit', 'O', 'Moz', 'ms'].forEach(function (prefix) {
				t = prefix + key.charAt(0).toUpperCase() + key.substr(1);
				if (t in style) {
					key = t;
				}
			});
		}

		return typeof val === 'undefined' ? style[key] : (style[key] = val);
	},

	// 移动 elem / 获取 elem 移动的位移
	translate: function(elem, distance, speed, func) {
		if (typeof distance !== 'undefined') {
			distance.x = distance.x || 0;
			distance.y = distance.y || 0;
			func = func || 'ease';
			this.css(elem, 'transitionTimingFunction', speed > 0 ? func : 'no');
			this.css(elem, 'transitionDuration', (speed || 0) + 'ms');
			this.css(elem, 'transform', 'matrix(1, 0, 0, 1, ' + distance.x + ', ' + distance.y + ')');
		} else {
			var match = this.css(elem, 'transform').match(rMatrix);
			return match ? {x: match[1] - 0, y: match[2] - 0} : {x: 0, y: 0};
		}
	}
};

function _ (selector, ctx) { return (ctx || document).querySelector(selector); }
function __(selector, ctx) { return [].slice.call((ctx || document).querySelectorAll(selector)); }


/* common */
$(function() {
	// touchable element
	var $doc = $(document),
		lastTouchedElem;
	$doc.delegate('.touchable', 'touchstart', function() {
		if (lastTouchedElem) {
			lastTouchedElem.removeClass('touched');
		}
		lastTouchedElem = $(this).addClass('touched');
	});
	$doc.on('touchmove, touchcancel, touchend', function() {
		if (lastTouchedElem) {
			lastTouchedElem.removeClass('touched');
		}
	});

	// back button
	var backElem = _('header .back');
	if (backElem) {
		Hammer(backElem).on('tap', function() {
			window.history.back();
			return false;
		});
	}
});

/* index page */
$(function() {
	// 处理删除按钮
	var MAX_WIDTH = 70,
		eles = __('.deleteEnable'),
		cancelSearchEles = _('.search .cancel');

	function dragHandler(e) {
		e.gesture.preventDefault();
		e.gesture.stopPropagation();

		e.preventDefault();
		e.stopPropagation();

		// 获取真正的 target
		var target = e.target, lastTarget;
		while (target && !target.classList.contains('wrap')) {
			target = target.parentNode;
		}

		lastTarget = _('.deleteOn');
		if (lastTarget && lastTarget !== target) {
			lastTarget.classList.remove('deleteOn');
			util.translate(lastTarget, {x: 0}, 300);
		}


		// 移动 target
		if (target) {
			var abs,
				distance = e.gesture.distance,
				translate = util.translate(target);

			switch(e.type) {
				case 'dragleft':
					distance = translate.x - distance;
					break;
				case 'dragright':
					distance = distance + translate.x;
					break;
				case 'dragend':
					distance = translate.x;
					abs = Math.abs(distance);
					if (distance < 0 && abs >= 0.5 * MAX_WIDTH) {
						target.classList.add('deleteOn');
						util.translate(target, {x: - MAX_WIDTH}, 200);
					} else {
						target.classList.remove('deleteOn');
						util.translate(target, {x: 0}, 200);
					}
					return ;
			}

			if (distance > 0) {
				distance = 0;
			} else if (MAX_WIDTH + distance < 0) {
				distance = - MAX_WIDTH - (distance + MAX_WIDTH) * MAX_WIDTH / distance;
			}

			util.translate(target, {x: distance});
		}
	}

	if (eles) {
		eles.forEach(function(ele) {
			if (ele) {
				Hammer(ele).on('dragleft dragright dragend', dragHandler);
			}
		});
	}


	// 首页 和 搜索页的切换
	function show(page) {
		if (page === 'search') {
			$('.pageHome').hide();
			$('.pageSearch').show();
		} else {
			$('.pageSearch').hide();
			$('.pageHome').show();
		}
	}

	$('.search-fake input').on('focus', function() {
		show('search');
		$('.search input').focus();
	});

	if (cancelSearchEles) {
		Hammer(cancelSearchEles).on('tap', function(e) {
			show('home');
			e.gesture.preventDefault();
			e.gesture.stopPropagation();
			e.preventDefault();
			e.stopPropagation();
		});
	}
});

/* info page */
$(function(){
	var infoDropElem = _('.busBoard .dropdown');
	if (!infoDropElem) { return ; }
	var chosedBusesElem = _('.chosedBuses'),
		choseBusesElem = _('.choseBuses'),
		busBoardElem = _('.busBoard'),
		busesMapElem = _('.busesMap');

	Hammer(infoDropElem).on('tap', function(e) {
		if (busBoardElem.classList.contains('fixedBottom')) {
			chosedBusesElem.classList.add('hide');
			choseBusesElem.classList.add('hide');
			busBoardElem.classList.remove('fixedBottom');
			busesMapElem.classList.remove('hide');
		} else if (chosedBusesElem.classList.contains('hide')) {
			chosedBusesElem.classList.remove('hide');
		} else {
			choseBusesElem.classList.remove('hide');
			busBoardElem.classList.add('fixedBottom');
			busesMapElem.classList.add('hide');
		}
		e.preventDefault();
		e.gesture.preventDefault();
	});
});
