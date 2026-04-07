//Edited by: Emma Jeppesen

require('dotenv').config();
var createError = require('http-errors');
var https = require('https');
const fs = require('fs');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var geoRouter = require('./routes/geoTable.js');
var contentRouter = require('./routes/contentTable.js')
var authRouter = require('./routes/auth');

var app = express();
const frontendDistPath = path.join(__dirname, '..', 'dist');
const hasFrontendBuild = fs.existsSync(path.join(frontendDistPath, 'index.html'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
if (hasFrontendBuild) {
  app.use(express.static(path.join(__dirname, 'public'), { index: false }));
  app.use(express.static(frontendDistPath));
} else {
  app.use(express.static(path.join(__dirname, 'public')));
}

app.use('/api/auth', authRouter);
app.use('/users', usersRouter);
app.use('/geoTable', geoRouter);
app.use('/coordinates', geoRouter)
app.use('/contentTable', contentRouter);
app.use('/api/content', contentRouter);
if (!hasFrontendBuild) {
  app.use('/', indexRouter);
}

//Error test
app.get('/test-error', (req, res) => {
  res.render('error', { message: 'Test error page', error: {} });
});

//Load SSL certificate and key
const options = {
  key: fs.readFileSync('./ssl/server.key'),
  cert: fs.readFileSync('./ssl/server.cert')
};

//Test
// app.get('/', (req, res) => {
//   res.send('Hello World!');
// });



//Serve static files if needed
// app.use(express.static('public'));

if (hasFrontendBuild) {
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api/') ||
      req.path.startsWith('/assets/') ||
      req.path.startsWith('/users') ||
      req.path.startsWith('/geoTable') ||
      req.path.startsWith('/coordinates') ||
      req.path.startsWith('/contentTable') ||
      req.path.startsWith('/archiveContent') ||
      req.path.startsWith('/uploads')
    ) {
      return next();
    }

    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Error Handling
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {

  console.error(err.stack);
  // set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {

    message: err.message || 'Error: Unexpected',
    error: req.app.get('env') === 'development' ? err : {}
  });
});

// Only listen here when running this file directly.
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://cs341avr.campus.up.edu`);
    console.log(`Server running at http://localhost:${PORT}`);
  });
}


module.exports = app;
