// ==UserScript==
// @name        CodeIQ badge question filter
// @namespace   jp.ne.sakura.azisava
// @description Change background color of badge questions in CodeIQ top page
// @include     https://codeiq.jp/
// @include     https://codeiq.jp/#*
// @include     https://codeiq.jp/q/search*
// @run-at      document-end
// @version     0.2.1
// ==/UserScript==

var main = function($) {
	var msg = '[CodeIQ badge question filter] ';
	var css = [ // バッジ問題に設定する背景色
		{ background: '#f30' }, // 未挑戦、かつ、あとで挑戦に未登録
		{ background: '#fc6' }  // 挑戦済み、または、あとで挑戦に登録済み
	];
	var key = 'codeiq_badge_questions'; // localStorageのキー
	var maxlog = 200; // キャッシュする問題数の上限
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
	var $q = $('.topListBox');
	var rnum = $q.size();
	var finish = function() {
		// 全問題を確認し終わったときの処理
		if (!--rnum) {
			for (var i in hash) cache.push(i + '=' + hash[i]);
			// 古いキャッシュを消去する
			cache.length = Math.min(cache.length, maxlog);
			// 新たなキャッシュデータをlocalStorageに保存する
			localStorage.setItem(key, cache.join(','));
			console.log(msg + 'Check completed.');
		}
	};
	// 掲載中の全ての問題についてくり返す
	$q.each(function() {
		var $t = $(this);
		var $h = $('h3', $t);
		var confirmed = $('.unflag-action', $t).length > 0 || $('img[alt="挑戦済み"]', $t).length > 0;
		var title = $h.text();
		var url = $('a', $h).attr('href');
		var qnum = url.split('/').pop();
		// 各問題に対する処理
		var check = function(isBadge) {
			if (isBadge) {
				$t.css(css[+confirmed]);
				$t.on('click', '.flag', function() {
					confirmed = !confirmed;
					$t.css(css[+confirmed]);
				});
			}
			cache.push(qnum + '=' + (isBadge ? 'y' : 'n'));
			delete hash[qnum];
		};
		// キャッシュに存在する問題の場合、キャッシュのデータに従う
		if (hash[qnum]) {
			var isBadge = hash[qnum] == 'y'; // バッジ問題かどうか
			check(isBadge);
			console.log(msg + 'Cache hit: "' + title + '"');
			finish();
			return true;
		}
		// キャッシュに存在しない問題の場合、問題ページを確認しに行く
		$.ajax({
			url: url,
			dataType: 'html',
			success: function(html) {
				html = html
					.replace(/<img src="[^"]*tit_sub09\.gif"[^>]+>/, '<span class="badgecheck"></span>')
					.replace(/<(img|link) ([^>]+)>/g, '')
					.replace(/<(script|iframe)([ >])/g, '<!-- $1$2')
					.replace(/<\/(script|iframe)>/g, '</$1 -->');
				var $c = $('span.badgecheck', html);
				var isBadge = $c.size() && $c.parent().next().text().indexOf('バッジ') >= 0; // バッジ問題かどうか
				check(isBadge);
				console.log(msg + 'Check success: "' + title + '"');
			},
			error: function() {
				console.log(msg + 'Check failed: "' + title + '"');
			},
			complete: finish
		});
	});
};

var el = document.createElement('script');
el.textContent = 'jQuery(' + main + ');';
document.body.appendChild(el);
