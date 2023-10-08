const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const db = require('../database/models');
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const moment = require('moment');

const ordenesController = {

    //seccion para registrar nuevas ordenes de compra
    saveNew: function(req,res) {

        console.log('Nombre de producto = ' + req.body['producto-nombre-1']);
        console.log('Body = ' + JSON.stringify(req.body,null,4));
        //console.log('ID del 1er articulo = ' + req.body.);
        //return res.json({requestBody: req.body});

        let today = new Date();
        let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        let dateTime = date + ' ' + time;

        db.Orden
        .create(
            {
                id_cliente: req.body['orden-id-cliente'],
                total: req.body['inputtotaldeorden'],
                tipo_operacion: req.body['orden-tipo-operacion'],
                email_cliente: req.body['orden-email-cliente'],
                sub_total: req.body['orden-sub-total'],
                impuestos: req.body['orden-impuestos'],
                nombre_cliente: req.body['orden-nombre-cliente'],
                apellido_cliente: req.body['orden-apellido-cliente'],
                domicilio: req.body['orden-domicilio'],
                usuario_cliente: req.body['orden-usuario'],
                pais: req.body['orden-pais'], 
                session_id: req.sessionID,
                orden_hora: dateTime          
            }
        )
            .then((data2)=> {
                let cantArticulos = req.body['articulos-totales'];
                let articulo;
                let articuloString;
                let articuloJson;
                let arrayArticulos=[];
                for(i=1; i <= cantArticulos ; i++) {
                    articulo = {
                        /*id_orden: req.body['orden-id-cliente'],*/
                        num_articulo: i,
                        id_articulo: req.body['producto-id-' + i],
                        producto_nombre: req.body['producto-nombre-' + i],
                        producto_descripcion: req.body['producto-descripcion-' + i],
                        cantidad: req.body['producto-cantidad-' + i],
                        precio: req.body['producto-precio-' + i],
                        total: req.body['orden-id-cliente'],
                        session_id: req.sessionID,
                        orden_hora: dateTime
                    };
                    articuloString = JSON.stringify(articulo);
                    console.log('articuloString ' + i + ' = ' + articuloString);
                    articuloJson = JSON.parse(articuloString);
                    console.log('articulo convertido' + i + ' = ' + JSON.stringify(articuloJson,null,4));
                    arrayArticulos.push(articulo);

                }
                console.log('array = ' + JSON.stringify(arrayArticulos,null,4));
                
                
                db.Ordenarticulo
                .bulkCreate(
                    arrayArticulos
                )
                    .then((x)=>{
                        return res.send('Operacion registrada');
                    })
                    .catch(error => res.send(error))
                


                

            })  
            .then((data2)=> {
                //ejecuto el update para igualar el ID de la orden al id de los articulos
                let sqlInst = "UPDATE ordenes_articulos SET id_orden = ";
                sqlInst = sqlInst + "(SELECT MAX(id_orden) FROM ordenes WHERE ";
                sqlInst = sqlInst + " session_id = '" + req.sessionID + "' AND ";
                sqlInst = sqlInst + " orden_hora = '" + dateTime + "') ";
                sqlInst = sqlInst + " WHERE session_id = '" + req.sessionID + "' AND ";
                sqlInst = sqlInst + " orden_hora = '" + dateTime + "'";
                console.log('sqlInst = ' + sqlInst);
                
                let myPromise = new Promise(function(myResolve, myReject) {
                    let x = 0;
                    // some code (try to change x to 5)
                    /*
                    if (x == 0) {
                      myResolve("OK");
                    } else {
                      myReject("Error");
                    }
                    */
                    myResolve = updateDB(sqlInst);
                  });
                  
                  myPromise.then(
                    /*
                    function(value) {myDisplayer(value);},
                    function(error) {myDisplayer(error);}
                    */
                  );
                
            })          
            .catch(error => res.send(error))                       
                
              
    },

    listaCompras: function(req,res, next){

        let sqlInst = "SELECT o.id_orden,  o.nombre_cliente, o.apellido_cliente, o.total, ";
        sqlInst = sqlInst + " a.producto_nombre, a.producto_descripcion, a.cantidad FROM ";
        sqlInst = sqlInst + " (SELECT * FROM ordenes) as o, ";
        sqlInst = sqlInst + " (SELECT * FROM ordenes_articulos) as a ";
        sqlInst = sqlInst + " WHERE o.id_orden = a.id_orden ";
        sqlInst = sqlInst + " AND id_cliente = " + req.params.id;
        console.log('sqlInst = ' + sqlInst);

        //return res.send('SQL = ' + sqlInst);
        

        bridge(sqlInst)
            .then(function(resultado){
                console.log('Resultados promesa = ' + JSON.stringify(resultado));
                return resultado;
            })
            .then(function(data) {            
                console.log('Datos = ' + JSON.stringify(data));
                res.send('Datos = ' + JSON.stringify(data)); 
            }) 
            .catch(function(error){
                console.log(error);
            })
    }
}

// Insert records
function updateDB(instruccion,next){
    const mysql = require('mysql2');

    // create the connection to database
    const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    //password: 'secret',
    database: 'bd007'
    });

    // simple query
    connection.query(
    instruccion,
    function(err, results, fields) {
        if (err) {

            console.log('>>> [err]', err);
            return 'updateDB = Error';
        } else {
            return 'updateDB = OK';
        }
        console.log(results); // results contains rows returned by server
        // console.log(fields); // fields contains extra meta data about results, if available
    }
    );
    next();
}


function bridge(instruccion){
    return readDB(instruccion);
}
//Get data from database
// get the client
function readDB(instruccion){
    const mysql = require('mysql2');

    // create the connection to database
    const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    //password: 'secret',
    database: 'bd007'
    });

    // simple query
    connection.query(
    instruccion,
    function(err, results, fields) {
        if (err) {

            console.log('>>> [err]', err);
            return 'updateDB = Error';
        } else {
            console.log('Results = ' + JSON.stringify(results,null,4));
            return Promise.results;
        }
        //console.log(results); // results contains rows returned by server
        // console.log(fields); // fields contains extra meta data about results, if available
    }
    );
    
}

module.exports = ordenesController;