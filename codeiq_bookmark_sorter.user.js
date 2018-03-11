// ==UserScript==
// @name        CodeIQ bookmark sorting script
// @namespace   jp.ne.sakura.azisava
// @description Sort bookmarked questions in CodeIQ my page
// @include     https://codeiq.jp/my_challenge_before
// @include     https://codeiq.jp/my_challenge_before*
// @run-at      document-end
// @version     0.3.0
// ==/UserScript==

var main = function($) {
	var msg = '[CodeIQ bookmark sorting script] ';
	var e = [];
	var mon = new Date().getMonth() + 1;
	var page = 1;
	var gather = function($body, callback) {
		console.log(msg + 'Gathering page ' + page++ + '...');
		$('.view-display-id-codeiq_mypage_challenge_before > .view-content > div', $body).each(function() {
			var $t = $(this);
			e.push([
				$t,
				$('.cdata_Limit > strong', $t).text().replace(/([AP]M)(\d+)/, function(str, $1, $2) {
					return $1 == 'AM' ? $2 % 12 : 12 > +$2 ? +$2 + 12 : $2;
				}).replace(/^\D+(\d+)\D(\d+)\D+(\d+)\D(\d+)$/, function(str, $1, $2, $3, $4) {
					return (mon > +$1 ? 2 : 1) * 1e8 + $1 * 1e6 + $2 * 1e4 + $3 * 100 + $4 * 1;
				}),
				$('h2', $t).text()
			]);
		});
		var $next = $('.pager__item--next > a', $body);
		if ($next.length) {
			$.ajax({
				url: $next.attr('href'),
				dataType: 'html',
				success: function(html) {
					html = html
						.replace(/<(img|link) ([^>]+)>/g, '')
						.replace(/<(script|iframe)([ >])/g, '<!-- $1$2')
						.replace(/<\/(script|iframe)>/g, '</$1 -->');
					gather($(html), callback);
				},
				error: function() {
					console.log(msg + 'Error occurred.');
				}
			});
		} else {
			callback();
		}
	};
	gather($('body'), function() {
		e.sort(function(a, b) {
			return a[1] > b[1] ? 1 : -1;
		});
		var $d = $('.view-display-id-codeiq_mypage_challenge_before > .view-content').empty();
		for (var i = 0; e.length > i; i++) {
			var $g = e[i][0];
			$g.attr('class', '').addClass('views-row ' + (i % 2 ? 'views-row-odd' : 'views-row-even'));
			(i == 0 || i == e.length - 1) && $g.addClass(i ? 'views-row-last' : 'views-row-first');
			var $m = $('.titDate > a', $g);
			$('img', $m).length || $m.prepend('<img src="/sites/all/themes/codeiq/images/btn_delete.gif" width="19" height="19" alt="íœ">');
			$d.append($g);
			console.log(msg + 'Key=' + e[i][1] + '; Name="' + e[i][2] + '";');
		}
		$('ul.pager').empty();
		console.log(msg + 'Sort completed.');
	});
};

var el = document.createElement('script');
el.textContent = 'jQuery(' + main + ');';
document.body.appendChild(el);
