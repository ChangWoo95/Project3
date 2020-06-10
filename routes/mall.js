var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var pool = mysql.createPool({
	connectionLimit: 5,
	host: 'localhost',
	user: 'root',
	database: 'shopping',
	password: 'sw8836^^'
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET home page. */
router.get('/login', function(req, res, next) {
  res.render('login');
});

router.get('/myaccount', function(req, res, next) {
  var email  = req.body.email;

  pool.getConnection(function(err, connection)
  {
  	  var sql = "select name, age, sex, address, phoneNO, password, email from Seller where email = ?";
	  connection.query(sql, [email], function(err, row)
	  {
	  	  if(err) console.error(err);
		  console.log("회원정보 조회 : ", row);
		  res.render('myaccount',{row: row});
		  connection.release();
	  });
  });
});

router.get('/myaccount_update', function(req, res, next) {
  res.render('myaccount_update');
});

module.exports = router;
