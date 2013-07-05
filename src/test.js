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
  filesystem = require('fs');


/***********************************************************
 * Function definitions
 **********************************************************/

var _fusekiQuery = function _fusekiQuery(query, accept, callback) {
  var options = {
      method: 'POST',
      uri: 'http://localhost:3030/uduvudu/query',
      headers: {
        'Accept': accept,
        'Content-type': 'application/x-www-form-urlencoded'
      } ,
      body: querystring.stringify({query: query})
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

filesystem.readFile('../rdf/kitchen/purchaser/addobject.sparql', 'utf8', function _readErr (err, query) {
  _fusekiQuery(query, 'text/turtle', function _receiveFuseki (error, response, data) {
    _spinQuery(data, 'text/turtle', function _receiveSpin (error, response, data) {
      _fusekiQuery(data, 'text/turtle', function _receiveFuseki (error, response, data) {
        console.log(data);
      });
    });
  });
});

