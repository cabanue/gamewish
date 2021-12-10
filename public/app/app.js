var key = "d4162368797f46cbbd53d00e668f8329";
var gameID;
var _db = "";
var searchTerm = "";
var genreID = 0;
var genreName = "";
var pageNum = 0;

function initFirebase() {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      console.log("connected");
      $(".nav__right__login").css("display", "none");
      $(".nav__right__profile").css("display", "block");
    } else {
      console.log("user is not there");
      $(".nav__right__login").css("display", "block");
      $(".nav__right__profile").css("display", "none");
    }
  });
}

function game() {
  // let genresCount = [
  //   {
  //     name: action,
  //     count: 2,
  //   },
  //   {
  //     name: adventure,
  //     count: 4,
  //   },
  // ];
  // const genresCount = [1, 2, 3, 4, 5];
  // console.log(Math.max(...genresCount));
  // $.get(
  //   `https://api.rawg.io/api/games?search=xenoblade&key=${key}&page=1`,
  //   function (data) {
  //     console.log(data);
  //   }
  // );
  // $.get(
  //   `https://api.rawg.io/api/games?genre=4&key=${key}&page=1`,
  //   function (data) {
  //     console.log(data);
  //   }
  // );
}

function login() {
  let password = $("#lPass").val();
  let email = $("#lEmail").val();

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      var user = userCredential.user;
      console.log("signed in");

      let password = $("#login-password").val("");
      let email = $("#login-email").val("");
      window.location.hash = "#/home";
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorMessage);
    });
}

function logout() {
  firebase
    .auth()
    .signOut()
    .then(() => {
      console.log("signed out");
    })
    .catch((error) => {
      console.log(error);
    });
}

function updateUser(fName) {
  firebase.auth().currentUser.updateProfile({
    displayName: fName,
  });
}

function changeEmail(email) {
  let currentUse = firebase.auth().currentUser;
  console.log(typeof email);

  currentUse
    .updateEmail(email)
    .then(() => {
      console.log("email updated");
    })
    .catch((error) => {
      console.log(error);
    });
}

function resetPass(password) {
  let currentUse = firebase.auth().currentUser;
  console.log(typeof password);

  currentUse
    .updatePassword(password)
    .then(() => {
      console.log("password updated");
    })
    .catch((error) => {
      console.log(error);
    });
}

function updateAcc() {
  let newName = $("#displayName").val();
  let newEmail = $("#email").val();
  let newPass = $("#password").val();

  if (newName) {
    updateUser(newName);
  }
  if (newPass) {
    resetPass(newPass);
  }
  if (newEmail) {
    changeEmail(newEmail);
  }
}

function createAcc() {
  let password = $("#cPass").val();
  let email = $("#cEmail").val();
  let fName = $("#fName").val();
  let lName = $("#lName").val();

  let fullName = fName + " " + lName;
  console.log(fullName);

  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      var user = userCredential.user;

      updateUser(fullName);

      $("#cPass").val("");
      $("#cEmail").val("");
      $("#fname").val("");
      $("#lname").val("");
      window.location.hash = "#/home";
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorMessage);
    });
}

function displayGame(game, index) {
  $(".games").append(`
  <div class="game" id="${index}">
    <p class="game__title" onclick="gameInfo(${game.id})">${game.name}</p>
    <div class="game__image" style="background-image: url(${game.background_image});" onclick="gameInfo(${game.id})"></div>
    <p class="game__platforms" onclick="gameInfo(${game.id})">Platforms: <span id="platforms${index}"></span></p>
    <div class="game__heart">
    <i class="far fa-heart" id="add${index}" onclick="addToWishlist(${index}, ${game.id})"></i>
    <i class="fas fa-heart wishlisted" id="remove${index}" onclick="removeFromWishlist(${index}, ${game.id})"></i>
    </div>
  </div>
`);
  $.each(game.platforms, function (ind, platform) {
    $(`#platforms${index}`).append(`${platform.platform.name}, `);
  });
  let currentUse = firebase.auth().currentUser;
  _db = firebase.firestore();

  if (currentUse) {
    var game = _db
      .collection(currentUse.uid)
      .where("gameid", "==", Number(game.id));

    game.get().then((querySnapshot) => {
      if (querySnapshot.empty) {
        game.onSnapshot((doc) => {
          // do stuff with the data
          $(`#add${index}`).css("display", "block");
          $(`#remove${index}`).css("display", "none");
        });
      } else {
        $(`#add${index}`).css("display", "none");
        $(`#remove${index}`).css("display", "block");
      }
    });
  } else {
  }
}

function displayWishlist() {
  let currentUse = firebase.auth().currentUser;
  _db = firebase.firestore();
  let index = 0;

  _db
    .collection(currentUse.uid)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        $.get(
          `https://api.rawg.io/api/games/${doc.data().gameid}?key=${key}`,
          function (data) {
            index++;
            displayGame(data, index);
          }
        );
      });
    })
    .catch((error) => {
      console.log("data not obtained");
    });
}

function homeCategories() {
  $.get(`https://api.rawg.io/api/genres?key=${key}`, function (data) {
    $.each(data.results, function (index, genre) {
      $(".home__categories").append(`
        <div class="category" style="background-image: linear-gradient(
          to right,
          rgba(0, 0, 0, 0.6),
          rgba(0, 0, 0, 0.6)
        ),
        url(${genre.image_background})" id="${genre.id}" onclick="displayGenreGames(${genre.id}, '${genre.name}')">
          ${genre.name}
        </div>
      `);
    });
  });
}

