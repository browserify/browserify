
var requireExp = /\brequire\(("|')?(.+?)\1\)/g;

exports.find = function(body) {
	var required = { strings: [], expressions: []}, match;
	while (match = requireExp.exec(body)) {
		if (match[1]) required.strings.push(match[2]);
		else required.expressions.push(match[2]);
	}
	return required;
};