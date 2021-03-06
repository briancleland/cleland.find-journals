define(function (require, exports, module) {

  var
    CommandManager = brackets.getModule("command/CommandManager"),
    Commands = brackets.getModule("command/Commands"),
    EditorManager = brackets.getModule("editor/EditorManager"),
    ProjectManager = brackets.getModule("project/ProjectManager"),
    FindInFiles = brackets.getModule("search/FindInFiles");

  var scope = ProjectManager.getProjectRoot();
  var abs2010 = require("text!json/abs2010.json");

  require("lib/jqtree/tree.jquery");
  var $tree = $("#fj-panel #journals-tree");
  var markedText;

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function createTree() {
    abs2010 = JSON.parse(abs2010);
    var fields = {};
    var distinct = [];
    // get unique journal fields
    for (var i in abs2010) {
      var fieldname = abs2010[i].field;
      if (typeof (fields[fieldname]) == "undefined") {
        distinct.push(fieldname);
      }
      fields[fieldname] = 0;
    }
    var treeData = [];
    for (var fieldname in fields) {
      if (fields.hasOwnProperty(fieldname)) {
        treeData.push({
          label: fieldname,
          type: "fieldGroup",
          children: []
        });
      }
    }
    for (var i in abs2010) {
      var journal = abs2010[i];
      for (var j = 0; j < treeData.length; j++) {
        if (journal.field == treeData[j].label) {
          treeData[j].children.push({
            label: journal.title,
            rating: journal.rating,
            type: "journal",
            refs: 0
          });
        }
      }
    }
    $("#journals-tree").tree({
      data: treeData,
      dragAndDrop: true,
      onCreateLi: function (node, $li) {
        if (node.type == "fieldGroup") {
          $li.find('.jqtree-title').prepend('<i class="fa fa-folder-o"></i>');
          $li.find('.jqtree-title').addClass("tag-group");
          $li.find('.jqtree-title').after('<span class="journal-count">(' + node.children.length + ')</span>');
        } else {
          $li.find('.jqtree-title').addClass("journal");
          $li.find('.jqtree-title').after('<span class="journal-refs">(?)</span>');
          for (i = 0; i < node.rating; i++) {
            $li.find('.jqtree-title').after('<span class="fa fa-star"></span>');
          }
        }
      }
    });
    // Find references when node is clicked
    $("#journals-tree").bind(
      'tree.click',
      function (event) {
        if (event.node.type == "journal") {
          getReferences(event.node.name);
        }
      }
    );
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function createJournalList() {
    var $journalsList = $("#fj-panel #journals-list");
    abs2010 = JSON.parse(abs2010);
    abs2010.forEach(function (journal) {
      var html =
        "<div class='journal " + encodeURIComponent(journal.field) + " rating-" + journal.rating + "'>" +
        "<span class='title'>" + journal.title + "</span>" +
        "<span class='rating'>" + journal.rating + "</span>"; +
      "<span class='ref-count'></span></div>";
      $journalsList.append(html);
    });
    $("#fj-panel #journals-list .title").click(function () {
      $(".title").removeClass("selected");
      $(this).addClass("selected");
      var title = $(this).text();
      getReferences(title);
    });
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function openFile(path, startCh, startLine, endCh, endLine) {
    CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {
      fullPath: path
    });
    var editor = EditorManager.getCurrentFullEditor();
    editor.setCursorPos({
      line: startLine-1,
      ch: startCh
    })
    editor.centerOnCursor();
    if (markedText) { 
      markedText.clear(); 
    }
    markedText = editor._codeMirror.markText(
      {line:startLine-1, ch:startCh}, 
      {line:endLine-1, ch:endCh}, 
      {className: "highlighted"}
    );    
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function getReferences(title) {
    var queryInfo = {
      query: title,
      caseSensitive: false,
      isRegexp: true
    };
    FindInFiles.doSearchInScope(queryInfo, scope).then(function (results) {
      var output = "";
      var journalRefs = {};
      var resultsString = JSON.stringify(results);
      // add num matches to node
      var numResults = (resultsString.match(/result/g) || []).length;
      var node = $("#journals-tree").tree("getSelectedNode");
      node.refs = numResults;
      $(node.element).find('.journal-refs').text("(" + node.refs + ")")
      for (var path in results) { // for each file
        if (results.hasOwnProperty(path)) {
          output += "<div class='filename'>" + path + "</div>";
          var matches = results[path]["matches"];
          // generate html for references
          for (var i = 0; i < matches.length; i++) {
            var startCh = matches[i]["start"]["ch"];
            var startLine = matches[i]["start"]["line"] + 1;
            var endCh = matches[i]["end"]["ch"];
            var endLine = matches[i]["end"]["line"] + 1;
            var text = matches[i]["line"];
            output += "<div class='reference-text' ";
            output += "data-path='" + path + "' ";
            output += "data-start-ch='" + startCh + "' ";
            output += "data-start-line='" + startLine + "' ";
            output += "data-end-ch='" + endCh + "' ";
            output += "data-end-line='" + endLine + "'>";
            output += "<span class='line-number'>" + startLine + ":</span> " + text + "</div>";
          }
        }
      }
      $("#fj-panel #references").html(output);
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

  exports.createTree = createTree;

});