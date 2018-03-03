// ==UserScript==
// @name        CodeIQ bookmark sorting script
// @namespace   jp.ne.sakura.azisava
// @description Sort bookmarked questions in CodeIQ my page
// @include     https://codeiq.jp/my_challenge_before.php
// @include     https://codeiq.jp/my_challenge_before.php#*
// @run-at      document-end
// @version     0.1.1
// ==/UserScript==

var main = function($) {
	var msg = '[CodeIQ bookmark sorting script] ';
	var e = [];
	$('div.timelineBlock02').each(function() {
		var t = $(this);
		e.push([
			t,
			$('p.cdata_Limit', t).text().replace(/^\D+(\d+)\D(\d+)\D+([AP]M)(\d+)\D(\d+)\D.+$/, function(str, $1, $2, $3, $4, $5) {
				return (+$2 + $1 * 100 + 10000) + '' + (+$5 + $4 % 12 * 100 + ($3 == 'AM' ? 10000 : 20000));
			}),
			$('h2', t).text()
		]);
	}).remove();
	e.sort(function(a, b) {
		return a[1] > b[1] ? 1 : -1;
	});
	var p = $('div.mypageTimeline');
	for (var i = 0; e.length > i; i++) {
		p.append(e[i][0]);
		console.log(msg + 'Key=' + e[i][1] + '; Name="' + e[i][2] + '";');
	}
	console.log(msg + 'Sort completed.');
};

var el = document.createElement('script');
el.textContent = '(' + main + ')(jQuery);';
document.body.appendChild(el);
