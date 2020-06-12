var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var multer = require('multer'); //multer 모듈 이용
var storage = multer.diskStorage({ //저장될 경로와 이름을 지정하는 storage
  destination: function(req, file, cb){
    cb(null,'./public/images/');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
var upload = multer({storage: storage}); //저장

var pool = mysql.createPool({
	connectionLimit: 5,
	host: 'localhost',
	user: 'root',
	database: 'shopping',
	password: 'sw8836^^'
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
		var sqlproduct = "SELECT Item.name, I_id, type, img, category, brand, date, price, cnt FROM Item, seller WHERE seller.name= ? and item.S_id = seller.S_id";
		connection.query(sqlproduct, req.session.name, function(err, rows){
			if(err) console.error("err : " + err);
			else res.render('product_manage',{session: req.session, rows: rows});
			connection.release();

		});
	});
});

/*상품추가 get method*/
router.get('/product_add', function(req, res, next) {
  res.render('product_add',{session: req.session});
});

/*상품추가 post method*/
router.post('/product_add', upload.single("img"), function(req, res, next) {
	var img = req.file.originalname;
	var name = req.body.name;
	var price = req.body.price;
	var type = req.body.type;
	var category = req.body.category;
	var brand = req.body.brand;
	var newDate = new Date();
	var date = newDate.toFormat('YYYY-MM-DD HH24:MI:SS');
	var cnt = req.body.cnt;
	var ses_name = req.session.name;
	var datas = [img,name,type,category,brand,date,price,cnt,ses_name];

	var sql ="insert into item(img,name,type,category,brand,date,price,cnt,S_id) values (?,?,?,?,?,?,?,?,(SELECT S_id from seller where name = ?))";
	pool.getConnection(function(err, connection){
		connection.query(sql,datas, function(err, row){
			if(err) console.error(err);
			else{
				console.log("회원정보 조회 : ", row);
				console.log("성공!!!!!!!!!!!", date);
				res.send("<script>alert('상품등록이 완료되었습니다.');location.href='/mall/product_manage';</script>");
			}
			connection.release();
		});
	});	
});
/*상품수정 get method*/
router.get('/product_update/:I_id',function(req, res, next)
{
	var I_id = req.params.I_id;

	pool.getConnection(function(err, connection)
	{
		var sql = "select I_id, img, name, type, category, brand, price, cnt from Item where I_id=?";
		connection.query(sql,[I_id],function(err,row)
		{
			if(err) console.error(err);
			console.log("I_id 값 확인 : ", I_id);
			console.log("상품 조회 결과 확인 : ", row);
			res.render('product_update', {title:"상품수정", row:row[0], session:req.session});
		});

	});
});
/*상품수정 post method*/
router.post('/product_update/:I_id', upload.single("image"), function(req, res, next)
{
	var I_id = req.params.I_id;
	//var img = req.file.originalname;
	var img = req.body.img;
	var name = req.body.name;
	var type = req.body.type;
	var category = req.body.category;
	var brand = req.body.brand;
	var price = req.body.price;
	var cnt = req.body.cnt;
	console.log("I_id 값 확인 : ", I_id);
	pool.getConnection(function(err, connection)
	{
		var sql = "update Item set img=?, name=?, type=?, category=?, brand=?, price=?, cnt=? where I_id=?";
		connection.query(sql,[img, name, type, category, brand, price, cnt, I_id], function(err, result)
		{
			console.log(result);
			if(err) console.error("글 수정 중 에러 발생 err : ", err);
			res.redirect('/mall/product_manage');
			connection.release();
		});
	});
});

/*상품삭제 get method*/
router.get('/product_delete/:I_id', function(req, res, next) {
  res.render('product_delete',{row: row, session: req.session});
});

/*상품삭제 post method*/
router.post('/product_delete/:I_id', function(req, res, next)
{
	var I_id = req.params.I_id;
	var password = req.session.password;
	var datas = [I_id, password];

	pool.getConnection(function(err, connection)
	{
		var sql = "delete from Item where idx=? and passwd=?";
		connection.query(sql,datas, function(err, result)
		{
			console.log(result);
			if(err) console.error("글 삭제 중 에러 발생 err : ", err);

			if(result.affectedRows == 0)
			{
				res.send("<script>alert('패스워드가 일치하지 않거나, 잘못된 요청으로 인해 값이 변경되지 않았습니다.');history.back();</script>");
			}
			else
			{
				res.redirect('/board/list/1');
			}

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
