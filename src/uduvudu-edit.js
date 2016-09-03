/* global _:false, $:false, Handlebars:false, rdf:false */
'use strict';

var _ = require('underscore')
var uduvudu = require('./uduvudu.js')

var uduvudu_edit = {
  version: "0.0.1",
  stageMode: "initial",
  stageCombines: []
};


uduvudu_edit.initialize = function() {
    uduvudu.helper.injectCss(uduvudu_edit.css);
}

uduvudu_edit.stage = function (type, predicate, name, resource) {
    console.log(type);
    if (type == "combine" || type == "predicate") {
        uduvudu_edit.stage_combine(name, resource);
    } else {
        if(predicate) {
            var term = uduvudu.helper.getTerm(predicate);
        } else {
            var term = _uniqueId('term_');
        }
        uduvudu_edit.stage_predicate(predicate, term);
    }
}

uduvudu_edit.stage_combine = function (name, resource) {
    uduvudu_edit.stageCombines = _.union(uduvudu_edit.stageCombines, [{name: name, resource: resource}]);
    var template = _.template(uduvudu_edit.tpl.combine);
    var id = _.uniqueId('tpl_');
    var html = template({def: {combines: uduvudu_edit.stageCombines, templateVariable: id, matcherName: id, abstractTemplate: id, order: 100000}});
    document.getElementById('edit_area').innerHTML = html
}

uduvudu_edit.stage_predicate = function (predicate, term) {
    var template = _.template(uduvudu_edit.tpl.predicate);
    var html = template({def: {predicate: predicate, templateVariable: term, matcherName: term, abstractTemplate: term, order: 100000}});
    document.getElementById('edit_area').innerHTML = html;
}

uduvudu_edit.add_predicate = function () {
    var def = {};
    def.templateVariable = document.getElementById('frm_templateVariable').value;
    def.abstractTemplate = document.getElementById('frm_abstractTemplate').value;
    def.predicate = document.getElementById('frm_predicate').value;
    def.matcherName = document.getElementById('frm_matcherName').value;
    def.order = document.getElementById('frm_order').value;
    var matcher = uduvudu.matchers.createPredicate(def)
    uduvudu.helper.addMatcher(matcher);
    uduvudu.helper.addVisualizer(document.getElementById('frm_template').value, def.abstractTemplate);
    document.getElementById('edit_area').innerHTML = "";
    uduvudu.process();
}

uduvudu_edit.add_combine = function () {
    var def = {};
    def.templateVariable = document.getElementById('frm_templateVariable').value;
    def.abstractTemplate = document.getElementById('frm_abstractTemplate').value;
    def.matcherName = document.getElementById('frm_matcherName').value;
    def.combineIds = _.pluck(uduvudu_edit.stageCombines, 'name');
    def.order = document.getElementById('frm_order').value;
    console.log(def);
    var matcher = uduvudu.matchers.createCombine(def)
    uduvudu.helper.addMatcher(matcher);
    uduvudu.helper.addVisualizer(document.getElementById('frm_template').value, def.abstractTemplate);
    document.getElementById('edit_area').innerHTML = "";
    uduvudu_edit.stageCombines = [];
    uduvudu.process();
}

uduvudu_edit.load = function (matcherName) {
  console.log(matcherName);
}

/**
 * Overload uduvudu.editor to initialize the templates and matchers.
 * @param {store} The store providing templates.
 */

uduvudu.editor = function (store) {
   uduvudu_edit.store = store; 
}


/**
 * Overload the final render step which compiles and renders the template with the context to inject the editor shims.
 * @param {String} [templateName] The templateName used to render.
 * @param {Object} [finalContext] The context structure to render.
 * @returns {String} Returns the output as a String.
 */

