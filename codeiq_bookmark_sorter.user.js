// ==UserScript==
// @name        CodeIQ bookmark sorting script
// @namespace   jp.ne.sakura.azisava
// @description Sort bookmarked questions in CodeIQ my page
// @include     https://codeiq.jp/my_challenge_before
// @include     https://codeiq.jp/my_challenge_before*
// @run-at      document-end
// @version     0.2.2
// ==/UserScript==

var main = function($) {
	var msg = '[CodeIQ bookmark sorting script] ';
	var e = [];
	var mon = new Date().getMonth() + 1;
	$('div.timelineBlock02').each(function() {
		var t = $(this);
		e.push([
			t,
			$('p.cdata_Limit', t).text().replace(/([AP]M)(\d+)/, function(str, $1, $2) {
				return $1 == 'AM' ? $2 % 12 : 12 > +$2 ? +$2 + 12 : $2;
			}).replace(/^\D+(\d+)\D(\d+)\D+(\d+)\D(\d+)\D.+$/, function(str, $1, $2, $3, $4) {
				return (mon > +$1 ? 2 : 1) * 1e8 + $1 * 1e6 + $2 * 1e4 + $3 * 100 + $4 * 1;
			}),
			$('h2', t).text()
		]);
	}).remove();
	e.sort(function(a, b) {
		return a[1] > b[1] ? 1 : -1;
	});
	$('div.view-content').eq(1).children().each(function() {
		var g = e.shift();
		$(this).append(g[0]);
		console.log(msg + 'Key=' + g[1] + '; Name="' + g[2] + '";');
	});
	console.log(msg + 'Sort completed.');
};

var el = document.createElement('script');
el.textContent = 'jQuery(' + main + ');';
document.body.appendChild(el);