function displayGenreGames(genre, name) {
  pageNum = 1;
  genreID = genre;
  genreName = name;
  searchTerm = "";
  displaySearch();
}

function displayProfile() {
  let currentUse = firebase.auth().currentUser;
  $("#displayName").val(`${currentUse.displayName}`);
  $("#email").val(`${currentUse.email}`);
  console.log(currentUse);
}

function displaySearch() {
  window.location.hash = "#/search";
  if (searchTerm == "") {
    $.get(
      `https://api.rawg.io/api/games?genre=4&key=${key}&page=${pageNum}`,
      function (data) {
        $("#searchterm").html(`${genreName}`);
        $.each(data.results, function (index, game) {
          displayGame(game, index);
        });
        // if (data.next) {

        // }
        // $.get(data.next, function (data) {
        //   $.each(data.results, function (index, game) {
        //     let newInd = index + 20;
        //     displayGame(game, newInd);
        //   });
        // });
      }
    );
  } else if (genreID == 0) {
    $.get(
      `https://api.rawg.io/api/games?search=${searchTerm}&key=${key}`,
      function (data) {
        $("#searchterm").html(`${searchTerm}`);
        $.each(data.results, function (index, game) {
          displayGame(game, index);
        });
      }
    );
    $("#searchterm").html(`${searchTerm}`);
  }
}

function loadGameInfo() {
  $.get(`https://api.rawg.io/api/games/${gameID}?key=${key}`, function (data) {
    $(".game-info").html(`
      <div class="game-info__top">
        <div class="game-info__top__left" style="background-image: url(${data.background_image});">

        </div>
        <div class="game-info__top__right">
          <p class="game-info__top__right__title">${data.name}</p>
          <p class="game-info__top__right__platforms"></p>
          <p class="game-info__top__right__publishers"></p>
          <div class="game-info__top__right__wishlist"><p>Add to Wishlist <i class="far fa-heart"></i></p> </div>
        </div>
        </div>
        <div class="game-info__description">
            ${data.description}
        </div>
        <div class="game-info__screenshots">

      </div>
      `);
    $.get(
      `https://api.rawg.io/api/games/${gameID}/screenshots?key=${key}`,
      function (screenshots) {
        $.each(screenshots.results, function (index, screenshot) {
          $(".game-info__screenshots").append(`
          <div class="screenshot" style="background-image: url(${screenshot.image});"></div>
        `);
        });
      }
    );
  });
}

function gameInfo(id) {
  gameID = id;
  window.location.hash = "#/game-info";
}

function addToWishlist(id, gameid) {
  let gameObj = {
    gameid: gameid,
  };

  let currentUse = firebase.auth().currentUser;
  _db = firebase.firestore();

  if (currentUse) {
    _db
      .collection(currentUse.uid)
      .doc()
      .set(gameObj)
      .then(function (doc) {
        console.log("success");
        $(`#add${id}`).css("display", "none");
        $(`#remove${id}`).css("display", "block");
      })
      .catch((error) => {
        console.log("game not added to wishlist");
      });
  } else {
    console.log("you must be signed in");
  }
}

function removeFromWishlist(id, gameid) {
  let currentUse = firebase.auth().currentUser;
  _db = firebase.firestore();

  var game = _db
    .collection(currentUse.uid)
    .where("gameid", "==", Number(gameid));
  game
    .get()
    .then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        doc.ref.delete();
        console.log("deleted");
        $(`#add${id}`).css("display", "block");
        $(`#remove${id}`).css("display", "none");
        if (window.location.hash == "#/wishlist") {
          // MODEL.getPageData("wishlist", loadPage);
          $(`#${id}`).remove();
        }
      });
    })
    .catch((error) => {
      console.log("not deleted");
    });
}

function loadPage(pageID) {
  if (pageID == "home") {
    homeCategories();
    $("#search").keyup(function (e) {
      if (e.keyCode == 13) {
        searchTerm = $("#search").val();
        genreID = 0;
        displaySearch();
      }
    });
  } else if (pageID == "profile") {
    displayProfile();
  } else if (pageID == "game-info") {
    loadGameInfo();
  } else if (pageID == "wishlist") {
    displayWishlist();
  } else if (pageID == "recommedations") {
    console.log("hi");
  }
}

function route(id) {
  let hashTag = window.location.hash;
  let pageID = hashTag.replace("#/", "");

  if (!hashTag) {
    pageID = id;
  }

  if (!pageID) {
    MODEL.getPageData("home", loadPage);
  } else {
    MODEL.getPageData(pageID, loadPage);
  }
}

function initListeners() {
  $(window).on("hashchange", route);
  route();

  $(".nav__right__profile").click(function () {
    $(".dropdown").toggleClass("hidden");
    $("#arrow").toggleClass("fa-chevron-down");
    $("#arrow").toggleClass("fa-chevron-up");
  });
}

$(document).ready(function () {
  try {
    let app = firebase.app();
    initFirebase();
    initListeners();
    game();
  } catch {
    console.error("yes");
  }
});