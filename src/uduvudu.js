

function main() {
    var visuals = matcher("graph");
    var output = visualizer(visuals);
    return output;
};


function matcher(inputGraph) {
    return ([{context:{title: inputGraph, content:"none"}, template:{name: "tempSimple"}}]);
};


function visualizer(visuals) {
    var output = "";
    _.each(visuals,
        function (visual){
           output += "<h1>" + visual.context.title + "</h1>";
        });
    return output;
};
