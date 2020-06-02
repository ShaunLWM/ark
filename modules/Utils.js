const filenamify = require("filenamify");

module.exports = {
	safeFolderRename(name) {
		return filenamify(name, { replacement: "" }).replace(/https|http/g, "");
	},
};
