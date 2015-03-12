/* global _:false, $:false, Handlebars:false, rdf:false */
'use strict';

var uduvudu_edit = {
  version: "0.0.1",
  stageMode: "initial",
  stageCombines: []
};

//document.getElementById('literal').text = '<span><a href="javascript:uduvudu_edit.addPredicateMatcher(<%=obj.predicate.u%>)">+</a><a>&#x220A;</a><a>&#x21AC;</a></span>';

uduvudu_edit.stage = function (type, predicate, name, resource) {
    console.log(type);
    if (type == "combine" || type == "predicate") {
        uduvudu_edit.stage_combine(name, resource);
    } else {
        var def = {};
        def.predicate = predicate;
        if(predicate) {
            var term = uduvudu.helper.getTerm(predicate);
            def.matcherName = term;
            def.templateVariable = term;
            def.templateId = term;
            def.order = 100000;
        } 
        uduvudu_edit.stage_predicate(def);
    }
}

uduvudu_edit.stage_combine = function (name, resource) {
    uduvudu_edit.stageCombines = _.union(uduvudu_edit.stageCombines, [{name: name, resource: resource}]);
    var elem = document.getElementById('tmpCombine').innerHTML;
    var template = _.template(elem);
    var html = template({def: {combines: uduvudu_edit.stageCombines, templateVariable: _.uniqueId('tpl_')}});
    document.getElementById('edit_area').innerHTML = html
}

uduvudu_edit.stage_predicate = function (def) {
    var elem = document.getElementById('tmpPredicate').innerHTML;
    var template = _.template(elem);
    var html = template({def: def});
    document.getElementById('edit_area').innerHTML = html
}

uduvudu_edit.add_predicate = function () {
    var def = {};
    def.templateVariable = document.getElementById('frm_templateVariable').value;
    def.templateId = document.getElementById('frm_templateId').value;
    def.predicate = document.getElementById('frm_predicate').value;
    def.matcherName = document.getElementById('frm_matcherName').value;
    def.order = document.getElementById('frm_order').value;
    var matcher = uduvudu.matchers.createPredicate(def)
    uduvudu.helper.addMatcher(matcher);
    uduvudu.helper.addVisualizer(def.order = document.getElementById('frm_template').value, def.templateId);
    console.log(def);
    uduvudu.reprocess();
}

uduvudu_edit.add_combine = function () {
    console.log('click');
}

uduvudu_edit.load = function (matcherName) {
  console.log(matcherName);
}

uduvudu.helper.renderContext = function (templateName, finalContext) {
      var context = finalContext[_.first(_.keys(finalContext))];
      var shimPre = '<div class="shim">';
      var shimPost = '<div class="tools">' +
                     '  <div class="info"><a title="Resource: '+context.m.r+'">i</a></div>'+
                     '  <div class="edit"><a onClick="uduvudu_edit.load(\''+context.m.name+'\')">e</a></div>'+
                     '  <div class="add"><a onClick="uduvudu_edit.stage(\''+context.m.type+'\',\''+context.m.p+'\',\''+context.m.name+'\',\''+context.m.r+'\')">+</a></div>'+
                     '</div></div>'


      //TODO: Template caching like http://lostechies.com/derickbailey/2012/04/10/javascript-performance-pre-compiling-and-caching-html-templates/
      var
        output = '',
        contentTemplate;
      // create content part of output
      var content = uduvudu.helper.getTemplate(templateName);
      if (content) {
        contentTemplate = uduvudu.helper.compileTemplate(shimPre+content+shimPost);
        console.log(finalContext);
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
