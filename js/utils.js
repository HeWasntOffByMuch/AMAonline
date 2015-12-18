module.exports = {

	generateToken : function() {
		return Math.random().toString(36).substring(02);
	}


}