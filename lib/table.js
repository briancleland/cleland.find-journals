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

  function getJournal(details) {
    for (var i in abs2010) {
      if (details.indexOf(abs2010[i].title) > -1) {
        return abs2010[i];
      }
    }
    return {
      title: "",
      rating: ""
    };
  }


  ////////////////////////////////////////////////////////////////////////////////////////////////

  function createTable() {
    abs2010 = JSON.parse(abs2010);
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
    var AUTHOR = "\\S+,\\s+(?:[A-Z]\\.\\s*)+";
    var AUTHOR_LIST = "((" + AUTHOR + ",?(?:\\s\\&|\\sand)?\\s+){1,10})";
//    var JOURNAL = "([a-z]|\\s)+(?!\\sal)\\.\\s";
    var JOURNAL = "([a-z]|\\s)+\\.\\s";
    var DATE = "\\(?(\\d\\d\\d\\d[a-z]?)[\\)\\.]+";
    var DETAILS = "(.*?)";
    var LOOKAHEAD = "(?=(" + AUTHOR + ")|(" + JOURNAL + DATE + ")|\\n|\\r|$)";
    var queryInfo = {
      query: "(" + AUTHOR_LIST + "|" + JOURNAL + ")" + DATE + DETAILS + LOOKAHEAD,
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
            var startCh = matches[i]["start"]["ch"];
            var startLine = matches[i]["start"]["line"] + 1;
            var endCh = matches[i]["end"]["ch"];
            var endLine = matches[i]["end"]["line"] + 1;
            var authors = matches[i]["result"][1];
            var date = matches[i]["result"][5];
            var details = matches[i]["result"][6];
            var journal = getJournal(matches[i]["result"][6]);
            var row = "<tr class='reference-text' " +
              "data-path='" + path + "' " +
              "data-start-ch='" + startCh + "' " +
              "data-start-line='" + startLine + "' " +
              "data-end-ch='" + endCh + "' " +
              "data-end-line='" + endLine + "'>";
            row += "<td class='authors'>" + authors + "</td>";
            row += "<td class='date'>" + date + "</td>";
            row += "<td class='details'>" + details + "</td>";
            row += "<td class='journal-title'>" + journal.title + "</td>";
            row += "<td class='journal-rating'>" + journal.rating + "</td>";
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