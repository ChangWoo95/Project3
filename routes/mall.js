var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var fs = require('fs');
var moment = require('moment');
var multer = require('multer'); //multer 모듈 이용

var storage = multer.diskStorage({ //저장될 경로와 이름을 지정하는 storage
    destination: function (req, file, cb) {
        cb(null, './public/images/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

var upload = multer({ storage: storage }); //저장

var pool = mysql.createPool({
    connectionLimit: 5,
    host: 'localhost',
    user: 'root',
    database: 'shopping',
    password: 'sw8836^^',
    dateStrings: 'date',
    multipleStatements: true
});

/* GET home page. */
router.get('/', function (req, res, next) {
    if (!req.session.islogined) {
        req.session.islogined = false;
    }
    pool.getConnection(function (err, connection) {
        if (err) console.error("커넥션 객체 얻어오기 에러 : ", err);
        var sql = "SELECT * FROM item";
        connection.query(sql, function (err, rows) {
            if (err) console.error("로그인sql err", err);
            res.render('index', { rows: rows, session: req.session });
            connection.release();
        });
    });
});

/*로그인 get method*/
router.get('/login', function (req, res, next) {
    res.render('login');
});

/*로그인 post method*/
router.post('/login', function (req, res, next) {
    var email = req.body.email;
    var user = req.body.user;
    var password = req.body.password;
    var datas = [email, password];

    pool.getConnection(function (err, connection) {
        if (err) console.error("커넥션 객체 얻어오기 에러 : ", err);

        /*user에 따른 조건문*/
        if (user == 'administrator') var sql = "SELECT name,author,AD_id as pk FROM administrator where email=? and password=?";
        else if (user == 'seller') var sql = "SELECT name,author, S_id as pk FROM seller where email=? and password=?";
        else var sql = "SELECT name,author, C_id as pk FROM customer where email=? and password=?";

        connection.query(sql, datas, function (err, rows) {
            if (err) console.error("로그인sql err", err);
            if (!rows[0]) {
                res.send("<script>alert('등록되지 않은 회원이거나 비밀번호가 틀렸습니다.');history.back();</script>");
            }
            else {
                req.session.name = rows[0].name;
                req.session.auth = rows[0].author;
                req.session.islogined = true;
                req.session.pk = rows[0].pk;
                console.log(req.session.pk);
                res.redirect('/mall');
            }
            connection.release();
        });
    });
});

router.get('/logout', function (req, res, next) {
    req.session.destroy();
    res.redirect('/mall');
});

/*회원가입 get method*/
router.get('/join', function (req, res, next) {
    res.render('join');
});

/*회원가입 post method*/
router.post('/join', function (req, res, next) {
    var name = req.body.name;
    var age = req.body.age;
    var sex = req.body.sex;
    var address = req.body.address;
    var phoneNO = req.body.phoneNO;
    console.log("전화번호 : ", phoneNO);
    var password = req.body.password;
    var email = req.body.email;
    var user = req.body.user;

    pool.getConnection(function (err, connection) {
        if (err) console.error("커넥션 객체 얻어오기 에러 : ", err);

        /*user에 따른 조건문*/
        if (user == 'administrator') {
            var sql = "INSERT INTO administrator(name,age,sex,address,phoneNO,password,email,author) values(?,?,?,?,?,?,?,?)";
            var auth = 'a';
        }
        else if (user == 'seller') {
            var sql = "INSERT INTO seller(name,age,sex,address,phoneNO,password,email,author) values(?,?,?,?,?,?,?,?)";
            var auth = 's';
        }
        else {
            var sql = "INSERT INTO customer(name,age,sex,address,phoneNO,password,email,author) values(?,?,?,?,?,?,?,?)";
            var auth = 'c';
        }
        var datas = [name, age, sex, address, phoneNO, password, email, auth];

        connection.query(sql, datas, function (err, rows) {
            if (err) console.error(err);
            console.log("insert 확인 : ", JSON.stringify(rows));
            if (rows.affectedRows == 1) res.send("<script>alert('회원가입이 완료되었습니다.');location.href='/mall/login';</script>");
            connection.release();
        });
    });
});

/*회원관리 get method*/
router.get('/user_manage', function (req, res, next) {
    pool.getConnection(function (err, connection) {
        if (err) console.error("커넥션 객체 얻어오기 에러 : ", err);
        var sql = "SELECT * FROM customer UNION SELECT * FROM seller order by C_id";
        connection.query(sql, function (err, rows) {
            if (err) console.error("로그인sql err", err);

            res.render('user_manage', { rows: rows, session: req.session });
            connection.release();
        });
    });
});

/*상품관리 get method*/
router.get('/product_manage', function (req, res, next) {

    pool.getConnection(function (err, connection) {
        //select * from item where I_id = ?
        var sqlproduct = "select * from item where S_id = ?";
        console.log(sqlproduct);
        connection.query(sqlproduct, req.session.pk, function (err, rows) {
            //console.log("이름 : ",rows[0].img);
            if (err) console.error("err : " + err);
            else res.render('product_manage', { session: req.session, rows: rows });
            connection.release();

        });
    });
});

/*상품추가 get method*/
router.get('/product_add', function (req, res, next) {
    res.render('product_add', { session: req.session });
});

/*상품추가 post method*/
router.post('/product_add', upload.single("img"), function (req, res, next) {
    var img = req.file.originalname;
    var name = req.body.name;
    var price = req.body.price;
    var type = req.body.type;
    var category = req.body.category;
    var brand = req.body.brand;
    var newDate = new Date();
    var date = newDate.toFormat('YYYY-MM-DD HH24:MI:SS');
    var cnt = req.body.cnt;
    var ses_pk = req.session.pk;
    var datas = [img, name, type, category, brand, date, price, cnt, ses_pk];

    var sql = "insert into item(img,name,type,category,brand,date,price,cnt,S_id) values (?,?,?,?,?,?,?,?,?)";

    pool.getConnection(function (err, connection) {
        connection.query(sql, datas, function (err, row) {
            if (err) console.error(err);
            else {
                console.log("회원정보 조회 : ", row);
                console.log("성공!!!!!!!!!!!", date);
                res.send("<script>alert('상품등록이 완료되었습니다.');location.href='/mall/product_manage';</script>");
            }
            connection.release();
        });
    });
});

/*상품수정 get method*/
router.get('/product_update/:I_id', function (req, res, next) {
    var I_id = req.params.I_id;

    pool.getConnection(function (err, connection) {
        var sql = "select I_id, img, name, type, category, brand, price, cnt from Item where I_id=?";
        connection.query(sql, [I_id], function (err, row) {
            if (err) console.error(err);
            console.log("I_id 값 확인 : ", I_id);
            console.log("상품 조회 결과 확인 : ", row);
            res.render('product_update', { title: "상품수정", row: row[0], session: req.session });
        });

    });
});

/*상품수정 post method*/
router.post('/product_update/:I_id', upload.single("img"), function (req, res, next) {
    var I_id = req.params.I_id;
    var org = req.body.org;
    var chk = req.body.chk;

    if (chk == 1) var img = org; //들어온 이미지가 없음
    else {
        org = './public/images/' + org;
        var img = req.file.originalname; //들어온 이미지가 있음
        fs.unlink(org, function (re) {
            if (re) console.log(re);
        });
    }

    var name = req.body.name;
    var type = req.body.type;
    var category = req.body.category;
    var brand = req.body.brand;
    var price = req.body.price;
    var cnt = req.body.cnt;

    console.log("I_id 값 확인 : ", I_id);
    pool.getConnection(function (err, connection) {
        var sql = "update Item set img=?, name=?, type=?, category=?, brand=?, price=?, cnt=? where I_id=?";
        connection.query(sql, [img, name, type, category, brand, price, cnt, I_id], function (err, result) {
            console.log(result);
            if (err) console.error("글 수정 중 에러 발생 err : ", err);
            res.redirect('/mall/product_manage');
            connection.release();
        });
    });
});

/*상품삭제 get method*/
router.get('/product_delete/:I_id', function (req, res, next) {
    var I_id = req.params.I_id;

    pool.getConnection(function (err, connection) {
        if (err) console.error("커넥션 객체 얻어오기 에러 : ", err);

        var sql = "select * from Item where I_id=?";
        connection.query(sql, [I_id], function (err, rows) {
            if (err) console.error(err);
            console.log("delete할 상품 조회 결과 확인 : ", rows);
            res.render('product_delete', { title: "상품 삭제", row: rows[0], session: req.session });
            connection.release();
        });
    });
});

/*상품삭제 post method*/
router.post('/product_delete/:I_id', function (req, res, next) {

    var I_id = req.params.I_id;
    var password = req.body.password;
    var pk = req.session.pk;

    var org = './public/images/' + req.body.org;
    console.log("test ", org);

    var datas = [I_id, password, pk];
    console.log("패스워드 : ", req.body.password);
    pool.getConnection(function (err, connection) {
        var sql = "delete from item where I_id=? and S_id = (select S_id from seller where password=? and S_id = ?)";
        connection.query(sql, datas, function (err, result) {
            console.log(result);
            if (err) console.error("글 삭제 중 에러 발생 err : ", err);

            if (result.affectedRows == 0) {
                res.send("<script>alert('패스워드가 일치하지 않거나, 잘못된 요청으로 인해 값이 변경되지 않았습니다.');history.back();</script>");
            }
            else {
                fs.unlink(org, function (re) {
                    if (re) console.log(re);
                });
                res.redirect('/mall/product_manage');
            }

            connection.release();
        });
    });
});

/*판매조회 get method*/
router.get('/product_sale', function (req, res, next) {

    pool.getConnection(function (err, connection) {
        var sqlproduct = "SELECT Item.img, Item.name, Item.price, Item.type, Item.category, Item.brand, Orderlist.date, Orderlist.cnt FROM Item, Orderlist WHERE Item.I_id = Orderlist.I_id and  Orderlist.ship_state = '배송 완료'";
        connection.query(sqlproduct, req.session.name, function (err, rows) {
            //console.log("이름 : ",rows[0].img);
            if (err) console.error("err : " + err);
            else res.render('product_sale', { session: req.session, rows: rows });
            connection.release();

        });
    });
});

/*주문현황 get method*/
router.get('/product_orderlist', function (req, res, next) {

    pool.getConnection(function (err, connection) {
        var pk = req.session.pk;
        var sqlproduct = "";
        sqlproduct = sqlproduct + "update orderlist set ship_state = '배송 완료' where TIMESTAMPDIFF(second,orderlist.date,now()) > 60;";
        sqlproduct = sqlproduct + "SELECT Orderlist.O_id, Orderlist.C_id, Orderlist.date, Orderlist.cnt, Orderlist.ship_state, Item.img, Item.name, Item.price, Item.type, Item.category, Item.brand FROM Orderlist, Item WHERE Orderlist.I_id = Item.I_id and Item.S_id = ? and Orderlist.ship_state = '배송 전';";

        connection.query(sqlproduct, pk, function (err, rows) {
            //console.log("이름 : ",rows[0].img);
            if (err) console.error("err : " + err);
            else {
                console.log(rows[0]);
                res.render('product_orderlist', { session: req.session, rows: rows[1] });
            }
            connection.release();

        });
    });
});


/*회원정보 조회 get method*/
router.get('/myaccount', function (req, res, next) {

    pool.getConnection(function (err, connection) {
        var pk = req.session.pk; //회원 pk
        if (req.session.auth == 'c') //구매자 정보 조회
            var sql = "select * from customer where C_id=?";
        else if (req.session.auth == 's') //판매자 정보 조회
            var sql = "select * from seller where S_id=?";
        else //관리자 정보 조회
            var sql = "select * from administrator where AD_id=?";
        connection.query(sql, pk, function (err, row) {
            if (err) console.error(err);
            console.log("회원정보 조회 : ", row);
            res.render('myaccount', { title: "회원정보 조회", row: row[0], session: req.session });
            connection.release();
        });
    });
});

router.get('/myaccount_update', function (req, res, next) {
    res.render('myaccount_update');
});

/*상품보기 get method*/
router.get('/product', function (req, res, next) {
    var pk = req.session.pk;
    pool.getConnection(function (err, connection) {
        var sql1 = "select * from item order by I_id;";
        var sql2 = "select item.*,cart.val from cart,item where item.I_id = cart.I_id and cart.C_id=?;";
        connection.query(sql1 + sql2, pk, function (err, result) {
            if (err) console.error("글 삭제 중 에러 발생 err : ", err);
            else {
                var sum = 0;
                res.render('product', { session: req.session, rows: result[0], cart: result[1], sum: sum });
            }
            connection.release();
        });
    });
});

/*상품조회 get method*/
router.get('/product_detail/:I_id', function (req, res, next) {

    pool.getConnection(function (err, connection) {
        var num = req.params.I_id;
        var pk = req.session.pk;
        console.log("확인1 : ", num);

        var sql = "select * from item where I_id=?;";
        var sql2 = "select review.*,customer.name from review,customer where review.I_id=? and review.C_id = customer.C_id;";
        var sql3 = "select item.*,cart.val from cart,item where item.I_id = cart.I_id and cart.C_id = ?;";
        console.log("확인2 : ", pk);
        var datas = [num, num, pk];

        connection.query(sql + sql2 + sql3, datas, function (err, rows) {
            if (err) console.error("글 삭제 중 에러 발생 err : ", err);
            else {
                var sum = 0;
                res.render('product_detail', { session: req.session, row: rows[0][0], review: rows[1], cart: rows[2], sum: sum });
            }

            connection.release();
        });
    });
});

/*상품조회 post method*/
router.post('/product_detail/:I_id', function (req, res, next) {
    var id = req.params.I_id;
    var name = req.session.name;
    var val = req.body.num_product;
    console.log(val);
    pool.getConnection(function (err, connection) {
        var datas = [id, name, val];
        var sql = "insert into cart(I_id,C_id,val) values (?,(SELECT C_id from customer where name = ?),?)";

        connection.query(sql, datas, function (err, row) {
            if (err) console.error("장바구니 insert err : ", err);
            else res.send("<script>alert('장바구니에 추가되었습니다.');location.href='/mall/cart';</script>");
            connection.release();
        });
    });
});

/*상품랭킹 get method*/
router.get('/product_ranking', function (req, res, next) {
    var pk = req.session.pk;
    pool.getConnection(function (err, connection) {
        //var sql1 = "select * from item order by I_id;";
        //var sql2 = "select item.*,cart.val from cart,item where item.I_id = cart.I_id and cart.C_id=?;";
        var sql1 = "select distinct Item.I_id, Item.img, Item.name from Item, Orderlist where Item.I_id in (select I_id from orderlist group by I_id order by sum(cnt) desc);"; //구매량TOP10
        var sql2 = "select img, name, grade from Item order by grade desc;"; //평점TOP10
        var sql3 = "select item.*,cart.val from cart,item where item.I_id = cart.I_id and cart.C_id=?;";
        connection.query(sql1 + sql2 + sql3, pk, function (err, result) {
            if (err) console.error("글 삭제 중 에러 발생 err : ", err);
            else {
                var sum = 0;
                res.render('product_ranking', { session: req.session, sale: result[0], grade: result[1], cart: result[2], sum: sum });
            }
            connection.release();
        });
    });
});

router.get('/cart', function (req, res, next) {
    pool.getConnection(function (err, connection) {
        var pk = req.session.pk;
        var sql = "select item.*,cart.val,cart.CC_id from cart,item where item.I_id = cart.I_id and cart.C_id=?;";
        connection.query(sql, pk, function (err, result) {
            if (err) console.error("글 장바구니 get 발생 err : ", err);
            else {
                var sum = 0;
                res.render('cart', { session: req.session, cart: result, sum: sum });
            }

            connection.release();
        });
    });
});

router.post('/cart', function (req, res, next) {

    var ischecked = req.body.chk;
    var pk = req.session.pk;
    var datas = [];
    var sql = "";

    if (Array.isArray(ischecked)) {
        ischecked.forEach(function (item, index, array) {
            datas.push(item);
            datas.push(pk);
            sql = sql + "delete from cart where I_id=? and C_id=?;";
            console.log("현재 상황: ", datas + sql);
        });
    }
    else {
        datas.push(ischecked);
        datas.push(pk);
        sql = sql + "delete from cart where I_id=? and C_id=?;";
    }

    console.log("datas!!: " + datas);
    console.log("sql!!: " + sql);
    pool.getConnection(function (err, connection) {
        connection.query(sql, datas, function (err, result) {
            if (err) console.error("장바구니 제거 err : ", err);
            else res.send("<script>alert('장바구니에 삭제되었습니다.');location.href='/mall/cart';</script>");

            connection.release();
        });
    });
});

router.post('/check_out', function (req, res, next) {
    var chk = req.body.chk;
    var ch_val = req.body.chk_val;
    console.log(ch_val);
    var datas = [];
    var sql = "";
    var newDate = new Date();
    var date = newDate.toFormat('YYYY-MM-DD HH24:MI:SS');
    var pk = req.session.pk;

    if (Array.isArray(chk)) {
        chk.forEach(function (item, index, array) {

            datas.push(pk);
            datas.push(item);
            datas.push(date);
            datas.push(ch_val[index]);
            sql += "insert into purchase(C_id,I_id,date,val) values(?,?,?,?);";

            datas.push(pk);
            datas.push(item);
            datas.push(ch_val[index]);
            datas.push(date);
            sql += "insert into Orderlist(C_id,I_id,cnt,date) values(?,?,?,?);";

            datas.push(item);
            datas.push(ch_val[index]);
            datas.push(item);
            sql += "update item set cnt = (select cnt from (select * from item where I_id=?) as tmp)-? where I_id=?;";

            datas.push(item);
            sql += "delete from cart where I_id=?;";
        });
    }
    else {

        datas.push(pk);
        datas.push(chk);
        datas.push(date);
        datas.push(ch_val);
        sql += "insert into purchase(C_id,I_id,date,val) values(?,?,?,?);";

        datas.push(pk);
        datas.push(chk);
        datas.push(ch_val);
        datas.push(date);
        sql += "insert into Orderlist(C_id,I_id,cnt,date) values(?,?,?,?);";

        datas.push(chk);
        datas.push(ch_val);
        datas.push(chk);
        sql += "update item set cnt = (select cnt from (select * from item where I_id=?) as tmp)-? where I_id=?;";

        datas.push(chk);
        sql += "delete from cart where I_id=?;";
    }

    console.log("datas!!: " + datas);
    console.log("sql!!: " + sql);
    pool.getConnection(function (err, connection) {
        connection.query(sql, datas, function (err, result) {
            if (err) console.error("결제 시스템 err : ", err);
            else res.send("<script>alert('결제가 완료되었습니다.');location.href='/mall/purchase';</script>");

            connection.release();
        });
    });
});

router.get('/purchase', function (req, res, next) {
    var pk = req.session.pk;
    var sql = "select purchase.*,item.img,item.name,item.price from purchase,item where purchase.C_id=? and purchase.I_id = item.I_id";

    console.log("sql!!: " + sql);


    pool.getConnection(function (err, connection) {
        connection.query(sql, pk, function (err, result) {
            if (err) console.error("구매내역 발생 err : ", err);
            else {
                var diff = [];
                for (var i = 0; i < result.length; i++) {
                    var prev = moment(result[i].date);
                    var now_d = moment();
                    console.log("과거: ", prev.format('YYYY-MM-DD HH:mm:ss'));
                    console.log("지금 : ", now_d.format('YYYY-MM-DD HH:mm:ss'));
                    if (moment.duration(now_d - prev).asSeconds() <= 60) {
                        console.log(moment.duration(now_d - prev).asSeconds());
                        diff.push('T');
                    }
                    else diff.push('F');
                }
                console.log(diff);
                res.render('purchase', { session: req.session, pur: result, diff: diff });
            }
            connection.release();
        });
    });
});

router.post('/purchase', function (req, res, next) {
    var pk = req.session.pk;
    var sql = "select purchase.*,item.img,item.name,item.price from purchase,item where purchase.C_id=? and purchase.I_id = item.I_id";

    console.log("sql!!: " + sql);


    pool.getConnection(function (err, connection) {
        connection.query(sql, pk, function (err, result) {
            if (err) console.error("구매내역 발생 err : ", err);
            else {
                var diff = [];
                for (var i = 0; i < result.length; i++) {
                    var prev = moment(result[i].date);
                    var now_d = moment();
                    console.log("과거: ", prev.format('YYYY-MM-DD HH:mm:ss'));
                    console.log("지금 : ", now_d.format('YYYY-MM-DD HH:mm:ss'));
                    if (moment.duration(now_d - prev).asMinutes() <= 10) {
                        console.log(moment.duration(now_d - prev).asMinutes());
                        diff.push('T');
                    }
                    else diff.push('F');
                }
                console.log(diff);
                res.render('purchase', { session: req.session, pur: result, diff: diff });
            }
            connection.release();
        });
    });
});


router.get('/review', function (req, res, next) {
    var idx = req.query.btn_re;
    console.log(idx);
    var sql = "select * from item where I_id=?";
    pool.getConnection(function (err, connection) {
        connection.query(sql, idx, function (err, result) {
            if (err) console.error("리뷰 err : ", err);
            else res.render('review', { session: req.session, idx: idx, product: result[0] });
            connection.release();
        });
    });
});

router.post('/review', function (req, res, next) {
    var idx = req.body.idx;
    console.log("idx!!", idx);
    var num = req.body.rating;
    console.log("num!!", num);
    var text = req.body.r_text;
    console.log("text!!" + text);

    var newDate = new Date();
    var date = newDate.toFormat('YYYY-MM-DD HH24:MI:SS');
    var pk = req.session.pk;
    var datas = [];
    var sql = "";

    datas.push(pk);
    datas.push(idx);
    datas.push(num);
    datas.push(text);
    datas.push(date);
    datas.push(idx);
    datas.push(idx);

    sql += "insert into review(C_id,I_id,score,review,date) values(?,?,?,?,?);";
    sql += "UPDATE item SET grade = (select avg(score) from review where review.I_id = ?) where item.I_id = ?;";

    console.log("확인1 :", datas);
    console.log("확인2 :", sql);

    pool.getConnection(function (err, connection) {
        connection.query(sql, datas, function (err, result) {
            if (err) console.error("리뷰 err : ", err);
            else res.send("<script>alert('작성되었습니다.');location.href='/mall/product';</script>");
            connection.release();
        });
    });
});


module.exports = router;