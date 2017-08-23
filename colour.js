var dim = "\x1b[2m"
var blue = "\x1b[34m"
var bold = "\x1b[1m"
var green = "\x1b[32m"
var reset = "\x1b[0m"

module.exports = {
	dim: function(string){
		return dim + string + reset
	},
	blue: function(string){
		return blue + string + reset
	},
	green: function(string){
		return green + string + reset
	},
	bold: function(string){
		return bold + string + reset
	}
}