uduvudu.helper.renderContext = function (templateName, finalContext) {
      var context = finalContext[_.first(_.keys(finalContext))];
      var shimPre = '<div class="shim">';
      var shimPost = '<div class="tools">' +
                     '  <div class="info"><a title="Resource: '+context.m.r+'">i</a></div>'+
                     '  <div class="edit"><a onClick="uduvudu_edit.load(\''+context.m.name+'\')">e</a></div>'+
                     '  <div class="add"><a onClick="uduvudu_edit.stage(\''+context.m.type+'\',\''+context.m.p+'\',\''+context.m.name+'\',\''+context.m.r+'\')">+</a></div>'+
                     '</div></div>'


      var
        output = '',
        contentTemplate;
      // create content part of output
      console.log('getTemplate', templateName);
      var content = uduvudu.helper.getTemplate(templateName);
      if (content) {
        contentTemplate = uduvudu.helper.compileTemplate(shimPre+content+shimPost);
        // console.log(finalContext);
      } else {
        console.log("NoTemplateFound", "There was no template with the name '"+templateName+"' found.",context);

        // fallback if no template found
        contentTemplate = uduvudu.helper.compileTemplate('<div><span title="missing template">'+templateName+'</span>: <%-'+_.first(_.keys(finalContext))+'.u%></div>');
      }

      output += contentTemplate(finalContext);

      // create scripting part of output
      var javascript = uduvudu.helper.getTemplate(templateName+"_js");

      if (javascript) {
          var javascriptTemplate = uduvudu.helper.compileTemplate(javascript);
          output += "<script type=\"text/javascript\">"+javascriptTemplate(finalContext)+"</script>";
      }
      return output;
}




/**
 * Assets to insert
 */
uduvudu_edit.css = ''
+'  .shim {\n'
+'    position: relative;\n'
+'    margin: 0 auto;\n'
+'    float: left;\n'
+'  }\n'
+'  .shim .tools {\n'
+'    position: absolute;\n'
+'    z-index: 1000;\n'
+'    width: 60px;\n'
+'    height: 20px;\n'
+'    position: absolute;\n'
+'    top: 2px;\n'
+'    right: 2px;\n'
+'    background-color: rgba(0, 0, 0, 0.4) !important;\n'
+'  }\n'
+' @media print {\n'
+'  .shim .tools {\n'
+'    border-top: 1px solid grey;\n'
+'    border-bottom: 1px solid grey;\n'
+'  }\n'
+' }\n'
+'  .add {\n'
+'    text-align: center;\n'
+'    position: absolute;\n'
+'    width: 20px;\n'
+'    height: 20px;\n'
+'    right: 0;\n'
+'    cursor: pointer;\n'
+'  }\n'
+'  .edit {\n'
+'    text-align: center;\n'
+'    position: absolute;\n'
+'    width: 20px;\n'
+'    height: 20px;\n'
+'    right: 20px;\n'
+'    cursor: pointer;\n'
+'  }\n'
+'  .info {\n'
+'    text-align: center;\n'
+'    position: absolute;\n'
+'    width: 20px;\n'
+'    height: 20px;\n'
+'    right: 40px;\n'
+'  }\n'
+'  #editor {\n'
+'    background-color: rgba(0, 0, 0, 0.1);\n'
+'    padding: 10px;\n'
+'    z-index: 100;\n'
+'    position: fixed;\n'
+'    width: 30%;\n'
+'    height: 100%;\n'
+'    right: 10px;\n'
+'  }\n'
+'  #content {\n'
+'    padding: 10px;\n'
+'    width: 60%;\n'
+'  }\n'
+'  #edit_area {\n'
+'    padding: 10px;\n'
+'    overflow-y: scroll;\n'
+'    height: 100%;\n'
+'  }\n'

