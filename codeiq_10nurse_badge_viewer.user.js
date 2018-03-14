// ==UserScript==
// @name        CodeIQ 10 nurse badge viewer (2016 April fool)
// @namespace   jp.ne.sakura.azisava
// @description Display 10 nurses of CodeIQ badges
// @include     https://codeiq.jp/my_*
// @run-at      document-end
// @version     0.0.0
// ==/UserScript==

// ★通常のバッジ一覧表示をご希望の方はこちらへ：http://azisava.sakura.ne.jp/.ciquscr
var main = function($) {

'use strict';

var $badges = $('li.views-row > a img');
var nn = $badges.length;
for (var i = 0; 1000 - nn > i; i++) {
    $badges.push($badges[Math.random() * nn | 0]);
}
var n = $badges.length;
var $body = $('body');
var w = $(window).width();
var h = $(window).height();
var PI_2 = 2 * Math.PI; // 2π

// --------------------------------------------------------------------------------
// Badge Viewer
(function() {
	var cls = 'badgeViewer_'; // IDとクラス名のプレフィクス
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
				badges[i].clone().toggleClass(cls + 'badge').css({
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
					sortedBadges[i].hue += PI_2 * (i / pref.bpl.value | 0);
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
					$this.hue = (h + PI_2) % PI_2; // 色相
					$this.value = v / data.length; // 明度
					sortedBadges.push($this);
					loadFinish();
				};
				img.onerror = function() {
					$this.hue = PI_2;
					$this.value = 0;
					sortedBadges.push($this);
					loadFinish();
				};
				img.src = $this.attr('src');
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
			).on('click', function() {
				$('.' + cls + 'badgeFrame').fadeOut(function() { $(this).remove(); });
				$('.' + cls + 'badge').remove()
				$(window).off('.' + cls);
			}).addClass(cls + 'badgeFrame')
		);
		$(window).on('resize.' + cls, function() {
			w = $(window).width();
			$('.' + cls + 'badgeFrame').css('width', w);
			$('.' + cls + 'badge').remove();
			displayBadges();
		});
		displayBadges();
	};
	
	$('dt', $('.menuBlock').eq(1)).empty().append(
		$('<span>').html('Achievements').attr('title', 'クリックすると、あなたのバッジを見やすく並べて表示します。').css({
			textDecoration: 'underline',
			cursor: 'pointer'
		}).on('click', start)
	);
	
})();

