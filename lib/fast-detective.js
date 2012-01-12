
var requireExp = /(^|\s)require\(("|')?(.+?)\2\)/g;

exports.find = function(body) {
	var required = { strings: [], expressions: []}, match;
	while (match = requireExp.exec(body)) {
		var quote = match[2];
		var path = match[3];
		if (quote) required.strings.push(path);
		else required.expressions.push(path);
	}
	return required;
};