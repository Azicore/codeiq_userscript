// ==UserScript==
// @name        CodeIQ history checker
// @namespace   jp.ne.sakura.azisava
// @description Highlight problems which you already challenged
// @include     https://codeiq.jp
// @include     https://codeiq.jp/*
// @run-at      document-end
// @version     0.1.0
// ==/UserScript==

var main = function($) {
	var msg = '[CodeIQ history checker] ';
	var path = location.pathname;
	var key = 'codeiq_history_checker';
	var obj = { last: null, log: {} };
	// 保存された設定があれば取得
	try {
		var historyCache = localStorage.getItem(key);
		if (historyCache) {
			obj = JSON.parse(historyCache);
		}
	} catch (e) {
		return;
	}
	
	// 挑戦履歴ページの場合
	if (path == '/my_challenge_after') {
		if (location.search) return;
		// 今日の日付
		var today = (function(d) {
			return d.getDate() + (d.getMonth() + 1) * 100 + d.getFullYear() * 10000;
		})(new Date());
		// 保存する最も古い日付（3ヶ月前）
		var limit = (function() {
			return +(today - 300 + '').replace(/^....(?:00|99|98)/, function(s) {
				return s - 88;
			});
		})();
		// 初回は3ヶ月前までチェックする
		if (!obj.last) obj.last = limit;
		// 古いデータは削除する
		for (var i in obj.log) {
			if (limit > obj.log[i]) delete obj.log[i];
		}
		// チェックの終了
		var finishCheck = function() {
			obj.last = today;
			localStorage.setItem(key, JSON.stringify(obj));
			$wmsg.remove();
			console.log(msg + 'Check completed.');
		};
		// 現在のページの履歴を全てチェックする
		var checkHistory = function($cur, pnum) {
			var date;
			$('div.timelineBlock02', $cur).each(function() {
				var $t = $(this);
				date = +$('p.titDate', $t).text().replace(/\D+(\d+)\D+(\d+)\D+(\d+)\D+/, function(s, $1, $2, $3) {
					return +$3 + $2 * 100 + $1 * 10000;
				});
				var qurl = $('li.snstw iframe', $t).attr('src') || $('li.snstw a', $t).attr('href');
				var qno = decodeURIComponent(qurl.replace(/^.+[&?]url=([^&]+).*$/, '$1')).split('/').pop();
				if (!isNaN(+qno) && !isNaN(date)) obj.log[qno] = date;
			});
			var $nextLink = $('li.pager__item--next a', $cur);
			console.log(msg + 'Completed page ' + pnum + '.');
			if (!date || obj.last > date || $nextLink.length == 0) {
				finishCheck();
			} else {
				$.ajax({
					url: $nextLink.attr('href'),
					dataType: 'html',
					success: function(html) {
						html = html
							.replace(/<(img|link) ([^>]+)>/g, '')
							.replace(/<(script|iframe)([ >])/g, '<!-- $1$2')
							.replace(/<\/(script|iframe)>/g, '</$1 -->');
						checkHistory($(html), pnum + 1);
					}
				});
			}
		};
		// チェックを開始する
		var $window = $(window);
		var $wmsg = $('<div>').css({
			width     : '560px',
			height    : '110px',
			padding   : '20px',
			background: '#000000',
			boxShadow : '0px 0px 16px #ffffff',
			color     : '#ffffff',
			fontWeight: 'bold',
			fontSize  : '12pt',
			textAlign : 'center',
			position  : 'fixed',
			left      : ($window.width() - 600) / 2 + 'px',
			top       : ($window.height() - 150) / 2 + 'px',
			lineHeight: '55px',
			opacity   : 0.9
		}).html('挑戦履歴を確認しています…<br>このページを表示したままにして、しばらくお待ち下さい。');
		checkHistory($('body').append($wmsg), 1);
	
	// 挑戦履歴以外のページの場合
	} else {
		var checkHistory = function(key, $target) {
			if (obj.log[key]) {
				console.log(msg + 'Question=' + key + '; Date=' + obj.log[key] + ';');
				$target.css('background', '#999999');
				$('a', $target).css('color', '#ccffdd');
			}
		};
		if (path == '/my_challenge_before') {
			$('div.timelineBlock02').each(function() {
				var $t = $(this);
				var key = $('a.todetail', $t).attr('href').split('/').pop();
				checkHistory(key, $t.add($('div.cassette', $t)));
			});
		} else if (path == '/' || path == '/q/search') {
			$('div.topListInBox, div.pickupBox').each(function() {
				var $t = $(this);
				var key = $('a', $t).attr('href').split('/').pop();
				checkHistory(key, $t);
			});
		}
	}
};

var el = document.createElement('script');
el.textContent = 'jQuery(' + main + ');';
document.body.appendChild(el);
