var session = require('express-session');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var date = require('date-utils');
var mallRouter = require('./routes/mall');
var usersRouter = require('./routes/users');
var app = express();
//session
app.use(cookieParser());
app.use(session({ 
	secret: 'raining',
	resave: false,
	saveUninitialized: true,
  cookie : { // 쿠키에 들어가는 세션 ID값의 옵션
        maxAge : 1000 * 60 * 60 // 10분까지 유지
    }
}));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/mall',express.static(path.join(__dirname, 'public'))); 
app.use('/mall', mallRouter);
app.use('/users', usersRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
