// ==UserScript==
// @name        CodeIQ badge question filter
// @namespace   jp.ne.sakura.azisava
// @description Change background color of badge questions in CodeIQ top page
// @include     https://codeiq.jp/
// @include     https://codeiq.jp/#*
// @include     https://codeiq.jp/q/search*
// @run-at      document-end
// @version     0.2.2
// ==/UserScript==

var main = function($) {
	var msg = '[CodeIQ badge question filter] ';
	var css = { background: '#fc6' }; // バッジ問題に設定する背景色
	var key = 'codeiq_badge_questions'; // localStorageのキー
	var maxlog = 200; // キャッシュする問題数の上限
	var cache;
	// localStorageが使えない環境では実行しない
	try {
		var lsval = localStorage.getItem(key);
		cache = lsval ? lsval.split(',') : [];
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
	var $q = $('a.panel-codeiq, a.pickupBox[href*="site_type=0"], a.panel-item[href*="site_type=0"]');
	var qnum = $q.length;
	var finish = function() {
		// 全問題を確認し終わったときの処理
		if (!--qnum) {
			for (var i in hash) if (i !== '') cache.push(i + '=' + hash[i]);
			// 古いキャッシュを消去する
			cache.length = Math.min(cache.length, maxlog);
			// 新たなキャッシュデータをlocalStorageに保存する
			localStorage.setItem(key, cache.join(','));
			console.log(msg + 'Check completed.');
		}
	};
	// 掲載中の全ての問題についてくり返す
	var qlist = {};
	$q.each(function() {
		var $t = $(this);
		var qid = $t.attr('href').match(/\d+$/)[0];
		var $e = qlist[qid];
		qlist[qid] = $e ? $e.add($t) : $t;
	});
	$.each(qlist, function(qid, $t) {
		var $h = $t.find('.panel-title, .pickupBox-title, .item-title').eq(0);
		var title = $h.text().replace(/^[ \n]+|[ \n]+$/g, '');
		var url = '/q/' + qid;
		// 各問題に対する処理
		var check = function(isBadge) {
			if (isBadge) $t.css(css);
			cache.push(qid + '=' + (isBadge ? 'y' : 'n'));
			delete hash[qid];
		};
		// キャッシュに存在する問題の場合、キャッシュのデータに従う
		if (hash[qid]) {
			var isBadge = hash[qid] == 'y'; // バッジ問題かどうか
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
				var isBadge = $c.length && $c.parent().next().text().indexOf('バッジ') >= 0; // バッジ問題かどうか
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
