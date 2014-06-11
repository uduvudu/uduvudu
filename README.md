UDUVUDU
=======

Uduvudu aims to be an easy to use **extensible** and **adaptive** RDF visualization library.

Current State
-------------
The library is now working in all recent major browsers. Right now the libary can read RDF in Turtle and N-Triple graphs. We plan to support in future also RDF/XML and JSON-LD.

Overview
--------
Uduvudu consists internally out of two parts. First the [Matcher](/doc/matcher.md) which extracts defined structures based on descriptions. Second the [Renderer](/doc/templates.md) which incorporates the context (language and device) and uses templates to render the final output.

![Schematic Overview](doc/overview.png)

Use
---

[Install](/doc/install.md): How to integrate Uduvudu and the necessary dependencies in your project.

[Add Matcher](/doc/matcher.md): How to define your own matchers definitions.

[Add Templates](/doc/templates.md): How to define your own templates.

Extend
------
You can extend the library by adding new matcher factories. Please study the functions `uduvudu.matchers.*` in `src/uduvudu.js` which define the current available matcher as factories.
