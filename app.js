'use strict';

const express = require('express');
var mysql      = require('mysql');
const assert = require('assert');
const app = express();
const api_port = 8000;
const crypto = require('crypto');
const bodyParser = require('body-parser');


//MySql плохой выбор но у меня на машине других баз нету.
var connection = mysql.createConnection({     
  host     : 'localhost',
  database : 'test',
  user     : 'root',
  password : ''
});


//Конектимся к базе сразу, если делать это во время приема запроса, то можно словить баг handshake
	connection.connect(function(err) 
			{ 
			  if (err) 
			   {
				console.log(err); 
				return;
			   }
            });



module.exports = app;

//Декодируем данные если что
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 

//================================================================================
//Register Controller 
//================================================================================


  app.post('/api/register', (req, res) => { 
    
	if (req.body =={})   
	{ 
      console.log('Empty query'); 
	  res.status(400).send({ 'error': 'Register. Empty query' }); 
	  return; 
	}
    
	if (!req.body.email) 
	{ 
      console.log('Email isn\'t specified'); 
	  res.status(400).send({ 'error': 'Register. Email isn\'t specified' }); 
	  return;
	}
	
	if (!req.body.password) 
	{ 
      console.log('Password isn\'t specified'); 
	  res.status(400).send({ 'error': 'Register. Password isn\'t specified' }); 
	  return;
	}
	
			
    connection.query('SELECT * FROM users WHERE email = \''+req.body.email+'\'', function (err, result, datah) {
    console.log(result.length);
		  if (err) 
		  { 
           res.status(400).send({ 'error': 'Register. An error has occurred when method query called' }); 
		   console.log(err);
		   return; 
          } 

          if (result.length>0) 
		  {
		   console.log('Email is used'); 
	       res.status(400).send({ 'error': 'Register. Email is used' }); 
	       return;  
		  } 
		   else 
		  {
			// Генерим токен с хэша: md5(email+pass)
			var tokenh=crypto.createHash('md5').update(req.body.email+req.body.password).digest("hex");
			var sqlq = "INSERT INTO users (email, name, pwd, token) VALUES ?";			 
		    var record = [[req.body.email,req.body.name,req.body.password,tokenh]];	
            connection.query(sqlq, [record], function (err, result) {
            if (err) 
			 { 
              res.status(400).send({ 'error': 'An error has occurred when method Insert called' }); 
		      console.log(err)
             } 
			else 
			 {
			  console.log('Registration - OK');
              res.status(201).send({ 'token': tokenh});
			  console.log(result);
             }
            });
           
		  }
      });
  
   });

//================================================================================
//Login Controller
//================================================================================


app.post('/api/login', (req, res) => { 

  if (!req.body.email || !req.body.password)   
	{ 
      console.log('Login. Empty query'); 
	  res.status(400).send({ 'error': 'Login. Empty query' }); 
	  return; 
	}
	
    connection.query('SELECT * FROM users WHERE email = \''+req.body.email+'\'', function (err, result, datah) {
        if (err) 
		  { 
           res.status(400).send({ 'error': 'Login. An error has occurred when method Querty called' }); 
		   console.log(err);
		   return; 
          } 
 
      if (result.length>0)
	  {  
         var tokenh=crypto.createHash('md5').update(req.body.email+req.body.password).digest("hex"); 
		 if (result[0].token==tokenh) 
		 {   
	         console.log('Login OK.');
			 res.status(200).send({ 'token': tokenh });
		 }
		 console.log(result); 

      } else 
	    {
		 res.status(400).send({ 'error': 'Login. This user does not exist' }); 
		 console.log('Login. This user does not exist');
        }
   });
 });
 
 //================================================================================
//Profile Controller
//================================================================================
 
 app.post('/api/profile', (req, res) => {
	 
  if (!req.get('Authorization'))
  {
	res.status(401).send({ 'error': 'A token is not specified' });   
  }
  else
  {
	var token=req.get('Authorization').split(" ")[1];
	connection.query('SELECT * FROM users WHERE token = \''+token+'\'', function (err, result, datah) {
	 if (result.length>0)
	  {  
       res.status(200).send({ 'email': result[0].email }); 
	   console.log(result);
      }  
	});  
  }
 
 });
  

app.listen(api_port, () => {
  console.log('API on port ' + api_port);
});
