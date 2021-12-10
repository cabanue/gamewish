var MODEL = (function () {
  var _getPageData = function (pageID, callback) {
    let pageData = pageID;

    $.get(`pages/${pageData}/${pageData}.html`, function (data) {
      $("#app").html(data);
      if (callback) {
        callback(pageData);
      }
    });
  };

  return {
    getPageData: _getPageData,
  };
})();
