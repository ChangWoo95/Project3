var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var pool = mysql.createPool({
	connectionLimit: 5,
	host: 'localhost',
	user: 'root',
	database: 'shopping',
	password: 'gosemvhs1~@#'
});

/* GET home page. */
router.get('/', function(req, res, next) {
   if(!req.session.logined){
        req.session.logined = false;
    }
    console.log('확인:' + req.session.name + req.session.islogined);
  res.render('index', { session : req.session });
});

/*로그인 get method*/
router.get('/login', function(req, res, next) {
  res.render('login');
});

/*로그인 post method*/
router.post('/login', function(req,res,next){
	var email = req.body.email;
	var user = req.body.user;
	var password = req.body.password;
	var datas = [email,password];

	pool.getConnection(function(err, connection){
		if(err) console.error("커넥션 객체 얻어오기 에러 : ",err);

		/*user에 따른 조건문*/
		if(user == 'administrator') var sql = "SELECT name FROM administrator where email=? and password=?";
		else if(user == 'seller') var sql = "SELECT name FROM seller where email=? and password=?";
		else var sql = "SELECT name FROM customer where email=? and password=?";
		
		connection.query(sql,datas, function(err, rows){
			if(err) console.error(err);

			req.session.name =rows[0].name; 
			req.session.islogined = true;

			res.redirect('/mall');
			connection.release();
		});
	});
});

router.get('/logout', function(req, res, next) {
	req.session.destroy();
	res.redirect('/mall');
});

module.exports = router;
