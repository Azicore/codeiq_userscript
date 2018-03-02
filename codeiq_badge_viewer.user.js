// ==UserScript==
// @name        CodeIQ badge viewer
// @namespace   jp.ne.sakura.azisava
// @description Display all CodeIQ badges you have
// @include     https://codeiq.jp/my_*
// @version     0.1.0
// ==/UserScript==

var main = function($) {
	var cls = 'badgeViewer_'; // IDとクラス名のプレフィクス
	var $badges = $('img.tTip');
	var $body = $('body');
	var w = $(window).width();
	var n = $badges.size(); // バッジ数
	var pi2 = 2 * Math.PI;
	var badgeSize = 216; // バッジ画像の本来のサイズ
	var processing = false; // 処理中フラグ
	var pref = {
		frameWidth: { value: 864, step: 18, unit: 'px', min: 180 },   // 全体フレームの幅
		bpl       : { value:  10, step:  1, unit: '個', min:   3 },   // 1段あたりの個数
		frame     : { value:   1, step:  0, text: ['なし', 'あり'] }, // フレームのあり・なし
		colorSort : { value:   0, step:  0, text: ['OFF', 'ON'] }     // 色彩ソートのON・OFF
	};
	var key = 'codeiq_badge_viewer';
	var localStorageAvailable = true;
	// 保存された設定があれば取得
	try {
		var prefCache = localStorage.getItem(key);
		if (prefCache) {
			var prefList = prefCache.split(',');
			for (var i = 0; prefList.length > i; i++) {
				var prefItem = prefList[i].split('=');
				pref[prefItem[0]].value = +prefItem[1];
			}
		}
	} catch (e) {
		localStorageAvailable = false;
	}
	// ボタン用のCSS
	var btncss = {
		margin: '0px 4px',
		padding: '0.25em 0.75em',
		borderRadius: '1.0em',
		background: '#cccccc',
		fontWeight: 'bold',
		userSelect: 'none',
		'-webkit-user-select': 'none',
		cursor: 'pointer'
	};
	var margincss = { marginLeft: '24px' };
	var boldcss = { fontWeight: 'bold' };
	// 各ボタンクリック時の関数
	var buttonClick = function(e) {
		if (processing) return false;
		processing = true;
		e.stopPropagation();
		var $this = $(this);
		var type = $this.attr('data-value-name');
		var p = pref[type];
		// ＋/－系ボタン
		if (p.step) {
			var sign = $this.html() == '+' ? 1 : -1;
			p.value += sign * p.step;
			if (p.min > p.value) p.value = p.min;
			$('#' + cls + type).html(p.value + p.unit);
		// ON/OFF系ボタン
		} else {
			p.value = +!p.value;
			$('#' + cls + type).html(p.text[p.value]);
		}
		// 設定を保存
		if (localStorageAvailable) {
			var prefList = [];
			for (var i in pref) {
				prefList.push(i + '=' + pref[i].value);
			}
			localStorage.setItem(key, prefList.join(','));
		}
		// バッジを再描画
		displayBadges();
	};
	var $button = function(html, name) {
		return $('<span>').html(html).css(btncss).attr('data-value-name', name).on('click', buttonClick);
	};
	var $span = function(html, css) {
		return $('<span>').html(html).css(css);
	};
	var appendBadges = function(badges) {
		var frameWidth   = pref.frameWidth.value;
		var bpl          = pref.bpl.value;
		var paddingRatio = 0.55; // 上下左右のパディング（バッジの幅に対する比）
		var marginRatio  = 0.1;  // バッジとバッジの間のマージン（バッジの幅に対する比）
		var badgeWidth   = frameWidth / (bpl + (bpl - 1) * marginRatio + 2 * paddingRatio);
		var textHeight   = frameWidth / 20;
		var basePosition = 90;  // フレーム最上部の位置
		$('.' + cls + 'badge').remove();
		for (var i = 0; badges.length > i; i++) {
			$body.append(
				badges[i].clone().toggleClass('tTip ' + cls + 'badge').css({
					position: 'absolute',
					width   : badgeWidth + 'px', height: badgeWidth + 'px',
					left    : (w - frameWidth) / 2 + (paddingRatio + i % bpl * (1 + marginRatio)) * badgeWidth,
					top     : ((i / bpl | 0) * (1 + marginRatio) + 2 * paddingRatio) * badgeWidth + textHeight + basePosition
				})
			);
		}
		// フレームとテキストを表示
		$body.append(
			$('<div>').css({
				position  : 'absolute',
				width     : frameWidth - 2 * pref.frame.value + 'px',
				height    : (Math.ceil(n / bpl) * (1 + marginRatio) - marginRatio + 3 * paddingRatio) * badgeWidth + textHeight - 2 * pref.frame.value + 'px',
				left      : (w - frameWidth) / 2,
				top       : basePosition + 'px',
				border    : pref.frame.value ? '1px solid #999999' : '0px',
				lineHeight: textHeight + 2 * paddingRatio * badgeWidth + 'px',
				fontSize  : textHeight + 'px',
				textAlign : 'center'
			}).addClass(cls + 'badge').html('You have ' + n + ' badges!')
		);
		processing = false;
	};
	var displayBadges = function() {
		// 色彩ソートをする場合
		if (pref.colorSort.value) {
			var sortedBadges = [];
			$body.append($('<canvas>').attr({ width: badgeSize, height: badgeSize }).attr('id', cls + 'badgeCanvas').css('display', 'none'));
			var ctx = $('#' + cls + 'badgeCanvas')[0].getContext('2d');
			var loadFinish = function() {
				if ($badges.length > sortedBadges.length) return false;
				$('#' + cls + 'badgeCanvas').remove();
				// 明度でソート
				sortedBadges.sort(function(a, b) {
					return a.value > b.value ? -1 : 1;
				});
				// 各段ごとに色相でソート
				for (var i = 0; sortedBadges.length > i; i++) {
					sortedBadges[i].hue += pi2 * (i / pref.bpl.value | 0);
				}
				sortedBadges.sort(function(a, b) {
					return a.hue > b.hue ? 1 : -1;
				});
				// バッジを表示
				appendBadges(sortedBadges);
			};
			$badges.each(function(i) {
				var $this = $(this);
				var img = new Image();
				img.src = $this.attr('src');
				img.onload = function() {
					ctx.drawImage(img, 0, 0);
					var data = ctx.getImageData(0, 0, badgeSize, badgeSize).data;
					var hy = 0;
					var hx = 0;
					var v = 0;
					for (var i = 0; data.length > i; i += 4) {
						var r = data[i];
						var g = data[i + 1];
						var b = data[i + 2];
						hy += g - b;
						hx += 2 * r - g - b;
						v += r > g ? r > b ? r : b : g > b ? g : b;
					}
					var h = Math.atan2(Math.sqrt(3) * hy, hx);
					$this.hue = (h + pi2) % pi2; // 色相
					$this.value = v / data.length; // 明度
					sortedBadges.push($this);
					loadFinish();
				};
			});
		// 色彩ソートをしない場合
		} else {
			var badges = [];
			$badges.each(function() {
				badges.push($(this));
			});
			// バッジを表示
			appendBadges(badges);
		}
	};
	var start = function() {
		$body.append(
			// 全画面を覆う<div>を生成
			$('<div>').css({
				width     : w,
				height    : $body.height(),
				position  : 'absolute',
				left      : 0,
				top       : 0,
				background: '#fff'
			}).append(
				// 上部にボタン類を表示
				$('<div>').css({
					padding: '8px 8px 0px',
					lineHeight: '1.5'
				}).append(
					$span('枠線：', {}),
					$button(pref.frame.text[pref.frame.value], 'frame').attr('id', cls + 'frame'),
					$span('全体幅：', margincss),
					$span(pref.frameWidth.value + pref.frameWidth.unit, boldcss).attr('id', cls + 'frameWidth'),
					$button('+', 'frameWidth'),
					$button('&minus;', 'frameWidth'),
					$span('1段の個数：', margincss),
					$span(pref.bpl.value + pref.bpl.unit, boldcss).attr('id', cls + 'bpl'),
					$button('+', 'bpl'),
					$button('&minus;', 'bpl'),
					$span('色彩ソート：', margincss),
					$button(pref.colorSort.text[pref.colorSort.value], 'colorSort').attr('id', cls + 'colorSort')
				).on('click', function(e) {
					e.stopPropagation();
				})
			// ボタン以外をクリック時は全て消去
			).click(function() {
				$('.' + cls + 'badgeFrame, .' + cls + 'badge').remove()
			}).addClass(cls + 'badgeFrame')
		);
		displayBadges();
	};
	$(function() {
		$('dt', $('.menuBlock').eq(1)).attr('title', 'クリックすると、あなたのバッジを見やすく並べて表示します。').css({
			textDecoration: 'underline',
			cursor: 'pointer'
		}).on('click', start);
	});
};

window.onload = function() {
	var el = document.createElement('script');
	el.textContent = '(' + main + ')(jQuery);';
	document.body.appendChild(el);
};
