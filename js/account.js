module.exports = function Account(id, username, password, email, email_val, creation_date) {
	var _id = id;
    var username = username || null;
    var password = password || null;
    var email = email;
    var emailValidated = email_val || false;
    var creationDate = creation_date;

    this.validateEmail = function()	{
    	emailValidated = true;
    }
    this.getData = function() {
    	return {
    		_id: _id,
			username: username,
			password: password,
			email: email,
			emailValidated: emailValidated,
			creationDate: creationDate
		}
    }
    this.setPassword = function(p) {
    	if(password == null)
    		password = p;
    	else
    		console.log('password has already been set.')
    };
    this.setUsername = function(u) {
    	if(username == null)
    		username = u;
    	else
    		console.log('username has already been set.')
    };
    this.setEmail = function(e) {
    	email = e;
    };
    this.setSalt = function(s) {
    	salt = s;
    };
    this.setId = function(id) { //only do that once to generate _id from mongo. figure out how to generate yoy
    	_id = id;
    };
};