var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var pool = mysql.createPool({
	connectionLimit: 5,
	host: 'localhost',
	user: 'root',
	database: 'tutorial',
	password: 'gosemvhs1~@#'
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET home page. */
router.get('/login', function(req, res, next) {
  res.render('login');
});

module.exports = router;
