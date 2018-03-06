// ==UserScript==
// @name        CodeIQ tag esolangifier (2015 April fool)
// @namespace   jp.ne.sakura.azisava
// @description Change language tags to esolangs
// @include     https://codeiq.jp
// @include     https://codeiq.jp/*
// @run-at      document-end
// @version     0.1.0
// ==/UserScript==

var main = function($) {
	var key = 'codeiq_tag_esolangifier';
	var tags = {
		// 自分の好みのワードに変更しましょう。
		typeIcon: ['Brainf**k', 'Whitespace', 'Intercal', 'Unlambda', 'Perl6', 'Befunge', 'Piet'],
		typeIcon02: ['コードゴルフ', '変態コード', '通常言語選択可能', '要職人技', '発病注意']
	};
	var tags2 = {
		'question-bomb': 'typeIcon',
		'tag': 'typeIcon02'
	};
	var i;
	$('div.topListText,div.cdata_codeType').each(function() {
		for (var k in tags) {
			i = -1;
			$('div.' + k, this).each(function() {
				i += 1 + Math.random() * 1.5 | 0;
				var $t = $(this);
				tags[k][i] ? $t.html(tags[k][i]) : $t.remove();
			});
		}
		for (var k in tags2) {
			i = -1;
			$('div.field--name-field-' + k + ' div.field__item', this).each(function() {
				i += 1 + Math.random() * 1.5 | 0;
				var $t = $(this), j = tags2[k];
				tags[j][i] ? $t.html(tags[j][i]) : $t.remove();
			});
		}
	});
	for (var k in tags) {
		i = 0;
		$('#sidebar-tagcloud div.' + k + ' a').each(function() {
			var $t = $(this);
			tags[k][i] ? $t.html(tags[k][i++]).on('click', function() {
				sessionStorage.setItem(key, $(this).html());
			}) : $t.parent().remove();
		});
	}
	var l = sessionStorage.getItem(key);
	l && $('p.search_title').html(l + 'の問題一覧');
	sessionStorage.removeItem(key);
};

var el = document.createElement('script');
el.textContent = 'jQuery(' + main + ');';
document.body.appendChild(el);
