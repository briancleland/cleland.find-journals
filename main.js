define(function (require, exports, module) {
  'use strict';
  var
    CommandManager = brackets.getModule("command/CommandManager"),
    Commands = brackets.getModule("command/Commands"),
    DocumentManager = brackets.getModule("document/DocumentManager"),
    PanelManager = brackets.getModule("view/PanelManager"),
    KeyBindingManager = brackets.getModule("command/KeyBindingManager"),
    LanguageManager = brackets.getModule("language/LanguageManager"),
    ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
    Menus = brackets.getModule("command/Menus"),
    AppInit = brackets.getModule("utils/AppInit"),
    NativeApp = brackets.getModule("utils/NativeApp");

  var DO_FIND_JOURNALS = "find_journals.run";
  var panelHtml = require("text!html/panel.html");
  var panel;
  var _find = require("lib/find");
  var _table = require("lib/table");

  function _journalBrowser() {
    if (panel.isVisible()) {
      panel.hide();
    } else {
      panel.show();
      _find.createTree();
      _table.createTable();
    }
  }
  
  CommandManager.register("Journal Browser", DO_FIND_JOURNALS, _journalBrowser);

  AppInit.appReady(function () {
    var viewMenu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    viewMenu.addMenuItem(DO_FIND_JOURNALS);
    ExtensionUtils.loadStyleSheet(module, "css/findJournals.css");
    ExtensionUtils.loadStyleSheet(module, "css/font-awesome/css/font-awesome.min.css");
    panel = PanelManager.createBottomPanel(DO_FIND_JOURNALS, $(panelHtml), 300);
    $("#fj-panel-close").click(function () {
      panel.hide();
    });
    $("#fj-panel #show-tree").click(function () {
      $("#fj-panel #table-stuff").hide();
      $("#fj-panel #tree-stuff").show();
    });
    $("#fj-panel #show-table").click(function () {
      $("#fj-panel #tree-stuff").hide();
      $("#fj-panel #table-stuff").show();
    });
  });


});