// ★10ナースのバッジボールはめちゃくちゃ重くてブラウザがフリーズしたのでｗ、やめておいた方がいいです(^^;
// --------------------------------------------------------------------------------
// Badge Ball
/*(function() {
	var cls = 'badgeBall_'; // IDとクラス名のプレフィクス
	var enabled = false; // 起動中フラグ
	
	var points = [];                 // 位置ベクトル（Pointオブジェクト）
	var pointsXYZ = [];              // 位置ベクトル（PointXYZオブジェクト）
	var r = 200;                     // 球体の半径
	var s = 4 * Math.PI * r * r / n; // 要素1つあたりの表面積
	var sr = Math.sqrt(s) * 0.45;    // 要素の半径
	var sd = sr * 2;                 // 要素の直径
	
	var k = 0.4 / n;                 // 斥力の定数
	var maxTrial = 400;              // 最大試行回数
	var limit = 0.001;               // 計算停止時の平均移動量
	var dragRatio = 0.003;           // ドラッグ量に対する角度変化の比
	var rotationDecay = 0.9;         // 慣性回転の減衰
	
	// 緯度経度によって球面位置を表すクラス
	var Point = function(lon, lat) {
		this.lon = lon; // 経度（0～2π）
		this.lat = lat; // 緯度（-π/2～π/2）
	};
	Point.prototype = {
		_checkArg: function(arg) {
			return arg > 1 ? 1 : -1 > arg ? -1 : arg;
		},
		// 自身から見た与えられた点の方向と距離を返す
		getRelativePositionOf: function(p) {
			var cos = { t: Math.cos(this.lat), p: Math.cos(p.lat), z: Math.cos(p.lon - this.lon) };
			var sin = { t: Math.sin(this.lat), p: Math.sin(p.lat), z: Math.sin(p.lon - this.lon) };
			cos.x = sin.t * sin.p + cos.t * cos.p * cos.z;
			var x = Math.acos(cos.x);
			sin.x = Math.sin(x);
			var d = Math.acos(this._checkArg((sin.p - sin.t * cos.x) / (cos.t * sin.x)));
			if (0 > sin.z) d = PI_2 - d;
			return { dist: x, dir: d };
		},
		// 与えられた方向と距離だけ自身を移動する
		moveTo: function(v) {
			var x = v.dist, d = v.dir;
			var cos = { t: Math.cos(this.lat), x: Math.cos(x), d: Math.cos(d) };
			var sin = { t: Math.sin(this.lat), x: Math.sin(x), d: Math.sin(d) };
			sin.p = sin.t * cos.x + cos.t * sin.x * cos.d;
			var p = Math.asin(sin.p);
			cos.p = Math.cos(p);
			var z = Math.acos(this._checkArg((cos.x - sin.t * sin.p) / (cos.t * cos.p)));
			this.lon = (0 > sin.d ? this.lon + PI_2 - z : this.lon + z) % PI_2;
			this.lat = p;
		},
		// 与えられた点が同じ位置かどうかを返す
		equals: function(p) {
			return this.lon == p.lon && this.lat == p.lat;
		},
		// xyz座標を返す
		getXYZ: function(r) {
			if (!r) r = 1;
			var t = r * Math.cos(this.lat);
			return new PointXYZ(t * Math.sin(this.lon), -r * Math.sin(this.lat), t * Math.cos(this.lon));
		}
	};
	
	// xyz座標によって球面位置を表すクラス
	var PointXYZ = function(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	};
	PointXYZ.prototype = {
		// x軸を中心にyz平面で回転する
		rotateX: function(t) {
			var y = this.y;
			var cos = Math.cos(t), sin = Math.sin(t);
			this.y = cos * y - sin * this.z;
			this.z = sin * y + cos * this.z;
		},
		// y軸を中心にxz平面で回転する
		rotateY: function(t) {
			var x = this.x;
			var cos = Math.cos(t), sin = Math.sin(t);
			this.x = cos * x - sin * this.z;
			this.z = sin * x + cos * this.z;
		},
		// 経度と緯度を返す
		getLonLat: function() {
			return new Point(
				(Math.atan2(this.x, this.z) + PI_2) % PI_2,
				-Math.atan2(this.y, Math.sqrt(this.x * this.x + this.z * this.z))
			);
		}
	};
	
	// 全画像を配置
	var renderElements = function(scale) {
		if (!enabled) return;
		if (!scale) scale = 1;
		var $img = $('img.' + cls + 'badge').show();
		// img要素が無い場合は生成
		if ($img.length == 0) {
			$badges.each(function() {
				$body.append($('<img>').addClass(cls + 'badge').attr('src', $(this).attr('src')));
			});
			$img = $('img.' + cls + 'badge');
		}
		var sds = sd * scale;
		var srs = sr * scale;
		for (var i = 0; points.length > i; i++) {
			var p = points[i];
			var c = pointsXYZ[i];
			$img.eq(i).css({
				width     : sds + 'px',
				height    : sds + 'px',
				opacity   : 0.9,
				position  : 'absolute',
				left      : w / 2 - srs + 'px',
				top       : Math.max(250, h / 2) - srs + 'px',
				zIndex    : (c.z + r) * 10 | 0,
				transform : 'perspective(400px)'
					+ ' translate3d(' + c.x * scale + 'px, ' + c.y * scale + 'px, ' + c.z * scale + 'px)'
					+ ' rotate3d(' + Math.cos(p.lon) + ', 0, ' + Math.sin(-p.lon) + ', ' + p.lat + 'rad)'
					+ ' rotateY(' + p.lon + 'rad)'
			});
		}
	};
	
	// 全体を回転
	var rotateElements = function(x, y) {
		for (var i = 0; pointsXYZ.length > i; i++) {
			pointsXYZ[i].rotateY(x * dragRatio);
			pointsXYZ[i].rotateX(y * dragRatio);
			points[i] = pointsXYZ[i].getLonLat();
		}
	};
	
	// イベントを登録
	var prepareEvents = function() {
		var dragging = false;
		var x, y;
		var inertia = null;
		var $html = $('html');
		// マウスドラッグによる回転
		$html.on('mousedown.' + cls, function(e) {
			e.preventDefault();
			dragging = true;
			inertia && clearInterval(inertia);
			x = y = null;
			$html.css('cursor', 'move');
		}).on('mousemove.' + cls, function(e) {
			if (!dragging) return;
			e.preventDefault();
			var xtmp = e.pageX;
			var ytmp = e.pageY;
			if (x != null && y != null) {
				rotateElements(x - xtmp, y - ytmp);
			}
			x = xtmp;
			y = ytmp;
			renderElements();
		}).on('mouseup.' + cls, function(e) {
			dragging = false;
			if (x != null && y != null) {
				var xtmp = x - e.pageX;
				var ytmp = y - e.pageY;
				inertia = setInterval(function() {
					rotateElements(xtmp, ytmp);
					renderElements();
					xtmp *= rotationDecay;
					ytmp *= rotationDecay;
					if (!enabled || 0.1 > Math.abs(xtmp) && 0.1 > Math.abs(ytmp)) {
						clearInterval(inertia);
						inertia = null;
					}
				}, 50);
			}
			$html.css('cursor', 'default');
		});
		// ウインドウリサイズ
		$(window).on('resize.' + cls, function() {
			w = $(window).width();
			h = $(window).height();
			$('#' + cls + 'background').width(w);
			renderElements();
		});
		// 閉じるボタン
		$body.append(
			$('<div>').css({
				position: 'absolute',
				right   : '8px',
				top     : '36px',
				fontSize: '48px',
				color   : '#666666',
				cursor  : 'pointer'
			}).html('&times;').attr('title', '閉じる').on('click', function() {
				enabled = false;
				$('#' + cls + 'background').fadeOut(function() { $(this).remove(); });
				$('img.' + cls + 'badge').hide();
				$(this).remove();
				$('html').off('.' + cls);
				$(window).off('.' + cls);
			})
		);
	};
	
	// 出現アニメーション
	var appearBall = function() {
		var totalStep = 20;
		var step = 0;
		var timer = setInterval(function() {
			if (!enabled) {
				clearInterval(timer);
			} else if (++step == totalStep) {
				clearInterval(timer);
				prepareEvents();
				renderElements();
			} else {
				var x = step / totalStep;
				renderElements(x * (1.8 - x) / 0.8); // 二次曲線：f(x)=x(x-2m)/(1-2m) (m=0.9)
			}
		}, 50);
	};
	
	// 要素と座標の準備
	var start = function() {
		enabled = true;
		// 全画面を覆う<div>を生成
		$body.append(
			$('<div>').attr('id', cls + 'background').css({
				width     : w,
				height    : $body.height(),
				position  : 'absolute',
				left      : 0,
				top       : 0,
				background: '#fff',
				opacity   : 0.9
			})
		);
		// 座標が未計算の場合
		if (points.length == 0) {
			// メッセージ
			var $msg = $('<div>').attr('id', cls + 'message').css({
				position : 'absolute',
				left     : 0,
				top      : '48px',
				width    : w,
				textAlign: 'center',
				fontSize : '24px'
			}).html('計算中です。少々お待ち下さい。');
			$body.append($msg);
			// 初期配置（ランダム）
			for (var i = 0; n > i; i++) {
				points.push(new Point(Math.random() * PI_2, (Math.random() - 0.5) * Math.PI));
			}
			// 斥力シミュレーション
			var timer = setInterval(function() {
				var e = 0, etmp;
				for (var i = 0; points.length > i; i++) {
					var p = points[i];
					var f = { x: 0, y: 0 };
					for (var j = 0; points.length > j; j++) {
						var q = points[j];
						if (p.equals(q)) {
							continue;
						}
						var v = p.getRelativePositionOf(q);
						var t = -k / (v.dist * v.dist);
						f.x += t * Math.cos(v.dir);
						f.y += t * Math.sin(v.dir);
					}
					p.moveTo({
						dist: etmp = Math.sqrt(f.x * f.x + f.y * f.y),
						dir : Math.atan2(f.y, f.x)
					});
					pointsXYZ[i] = p.getXYZ(r);
					e += etmp;
				}
				if (!enabled) {
					clearInterval(timer);
				} else if (limit * n > e || --maxTrial == 0) {
					clearInterval(timer);
					$msg.remove();
					appearBall();
				}
			}, 0);
		// 座標が計算済みの場合
		} else {
			appearBall();
		}
	};
	
	// 起動ボタン
	$('dt', $('.menuBlock').eq(1)).append(
		$('<img>').attr('src',
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAIAAADZrBkAAAAAAXNSR0IArs' +
			'4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACZSURBVDhPlZBRDoAgDEO5OY' +
			'fjYFrtfEwyNb4P7NYWEttC732MsV1IaxNeiQvO6aRz7h7KtnUiVEMjIm3yFqEa1pIJmAkJ10Tp3gYSgl' +
			'odKKOi1POKz6gotD48+B71U7PGHKuTRQvfHnueErZLHPADd/XrT+YhJ6iV7oFnewjXiObMhC1CNTQi0h' +
			'l7tnWqhraIXAkd8134QWs7uFtlwYH/w6UAAAAASUVORK5CYII='
		).attr('title', 'バッジボール').css({
			cursor: 'pointer',
			marginLeft: '8px'
		}).on('click', start)
	);
})();*/

};

var el = document.createElement('script');
el.textContent = 'jQuery(' + main + ');';
document.body.appendChild(el);
