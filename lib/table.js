define(function (require, exports, module) {

  var
    CommandManager = brackets.getModule("command/CommandManager"),
    Commands = brackets.getModule("command/Commands"),
    EditorManager = brackets.getModule("editor/EditorManager"),
    ProjectManager = brackets.getModule("project/ProjectManager"),
    FindInFiles = brackets.getModule("search/FindInFiles");

  var scope = ProjectManager.getProjectRoot();
  var abs2010 = require("text!json/abs2010.json");
  var markedText;

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function createTable() {
    getReferences();
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function openFile(path, startCh, startLine, endCh, endLine) {
    CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {
      fullPath: path
    });
    var editor = EditorManager.getCurrentFullEditor();
    editor.setCursorPos({
      line: startLine - 1,
      ch: startCh
    })
    editor.centerOnCursor();
    if (markedText) {
      markedText.clear();
    }
    markedText = editor._codeMirror.markText({
      line: startLine - 1,
      ch: startCh
    }, {
      line: endLine - 1,
      ch: endCh
    }, {
      className: "highlighted"
    });
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function getReferences() {
    var queryInfo = {
      query: "((\\S+,\\s+(?:[A-Z]\\.\\s*)+,?(?:\\s\\&|\\sand)?\\s+){1,10})\\(?(\\d\\d\\d\\d[a-z]?)[\\)\\.](.*?)(?=(\\S+,\\s+(?:[A-Z]\\.))|\\n|\\r|$)",
      caseSensitive: true,
      isRegexp: true
    };
    FindInFiles.doSearchInScope(queryInfo, scope).then(function (results) {
      var journalRefs = {};
      var resultsString = JSON.stringify(results);
      // add num matches to node
      var numResults = (resultsString.match(/result/g) || []).length;
      var node = $("#journals-tree").tree("getSelectedNode");
      node.refs = numResults;
      $(node.element).find('.journal-refs').text("(" + node.refs + ")")
      for (var path in results) { // for each file
        if (results.hasOwnProperty(path)) {
//          output += "<div class='filename'>" + path + "</div>";
          var matches = results[path]["matches"];
          // generate html for references
          for (var i = 0; i < matches.length; i++) {
            var row = "<tr>";
            var startCh = matches[i]["start"]["ch"];
            var startLine = matches[i]["start"]["line"] + 1;
            var endCh = matches[i]["end"]["ch"];
            var endLine = matches[i]["end"]["line"] + 1;
            var authors = matches[i]["result"][1];
            var date = matches[i]["result"][3];
            var details = matches[i]["result"][4];
            row += "<td>" + authors + "</td>";
            row += "<td>" + date + "</td>";
            row += "<td>" + details + "</td>";
            row += "<td class='reference-text' " +
                   "data-path='" + path + "' " +
                   "data-start-ch='" + startCh + "' " +
                   "data-start-line='" + startLine + "' " +
                   "data-end-ch='" + endCh + "' " +
                   "data-end-line='" + endLine + "'>" +
                   "<span class='line-number'>" + startLine + "</span></td>";
            row += "</tr>";
            $("#fj-panel #journals-table").append(row);
          }
        }
      }
//      $("#fj-panel #journals-table").html(output);
      $(".reference-text").click(function () {
        $(".reference-text").removeClass("selected");
        $(this).addClass("selected");
        var path = $(this).data("path");
        var startCh = $(this).data("startCh");
        var startLine = $(this).data("startLine");
        var endCh = $(this).data("endCh");
        var endLine = $(this).data("endLine");
        openFile(path, startCh, startLine, endCh, endLine);
      })
    }, function (err) {
      console.log(err);
    });
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////                    

  exports.createTable = createTable;

});