var key = "d4162368797f46cbbd53d00e668f8329";
var gameID;
var _db = "";
var searchTerm = "";
var genreID = 0;
var genreName = "";
var pageNum = 0;
var categories = [];
const options = {
  style: {
    main: {
      background: "#f3f3f3",
      color: "black",
    },
  },
};

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

function login() {
  let password = $("#lPass").val();
  let email = $("#lEmail").val();

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      var user = userCredential.user;

      iqwerty.toast.toast("signed in", options);

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
      iqwerty.toast.toast("signed out", options);
      window.location.hash = "#/home";
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
  iqwerty.toast.toast("update successful", options);
}

function createAcc() {
  let password = $("#cPass").val();
  let email = $("#cEmail").val();
  let fName = $("#fName").val();
  let lName = $("#lName").val();

  let fullName = fName + " " + lName;

  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      var user = userCredential.user;

      updateUser(fullName);

      iqwerty.toast.toast("account created", options);

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
    <div class="game__image" style="background-image: url(${game.background_image});" onclick="gameInfo(${game.id})" alt="no image"></div>
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
  if (!game.background_image) {
    $(`#${index} .game__image`).attr(
      "style",
      "background-image: url(images/no-image.jpg);"
    );
  }
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

function displayRecommendations() {
  let currentUse = firebase.auth().currentUser;
  _db = firebase.firestore();
  const genreCount = [];

  _db
    .collection(currentUse.uid)
    .get()
    .then((querySnapshot) => {
      $.each(categories, function (index, category) {
        querySnapshot.forEach((doc) => {
          $.each(doc.data().genres, function (index, gameGenre) {
            if (gameGenre.name == category.name) {
              category.count++;
            }
          });
        });
      });
      $.each(categories, function (index, num) {
        genreCount.push(num.count);
      });
      let highestNum = Math.max(...genreCount);
      $.each(categories, function (index, category) {
        if (category.count == highestNum) {
          genreName = category.name;
          genreID = category.id;
          pageNum = 1;
          searchTerm = "";
          displaySearch();
          return false;
        }
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

function getGenres() {
  $.get(`https://api.rawg.io/api/genres?key=${key}`, function (data) {
    $.each(data.results, function (index, genre) {
      let genreObj = {
        name: genre.name,
        count: 0,
        id: genre.id,
      };
      categories.push(genreObj);
    });
  });
}

function displayGenreGames(genre, name) {
  pageNum = 1;
  genreID = genre;
  genreName = name;
  searchTerm = "";
  window.location.hash = "#/search";
  displaySearch();
}

function displayProfile() {
  let currentUse = firebase.auth().currentUser;
  $("#displayName").val(`${currentUse.displayName}`);
  $("#email").val(`${currentUse.email}`);
}

function displaySearch() {
  if (searchTerm == "") {
    $.get(
      `https://api.rawg.io/api/games?genres=${genreID}&key=${key}&page=${pageNum}`,
      function (data) {
        $("#searchterm").html(`${genreName}`);
        $("#pageNum").html(`${pageNum}`);
        $.each(data.results, function (index, game) {
          displayGame(game, index);
        });
        if (data.next) {
          $(".fa-chevron-circle-right").css("display", "block");
        } else {
          $(".fa-chevron-circle-right").css("display", "none");
        }
        if (pageNum == 1) {
          $(".fa-chevron-circle-left").css("display", "none");
        } else {
          $(".fa-chevron-circle-left").css("display", "block");
        }
      }
    );
  } else if (genreID == 0) {
    $.get(
      `https://api.rawg.io/api/games?search=${searchTerm}&key=${key}&page=${pageNum}`,
      function (data) {
        console.log(data);
        $("#searchterm").html(`${searchTerm}`);
        $("#pageNum").html(`${pageNum}`);
        $.each(data.results, function (index, game) {
          displayGame(game, index);
        });
        if (data.next) {
          $(".fa-chevron-circle-right").css("display", "block");
        } else {
          $(".fa-chevron-circle-right").css("display", "none");
        }

        if (pageNum == 1) {
          $(".fa-chevron-circle-left").css("display", "none");
        } else {
          $(".fa-chevron-circle-left").css("display", "block");
        }
      }
    );
  }
}

function previousPage() {
  pageNum--;
  $(".games").empty();
  displaySearch();
}

function nextPage() {
  pageNum++;
  $(".games").empty();
  displaySearch();
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
          <div class="game-info__top__right__wishlist" id="add" onclick="addToWishlist(0, ${data.id})"><p>Add to Wishlist <i class="far fa-heart"></i></p> </div>
          <div class="game-info__top__right__wishlist" id="remove" onclick="removeFromWishlist(0, ${data.id})"><p>Remove from Wishlist <i class="far fa-heart"></i></p> </div>
        </div>
        </div>
        <div class="game-info__description">
            ${data.description}
        </div>
        <div class="game-info__screenshots">

      </div>
      `);
    $.each(data.platforms, function (ind, platform) {
      $(".game-info__top__right__platforms").append(
        `${platform.platform.name}, `
      );
    });
    $.each(data.publishers, function (ind, publisher) {
      $(".game-info__top__right__publishers").append(`${publisher.name}, `);
    });
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
    let currentUse = firebase.auth().currentUser;
    _db = firebase.firestore();

    if (currentUse) {
      var game = _db
        .collection(currentUse.uid)
        .where("gameid", "==", Number(data.id));

      game.get().then((querySnapshot) => {
        if (querySnapshot.empty) {
          game.onSnapshot((doc) => {
            $("#add").css("display", "flex");
            $("#remove").css("display", "none");
          });
        } else {
          $("#add").css("display", "none");
          $("#remove").css("display", "flex");
        }
      });
    } else {
      $("#add").css("display", "flex");
      $("#remove").css("display", "none");
    }
  });
}

function gameInfo(id) {
  gameID = id;
  window.location.hash = "#/game-info";
}

function addToWishlist(id, gameid) {
  $.get(`https://api.rawg.io/api/games/${gameid}?key=${key}`, function (data) {
    let gameGenres = data.genres;

    let gameObj = {
      gameid: gameid,
      genres: gameGenres,
    };

    let currentUse = firebase.auth().currentUser;
    _db = firebase.firestore();

    if (currentUse) {
      _db
        .collection(currentUse.uid)
        .doc()
        .set(gameObj)
        .then(function (doc) {
          iqwerty.toast.toast("game added to wishlist", options);
          if (window.location.hash != "#/game-info") {
            $(`#add${id}`).css("display", "none");
            $(`#remove${id}`).css("display", "block");
          } else {
          }
        })
        .catch((error) => {
          iqwerty.toast.toast("problem adding game to wishlist", options);
        });
    } else {
      iqwerty.toast.toast("you must be signed in to wishlist", options);
    }
  });
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
        iqwerty.toast.toast("game removed from wishlist", options);

        if (window.location.hash == "#/wishlist") {
          $(`#${id}`).remove();
        }
        if (window.location.hash != "#/game-info") {
          $(`#add${id}`).css("display", "block");
          $(`#remove${id}`).css("display", "none");
        } else {
        }
      });
    })
    .catch((error) => {
      iqwerty.toast.toast("problem removing from wishlist", options);
    });
}

function loadPage(pageID) {
  if (pageID == "home") {
    homeCategories();
    $("#search").keyup(function (e) {
      if (e.keyCode == 13) {
        searchTerm = $("#search").val();
        genreID = 0;
        pageNum = 1;
        window.location.hash = "#/search";
        displaySearch();
      }
    });
  } else if (pageID == "profile") {
    displayProfile();
  } else if (pageID == "game-info") {
    loadGameInfo();
  } else if (pageID == "wishlist") {
    displayWishlist();
  } else if (pageID == "recommendations") {
    displayRecommendations();
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
    getGenres();
  } catch {
    console.error("yes");
  }
});
