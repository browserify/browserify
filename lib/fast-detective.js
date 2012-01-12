
var requireExp = /(^|\s)require\(("|')?(.+?)\2\)/g;

exports.find = function(body) {
	var required = { strings: [], expressions: []}, match;
	while (match = requireExp.exec(body)) {
		var quote = match[2];
		var path = match[3];
		if (match[2]) required.strings.push(match[3]);
		else required.expressions.push(match[3]);
	}
	return required;
};