// ==UserScript==
// @name        CodeIQ badge question filter
// @namespace   jp.ne.sakura.azisava
// @description Change background color of badge questions in CodeIQ top page
// @include     https://codeiq.jp/
// @include     https://codeiq.jp/#*
// @run-at      document-end
// @version     0.1.2
// ==/UserScript==

var main = function($) {
	var msg = '[CodeIQ badge question filter] ';
	var css = { background: '#fc6' }; // バッジ問題に設定する背景色
	var key = 'codeiq_badge_questions'; // localStorageのキー
	var cache;
	// localStorageが使えない環境では実行しない
	try {
		cache = (localStorage.getItem(key) || '').split(',');
	} catch (e) {
		console.log(msg + 'Error: localStorage is not available.');
		return false;
	}
	// 現在のキャッシュデータをハッシュに入れる
	var hash = {};
	for (var i = 0; cache.length > i; i++) {
		var c = cache[i].split('=');
		hash[c[0]] = c[1];
	}
	cache = [];
	var $q = $('div.cassette, div.alink');
	var rnum = $q.size();
	var finish = function() {
		// 全問題を確認し終わったときの処理
		if (!--rnum) {
			// 新たなキャッシュデータをlocalStorageに保存する
			localStorage.setItem(key, cache.join(','));
			console.log(msg + 'Check completed.');
		}
	};
	// 掲載中の全ての問題についてくり返す
	$q.each(function() {
		var $t = $(this);
		var $l = $('a', $t);
		// 空のブロックは無視する
		if (!$l.size()) {
			finish();
			return true;
		}
		var s = $t.hasClass('cassette');
		var title = $(s ? 'h2' : 'h5', $t).text();
		var $a = s ? $t : $t.prev();
		// ウチに来ない？問題はスキップする
		if ($('img[src="/simg/icon/101.png"]', $a).size()) {
			console.log(msg + 'Check skipped: "' + title + '"');
			finish();
			return true;
		}
		var url = $l.last().attr('href');
		var qnum = url.split('/').pop();
		// キャッシュに存在する問題の場合、キャッシュのデータに従う
		if (hash[qnum]) {
			var b = hash[qnum] == 'y'; // バッジ問題かどうか
			b && $t.css(css);
			cache.push(qnum + '=' + (b ? 'y' : 'n'));
			console.log(msg + 'Cache hit: "' + title + '"');
			finish();
			return true;
		}
		// キャッシュに存在しない問題の場合、問題ページを確認しに行く
		$.ajax({
			url: url,
			dataType: 'html',
			title: title,
			qnum: qnum,
			success: function(html) {
				html = html
					.replace(/<img src="\/img\/tit_sub09\.gif"[^>]+>/, '<span class="badgecheck"></span>')
					.replace(/<(img|link) ([^>]+)>/g, '')
					.replace(/<(script|iframe)([ >])/g, '<!-- $1$2')
					.replace(/<\/(script|iframe)>/g, '</$1 -->');
				var $c = $('span.badgecheck', html);
				var b = $c.size() && $c.parent().next().text().indexOf('バッジ') >= 0; // バッジ問題かどうか
				b && $t.css(css);
				cache.push(this.qnum + '=' + (b ? 'y' : 'n'));
				console.log(msg + 'Check completed: "' + this.title + '"');
			},
			error: function() {
				console.log(msg + 'Check failed: "' + this.title + '"');
			},
			complete: finish
		});
	});
};

var el = document.createElement('script');
el.textContent = '(' + main + ')(jQuery);';
document.body.appendChild(el);
