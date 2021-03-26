/****************************************************************************************************************************************
*
* Trigger media search when certain cells are edited.
*
* @param e {Object} The current cell being edited
*
* Directions
* 1. Create trigger to run function "atEdit", Event source: "From spreadsheet", Event type: "On edit"
* 2. Create an account or log in to https://www.themoviedb.org/
* 3. Get your API Key (v3 auth) from https://www.themoviedb.org/settings/api?language=en-US
* 4. Add your API key to var TMDbApiKey below.
* 5. Create a new sheet called "TMDb".
* 6. Create the following header items in Row 1: Search, name, media_type, overview, first_air_date, backdrop_path, genre_ids,
    id, origin_country, original_language, original_name, popularity, poster_path, vote_average, vote_count
* 7. Run atEdit once in the Google Apps Script editor to authorize the API.
* 8. Type a movie/TV search in Column A:A and the details from TMDb will autopopulate the rest of the row.
*
****************************************************************************************************************************************/

function atEdit(e) {

  //  Declare variables
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var searchSheet = spreadsheet.getSheetByName("TMDb");
  var resultsArray = [];

  // Edited cell gets passed into function
  var range = e.range;

  //  Returns the number of the edited row and column
  var thisRow = range.getRow();
  var thisCol = range.getColumn();
  var queryRange = searchSheet.getRange(thisRow, thisCol);
  var queryRangeValue = queryRange.getDisplayValue();

  //  If on Search sheet and a movie/show is entered below "Search" in A1, find TMDb ID for the media
  if (spreadsheet.getActiveSheet().getName() == searchSheet.getName() && thisCol == 1) {

    //    New search query was added
    if (queryRangeValue != "") {
      var tMDbSearch = searchTMDb(queryRangeValue);
      console.log(tMDbSearch);

      // Parse data to sheet
      try {
        if (tMDbSearch.total_results == 0) {
          console.log("Unsuccessful");
          resultsArray.push(["No results found"]);
        } else {
          console.log("Successful");
          resultsArray.push([tMDbSearch.name || tMDbSearch.title, tMDbSearch.media_type, tMDbSearch.overview,
          tMDbSearch.first_air_date || tMDbSearch.release_date, "https://www.themoviedb.org/t/p/original" + tMDbSearch.backdrop_path,
          tMDbSearch.genre_ids, '=HYPERLINK("https://www.themoviedb.org/' + tMDbSearch.media_type + '/' + tMDbSearch.id + '"; "' + tMDbSearch.id + '")',
          tMDbSearch.origin_country, tMDbSearch.original_language, tMDbSearch.original_name || tMDbSearch.original_title, tMDbSearch.popularity,
          "https://www.themoviedb.org/t/p/original" + tMDbSearch.poster_path, tMDbSearch.vote_average, tMDbSearch.vote_count]);
        }
      } catch (error) {
        console.log("Unsuccessful");
        resultsArray.push(["No results found"]);
      }
      console.log(resultsArray);

      //  Set data to spreadsheet
      try {
        searchSheet.getRange(thisRow, thisCol + 1, 1, resultsArray[0].length).setValues(resultsArray);
        SpreadsheetApp.flush();
      } catch (error) {
        console.log(error);
      }
    }
  }
}

/****************************************************************************************************************************************
*
* Search TMDb for media.
*
* @param query {String} The TMDb movie/show search query passed into the function.
* @return {Object} The movie/show data object returned from TMDb.
* 
* References
* https://developers.themoviedb.org/3/search/multi-search
*
****************************************************************************************************************************************/

function searchTMDb(query) {

  // Declare variables
  var TMDbApiKey = "ENTER_API_KEY_HERE";
  var apiUrl = "https://api.themoviedb.org/3/";
  var search = "&query=" + encodeURIComponent(query);

  //  Set authentication object parameters
  var headers = {
    "Content-Type": "application/json"
  };

  //  Set option parameters
  var options = {
    "method": "GET",
    "headers": headers,
    "muteHttpExceptions": true,
  };

  //  Grab show data from API
  var queryID = apiUrl + "search/multi?api_key=" + TMDbApiKey + search;
  var queryResponse = UrlFetchApp.fetch(queryID, options);
  var queryResponseText = queryResponse.getContentText();
  var queryResponseTextJSON = JSON.parse(queryResponseText);

  // Return first searched object with show data
  return queryResponseTextJSON.results[0];
}
