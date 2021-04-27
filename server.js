/* eslint-disable quotes */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
'use strict';

// dotenv
require('dotenv').config();

const PORT = process.env.PORT;
// dependencies
const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');
const methodOverride = require('method-override');


const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');

//databse
// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });


//routes
app.get('/',homeHandler);
app.post('/search',searchMakeup);
app.get('/all',allProductsHandler);
app.post('/add',addHandler);
app.get('/mycards',mycardsHandler);
app.get('/details/:makeupID',detailsHandler);
app.put('/update/:makeupID',updateHandler);
app.delete('/delete/:makeupID',deleteHandler);
app.get('*',errorHandler);

//handlers

function homeHandler(req,res){
  res.render('pages/index');
}

//http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline&price_greater_than=10&price_less_than=14
//Maybelline
function searchMakeup(req,res){
  let mArr =[];
  let brand = req.body.brand;
  let min = req.body.min;
  let max = req.body.max;
  let makeupURL = `http://makeup-api.herokuapp.com/api/v1/products.json?brand=${brand}&price_greater_than=${min}&price_less_than=${max}`;
  superagent.get(makeupURL)
    .then(result => {
      let rData = result.body;
      rData.forEach(makeup =>{
        let newMakeup = new Makeup(makeup);
        mArr.push(newMakeup);
      });
      res.render('pages/products',{mArray:mArr});
    });
}
//http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline
function allProductsHandler(req,res){
  let mArr =[];
  let makeupURL = `http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline`;
  superagent.get(makeupURL)
    .then(result => {
      let rData = result.body;
      rData.forEach(makeup =>{
        let newMakeup = new Makeup(makeup);
        mArr.push(newMakeup);
      });
      res.render('pages/allproducts',{mArray:mArr});
    });
}

function addHandler(req,res){
  let {name,price,image,description} = req.body;
  let SQL = `INSERT INTO makeup (name,price,image,description) VALUES ($1,$2,$3,$4) RETURNING *;`;
  let safeValues = [name,price,image,description];
  client.query(SQL,safeValues)
    .then( res.redirect('/mycards'));
}

function mycardsHandler (req,res){
  let SQL = `SELECT * FROM makeup;`;
  client.query(SQL)
    .then(result =>{
      res.render('pages/mycards',{mArray:result.rows});
    });

}

function detailsHandler (req,res){
  let idValue = [req.params.makeupID];
  let SQL = `SELECT * FROM makeup WHERE id=$1;`;
  client.query(SQL,idValue)
    .then(result => {
      res.render(`pages/details`,{makeup:result.rows[0]});
    });
}

function updateHandler(req,res){
  let {name,price,image,description} = req.body;
  let idValue = req.params.makeupID;
  let SQL = `UPDATE makeup SET name=$1,price=$2,image=$3,description=$4 WHERE id=$5;`;
  let safeValues = [name,price,image,description,idValue];
  client.query(SQL,safeValues)
    .then(res.redirect(`/details/${idValue}`));
}

function deleteHandler(req,res){
  let idValue = [req.params.makeupID];
  let SQL =`DELETE FROM makeup WHERE id=$1;`;
  client.query(SQL,idValue)
    .then( res.redirect('/mycards'));
}

function errorHandler(req,res){
  res.render('pages/error');
}
//constructor
function Makeup (mData){
  this.name= mData.name;
  this.price = mData.price;
  this.image= mData.image_link;
  this.description= mData.description;
}

//listener

client.connect()
  .then(()=>{
    app.listen(PORT,()=> console.log(`Listening on Port ${PORT}`));
  });
