/*jshint node:true, laxcomma:true, indent:2, undef:true, unused:true, eqnull:true */

'use strict';

var PORT = process.env.PORT || 3000;

require('sugar');
var connect = require('connect')
  , multiparty = require('multiparty')
  , ANSIConvert = require('ansi-to-html')
  , http = require('http')
  , fs = require('fs')
  ;
  

var formHTML = fs.readFileSync('form.html', { encoding: 'utf8' });

var app = connect()
  .use(connect.logger('dev'))
  .use(function (req, res, next) {
    
    if (req.method === 'POST') {
      
      var form = new multiparty.Form();
      form.parse(req, function (err, fields, files) {
        if (err) {
          next(err);
          return;
        }
        
        if (!files.file) {
          next(new Error('Missing attachment.'));
          return;
        }
                
        if (fields.download) {
          res.setHeader('Content-disposition', 'attachment; filename=converted.html');
        }
        
        fs.readFile(files.file[0].path, function (err, data) {
          if (err) {
            next(err);
            return;
          }
          
          var str = data.toString('utf8');
          
          if (fields.re[0] || fields.only[0]) {
            str = str.split('\n');
            str = str.map(function (s) {
              if (fields.re[0] && s.match(fields.re[0]) === null) {
                return s;
              } else if (fields.only[0] && s.match(fields.only[0]) !== null) {
                return s;
              }
            });
            str = str.compact().join('\n');
          }
          
          res.setHeader('Content-type', 'text/html');
          res.write('<html><body style="font-size: 8px;"><pre>');
          res.write(new ANSIConvert({ fg: 'black', bg: '#ffeeee;' }).toHtml(str));
          res.write('</pre></body></html>');
          res.end();
        });
        
      });
      
    } else {
      res.setHeader('Content-type', 'text/html');
      res.end(formHTML);
    }
  })
  .use(connect.errorHandler())
  ;

http.createServer(app).listen(PORT);
