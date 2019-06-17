var express = require("express");
// var logger = require("morgan");
var mongoose = require("mongoose");
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";


// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
// app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
// mongoose.connect("mongodb://localhost/unit18Populater", { useNewUrlParser: true });
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// Routes

// A GET route for scraping the echoJS website
app.post("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.wowhead.com/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    let num = 1

    // Now, we grab every h2 within an article tag, and do the following:
    $(".news-post").each(function(i, element) {
      // Save an empty result object
      // if(num < 3){
      //   let title = $(element).find('h1 a').text()
      //   console.log(title)
      //   let description = $(element).find('.news-post-content noscript').text()
      //   if(description.indexOf('<') > 0 || description.indexOf('\\r') > 0){
      //     description = description.replace(/<(.+?)>|\\r/g, '')
      //   }
      //   console.log(description)
      //   num++
      // }
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .find('h1 a')
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");
      result.summary = $(this)
        .find('.news-post-content noscript')
        .text()
      if(result.summary.search(/<(.+?)>|\\r|\\\\u2019|\\/g) > 0){
        result.summary = result.summary.replace(/<(.+?)>|\\r|u2019|\\/g, '')
      }
      // Create a new Article using the `result` object built from scraping
      db.Article.findOneAndUpdate({title: result.title}, result, {upsert: true, new: true, useFindAndModify: false})
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article.find({}, function(err, data){
    if(err){console.log(err)}
    else {
      console.log(data)
      res.send(data)
    }
  })
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // TODO
  // ====
  // Finish the route so it finds one article using the req.params.id,
  // and run the populate method with "note",
  // then responds with the article with the note included
  db.Article.find({_id: req.params.id})
    .populate("comment")
    .then(function(dbArticle){
      res.json(dbArticle)
    })
    .catch(function(err){
      res.json(err)
    })
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // TODO
  // ====
  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
  db.Comment.create(req.body)
    .then(function(dbNote){
      return db.Article.findOneAndUpdate({}, { $push: { comment: dbcomment._id} }, { new: true })
    })
    .then(function(dbArticle) {
      res.json(dbArticle)
    })
    .catch(function(err){
      res.json(err)
    })
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
