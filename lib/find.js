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
            type: "journal"
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


//  function initFilters() {
//    var fields = {};
//    var distinct = [];
//    // get unique journal fields
//    for (var i in abs2010) {
//      if (typeof (fields[abs2010[i].field]) == "undefined") {
//        distinct.push(abs2010[i].field);
//      }
//      fields[abs2010[i].field] = 0;
//    }
//    for (var field in fields) {
//      if (fields.hasOwnProperty(field)) {
//        $('#field-filter').append($('<option>', {
//          value: field,
//          text: field
//        }));
//      }
//    }
//    for (i = 1; i < 5; i++) {
//      $('#rating-filter').append($('<option>', {
//        value: i,
//        text: i
//      }));
//    }
//    $("#field-filter").change(function () {
//      $("#journals-list .journal").hide();
//      var field = encodeURIComponent($("#field-filter").val());
//      $("#journals-list ." + field).show();
//    });
//    $("#rating-filter").change(function () {
//      $("#journals-list .journal").hide();
//      var rating = $("#rating-filter").val();
//      $("#journals-list .rating-" + rating).show();
//    });
//  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function createJournalList() {
    var $journalsList = $("#fj-panel #journals-list");
    abs2010 = JSON.parse(abs2010);
    abs2010.forEach(function (journal) {
      var html = "<div class='journal " + encodeURIComponent(journal.field) + " rating-" + journal.rating + "'>" +
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

  function openFile(path, ch, line) {
    CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {
      fullPath: path
    });
    var editor = EditorManager.getCurrentFullEditor();
    editor.setCursorPos({
      line: line,
      ch: ch
    })
    editor.centerOnCursor();
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function getReferences(title) {
    var queryInfo = {
      query: title,
      caseSensitive: false,
      isRegexp: true
    };
    FindInFiles.doSearchInScope(queryInfo, scope).then(function (results) {
      console.log(results);
      var output = "";
      var journalRefs = {};
      for (var path in results) { // for each file
        if (results.hasOwnProperty(path)) {
          output += "<div class='filename'>" + path + "</div>";
          var matches = results[path]["matches"];
          for (var i = 0; i < matches.length; i++) {
            var ch = matches[i]["start"]["ch"];
            var line = matches[i]["start"]["line"] + 1;
            var text = matches[i]["line"];
            output += "<div class='reference-text' ";
            output += "data-path='" + path + "' ";
            output += "data-ch='" + ch + "' ";
            output += "data-line='" + line + "'>";
            output += "<span class='line-number'>" + line + ":</span> " + text + "</div>";
          }
        }
      }
      $("#fj-panel #references").html(output);
      $(".reference-text").click(function () {
        $(".reference-text").removeClass("selected");
        $(this).addClass("selected");
        var path = $(this).data("path");
        var ch = $(this).data("ch");
        var line = $(this).data("line");
        openFile(path, ch, line);
      })
    }, function (err) {
      console.log(err);
    });
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////                    

  exports.createTree = createTree;

});