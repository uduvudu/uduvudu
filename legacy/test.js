/**
 * @file
 * @copyright 2013 Berne University of Applied Sciences (BUAS) -- {@link http://bfh.ch}
 * @author Pascal Mainini <pascal.mainini@bfh.ch>
 * @version 0.1
 *
 * ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING !
 *
 * THIS FILE HAS NO DEFINITIVE LICENSING INFORMATION.
 * LICENSE IS SUBJECT OF CHANGE ANYTIME SOON - DO NOT DISTRIBUTE!
 *
 * ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING !
 *
 * This file contains ...
 */

/*jshint node:true, bitwise:true, curly:true, immed:true, indent:2, latedef:true, newcap:true, noarg: true, noempty:true, nonew:true, quotmark:single, undef:true, unused: true, trailing:true, white:false */

/***********************************************************
 * Initialisation
 **********************************************************/

'use strict';

var request = require('request'),
  querystring = require('querystring'),
  filesystem = require('fs'),
  rdfstore = require('rdfstore');


/***********************************************************
 * Function definitions
 **********************************************************/

var _fetch = function _fetch(uri, accept, callback) {
  if(uri.lastIndexOf('file', 0) === 0) {
    filesystem.readFile(uri.substring(6), 'utf8', callback);
  } else {
    var options = {
        method: 'GET',
        uri: uri,
        headers: {
          'Accept': accept
        }
    };

    request(options, callback);
  }
};

var _fusekiQuery = function _fusekiQuery(query, accept, callback) {
  var options = {
      method: 'POST',
      uri: 'http://localhost:3030/uduvudu/query',
      headers: {
        'Accept': accept,
        'Content-type': 'application/x-www-form-urlencoded'
      },
      body: querystring.stringify({query: query})
  };

  request(options, callback);
};

var _fusekiPut = function _fusekiPut(graph, data, callback) {
  var options = {
      method: 'PUT',
      uri: 'http://localhost:3030/uduvudu/data?' + querystring.stringify({graph: graph}),
      headers: {'Content-type': 'text/turtle; charset=utf-8',
                'Content-Length': data.length},
      body: data
  };

  request(options, callback);
};

var _spinQuery = function _spinQuery(query, accept, callback) {
  var options = {
      method: 'GET',
      uri: 'http://spinservices.org:8080/spin/sparqlmotion?' +
        querystring.stringify({rdf: query, format: 'turtle', id: 'spin2sparql'}),
      headers: {
        'Accept': accept,
        'Content-type': 'application/x-www-form-urlencoded'
      }
  };

  request(options, callback);
};


/***********************************************************
 * Main script
 **********************************************************/

_fetch(process.argv[2], 'text/turtle', function _readErr (err, input) {
  _fusekiQuery(input, 'text/turtle', function _receiveFuseki (error, response, data) {

    _fusekiPut('http://test.me', data, function(err, response) {
      console.log(err);
      console.log(response);
      });
/*
    var store = new rdfstore.Store();
    store.setPrefix('sp','http://spinrdf.org/sp');
    store.setPrefix('rdfs', 'http://www.w3.org/2000/01/rdf-schema#');
    store.setPrefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#');

    store.load('text/turtle', data, function(success, results) {

    store.execute('SELECT * WHERE { ?s a sp:Construct ; (! :murks)* ?o . }', function(success, data) {
//    store.execute('SELECT * WHERE { ?s ?p ?o . }', function(success, data) {
      console.log(success);
      console.log(data);
    });

    });

*/




//    _spinQuery(data, 'text/turtle', function _receiveSpin (error, response, data) {
//      _fusekiQuery(data, 'text/turtle', function _receiveFuseki (error, response, data) {
//     });
    });
  });

