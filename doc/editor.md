Editor
-------

The editor for Uduvudu can be used inside the current application you are building. To enable the editor you simply add the scrript `uduvudu-edit.js` after the main script `uduvudu.js`was loaded already.

Please look at [edit.html](https://github.com/uduvudu/uduvudu/blob/master/edit.html) for an example.

The editor then hooks into Uduvudu and injects a shim around each template with user interface elements.

The editor expects the following divisions where the editor is rendered into:
```
   <div id="editor">
      <h2>edit</h2>
      <div id="edit_area"></div>
   </div>
```

After each insert of a new template or matcher, the current representation of the data is reprocessed, this for you need to call `uduvudu.process` with a callback.
