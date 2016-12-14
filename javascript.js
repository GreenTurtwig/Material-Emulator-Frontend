var thegamesdb = require('thegamesdb');
var base64Img = require('base64-img');
var Datastore = require('nedb'), db = new Datastore({filename:  __dirname + '/gamedb.json', autoload: true});

angular.module('Frontend', ['ngMaterial'])
.config(function($mdThemingProvider, $compileProvider) {	
  $mdThemingProvider.theme('default')
    .primaryPalette('orange')
    .accentPalette('pink')
    .dark();
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(javascript):/);
})
.controller('Controller', function($scope, $mdDialog, $mdToast) {
  var gameTitle = "";
  var gamePath = "";
  var gameArtwork = "";
  var id;
  var artwork = "";
  var json;

  function load() {
  db.find({}, function (err, docs) {
    $scope.$apply(function () {
      $scope.games = docs;
    });
  });
  };
  load();

  $scope.deleteAll = function() {
    db.remove({}, { multi: true }, function (err, numRemoved) {
      $mdToast.show(
        $mdToast.simple()
        .textContent(numRemoved + " removed from database")
      );
	});
	load();
  };

  function addGame() {
  	db.insert({title: gameTitle, path: gamePath, artwork: gameArtwork});
  	gameTitle = "";
  	gamePath = "";
  	gameArtwork = "";
  };

  $scope.addGameDialog = function(ev) {
    $mdDialog.show({
      controller: dController,
      templateUrl: 'addGameDialog.html',
      parent: angular.element(document.body),
      targetEvent: ev
    });
  };

  function dController($scope, $mdDialog) {
    $scope.path = function() {
      gamePath = dialog.showOpenDialog({
        title: 'Choose Game',
      	filters: [{name: 'Games', extensions: ['exe', 'bat', 'lnk', 'jar']}]
      })[0];
    };

    $scope.cancel = function() {
      $mdDialog.cancel();
    };
    $scope.ok = function(ok) {
      $scope.dialogDisabled = true;

      gameTitle = $scope.title;

      console.log('Pressed OK');

      if (gamePath == "" || gameTitle == null) {
      	$mdToast.show(
          $mdToast.simple()
            .textContent("All fields are required")
        );
        $scope.dialogDisabled = false;
        return;
      }

      thegamesdb.getGamesList({'name': gameTitle, platform: 'PC'}).then(function(game) {
      	try {
      	  id = game[0].id;
      	  thegamesdb.getGameArt({'id': id}).then(function(art) {
      	  	for (var i = 0; i < art.length; i++){
      	  	  if (art[i].side == "front"){
      	  	  	artwork = "http://thegamesdb.net/banners" + art[i].url;
			    base64Img.requestBase64(artwork, function(err, res, body) {
  			      gameArtwork = body;
  			      addGame();
  	              $mdDialog.hide(ok);
 		          load();
	  	        });
			  }
			}
      	  });
      	} catch (err) {
          $mdToast.show(
            $mdToast.simple()
              .textContent("Couldn't find game")
          );
          $scope.dialogDisabled = false;
          return;
      	}
      }, function(err) {
      	  $mdToast.show(
            $mdToast.simple()
              .textContent("Internal server error")
          );
          $scope.dialogDisabled = false;
          return;
      });
    };
  }	
});