uduvudu_edit.tpl = {}
uduvudu_edit.tpl.combine = ''
+'<div id="vars">\n'
+'    <p>Combine multiple matchers to a new matcher.</p>\n'
+'      <h3>matcher</h3>\n'
+'      <div class="form-group">\n'
+'         <label for="frm_matcherName">Matcher Name:</label>\n'
+'         <input class="form-control" id="frm_matcherName" value="<%-def.matcherName%>">\n'
+'      </div>\n'
+'      <div class="form-group">\n'
+'         <label for="frm_templateVariable">Template Variable:</label>\n'
+'         <input class="form-control" id="frm_templateVariable" value="<%-def.templateVariable%>">\n'
+'      </div>\n'
+'      <div class="form-group">\n'
+'         <label for="frm_order">Order :</label>\n'
+'         <input type="number" class="form-control" id="frm_order" value="<%-def.order%>">\n'
+'      </div>\n'
+'      <div>\n'
+'          <% _.each(def.combines, function (c) { print( def.templateVariable + \'.\' + c.name + \' \\n\')}); %>\n'
+'      </div>\n'
+'</div>\n'
+'<div id="template">\n'
+'      <h3>template</h3>\n'
+'      <div class="form-group">\n'
+'         <label for="frm_abstractTemplate">Abstract Template :</label>\n'
+'         <input class="form-control" id="frm_abstractTemplate" value="<%-def.abstractTemplate%>">\n'
+'      </div>\n'
+'      <div class="form-group">\n'
+'          <textarea rows="5" class="form-control" id="frm_template">&lt;div class="uv"&gt;\n'
+'<% _.each(def.combines, function (c) { print(\'    &lt;%=template(\' +def.templateVariable+\'.\'+ c.name + \')%&gt;\\n\')}); %>&lt;/div&gt;</textarea>\n'
+'      </div>\n'
+'</div>\n'
+'<button onClick="uduvudu_edit.add_combine()" class="btn btn-default">Add Matcher & Template</button>\n'
+'<br><br><br><br><br><br><br><br><br>\n'

uduvudu_edit.tpl.predicate = ''
+'<div id="vars">\n'
+'    <p>Creates a basic predicate matcher.</p>\n'
+'      <h3>matcher</h3>\n'
+'      <div class="form-group">\n'
+'        <label for="frm_predicate">Predicate:</label>\n'
+'        <input class="form-control" id="frm_predicate" value="<%-def.predicate%>" disabled>\n'
+'      </div>\n'
+'      <div class="form-group">\n'
+'         <label for="frm_matcherName">Matcher Name:</label>\n'
+'         <input class="form-control" id="frm_matcherName" value="<%-def.matcherName%>">\n'
+'      </div>\n'
+'      <div class="form-group">\n'
+'         <label for="frm_templateVariable">Template Variable:</label>\n'
+'         <input class="form-control" id="frm_templateVariable" value="<%-def.templateVariable%>">\n'
+'      </div>\n'
+'      <div class="form-group">\n'
+'         <label for="frm_order">Order :</label>\n'
+'         <input type="number" class="form-control" id="frm_order" value="<%-def.order%>">\n'
+'      </div>\n'
+'</div>\n'
+'<div id="template">\n'
+'      <h3>template</h3>\n'
+'      <div class="form-group">\n'
+'         <label for="frm_abstractTemplate">Abstract Template :</label>\n'
+'         <input class="form-control" id="frm_abstractTemplate" value="<%-def.abstractTemplate%>">\n'
+'      </div>\n'
+'      <div class="form-group">\n'
+'          <textarea rows="5" style="font-family: Courier New" class="form-control" id="frm_template">&lt;div class="uv"&gt;\n'
+'  &lt;%-<%-def.templateVariable%>.u%&gt;\n'
+'&lt;/div&gt;</textarea>\n'
+'      </div>\n'
+'</div>\n'
+'<button onClick="uduvudu_edit.add_predicate()" class="btn btn-default">Add Matcher & Template</button>\n'
+'<br><br><br><br><br><br><br><br><br>\n'

uduvudu_edit.initialize();

//export
if (typeof window !== 'undefined') {
    window.uduvudu_edit = uduvudu_edit;
}
module.exports = uduvudu_edit
