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
    console.log('확인:' + req.session.name + req.session.islogined + req.session.auth);
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
		if(user == 'administrator') var sql = "SELECT name,author FROM administrator where email=? and password=?";
		else if(user == 'seller') var sql = "SELECT name,author FROM seller where email=? and password=?";
		else var sql = "SELECT name,author FROM customer where email=? and password=?";
		
		connection.query(sql, datas, function(err, rows){
			if(err) console.error("로그인sql err",err);
			if(!rows[0]){
				res.send("<script>alert('등록되지 않은 회원이거나 비밀번호가 틀렸습니다.');history.back();</script>");
			}
			else{
				req.session.name = rows[0].name; 
				req.session.auth = rows[0].author;
				req.session.islogined = true;
				res.redirect('/mall');
			}
			connection.release();
		});
	});
});

router.get('/logout', function(req, res, next) {
	req.session.destroy();
	res.redirect('/mall');
});

/*회원가입 get method*/
router.get('/join', function(req, res, next) {
	res.render('join');
});

/*회원가입 post method*/
router.post('/join', function(req, res, next) {
	var name = req.body.name;
	var age = req.body.age;
	var sex = req.body.sex;
	var address = req.body.address;
	var phoneNO = req.body.phoneNO;
	console.log("전화번호 : ",phoneNO);
	var password = req.body.password;
	var email = req.body.email;
	var user = req.body.user;

	pool.getConnection(function(err, connection){
		if(err) console.error("커넥션 객체 얻어오기 에러 : ",err);
	
		/*user에 따른 조건문*/
		if(user == 'administrator') {
			var sql = "INSERT INTO administrator(name,age,sex,address,phoneNO,password,email,author) values(?,?,?,?,?,?,?,?)";
			var auth = 'a';
		}
		else if(user == 'seller') {
			var sql = "INSERT INTO seller(name,age,sex,address,phoneNO,password,email,author) values(?,?,?,?,?,?,?,?)";
			var auth = 's';
		}
		else {
			var sql = "INSERT INTO customer(name,age,sex,address,phoneNO,password,email,author) values(?,?,?,?,?,?,?,?)";
			var auth = 'c';
		}
		var datas = [name,age,sex,address,phoneNO,password,email,auth];
		
		connection.query(sql,datas, function(err, rows){
			if(err) console.error(err);
			console.log("insert 확인 : ",JSON.stringify(rows));
			if(rows.affectedRows == 1) res.send("<script>alert('회원가입이 완료되었습니다.');location.href='/mall/login';</script>");
			connection.release();
		});
	});
});
/*회원관리 get method*/
router.get('/user_manage', function(req, res, next) {
	pool.getConnection(function(err, connection){
		if(err) console.error("커넥션 객체 얻어오기 에러 : ",err);
		var sql = "SELECT * FROM customer UNION SELECT * FROM seller order by C_id";
		connection.query(sql, function(err, rows){
			if(err) console.error("로그인sql err",err);

			res.render('user_manage',{rows: rows, session: req.session});
			connection.release();
		});
	});	
});

/*상품관리 get method*/
router.get('/product_manage',function(req, res, next){
	
	pool.getConnection(function (err, connection){
		var sqlproduct = "SELECT Item.name, type, category, brand, date, price, cnt FROM Item, seller WHERE seller.name= ? and item.S_id = seller.S_id";
		connection.query(sqlproduct, req.session.name, function(err, rows){
			if(err) console.error("err : " + err);
			else res.render('product_manage',{session: req.session, rows: rows});
			connection.release();

		});
	});
});
/*회원정보 조회 get method*/
router.get('/myaccount', function(req, res, next) {
	
	pool.getConnection(function(err, connection)
	{
		var name = req.session.name; //회원이름
		if(req.session.auth == 'c') //구매자 정보 조회
			var sql = "select * from customer where name=?";
		else if(req.session.auth == 's') //판매자 정보 조회
			var sql = "select * from seller where name=?";
		else //관리자 정보 조회
			var sql = "select * from administrator where name=?";		
		connection.query(sql,name, function(err, row)
		{
			if(err) console.error(err);
			console.log("회원정보 조회 : ", row);
			res.render('myaccount',{title: "회원정보 조회", row:row[0], session:req.session});
			connection.release();
		});
	});
	
});

router.get('/myaccount_update', function(req, res, next) {
  res.render('myaccount_update');
});
module.exports = router;
