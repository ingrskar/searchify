/**
 * Created by ingrskar on 9/15/2016.
 */
var express = require('express');
var router = express.Router();
var path = require('path');

/// Spotify Web API
var SpotifyWebApi = require('spotify-web-api-node');

// credentials for Spotify Web API
var spotifyApi = new SpotifyWebApi({
    clientId: '',
    clientSecret: '',
    redri: '/'
});

/// Twitter API
var TwitterAPI = require('node-twitter');

/// credentials for Twitter API
var twitter = new TwitterAPI.SearchClient(
    '',
    '',
    '',
    ''
);



router.get('/', function (req, res, next) {
    res.render('index.ejs', {
        title: 'Searchify',
        output: 'TAP TO RECORD'
    });
    res.end();
});


router.get('/submitSpeech', function (req, res, next) {
    /// initialize
    var trackRec = '';
    var trackName = '';
    var trackUri = '';
    var artist = '';
    var artistID = '';
    var album = '';
    var resultRelate = [];
    var resultTweet = [];
    var spotifyFlag = false;
    var twitterFlag = false;
    var relatedFlag = false;


    /// search top hit track including 'songname' on spotify
    var searchTrack = function (songname) {
        spotifyApi.searchTracks('track:' + songname, {limit: 1})
            .then(function (data) {

                var firstPage = data.body.tracks.items;

                /// parse through json response from API
                firstPage.forEach(function (track, index) {

                    trackName = track.name; /// track name on spotify
                    trackUri = track.uri; /// track id
                    album = track.album.name; /// album name
                    artist = track.artists[index].name; /// artist name
                    artistID = track.artists[index].id; /// aritst id

                    spotifyFlag = true; /// set flag

                });
                relatedSearch(artistID); /// call relatedSearch function using artistID as parameter

            }, function (err) {
                console.log('Search track failed', err.message);
                /// if error occurs, render home page and notify the user
                res.render('index', {
                    title: 'Searchify',
                    output: 'NO TRACK FOUND'
                });
            });
    };


    /// search for related artists
    var relatedSearch = function (artistID) {
        spotifyApi.getArtistRelatedArtists(artistID)
            .then(function (data) {
                var firstpage = data.body.artists;

                /// parse through json response from API
                for (i = 0; i < firstpage.length; i++) {
                    var relatedUrl = firstpage[i].external_urls.spotify; /// url to spotify profile
                    var relatedArtist = firstpage[i].name; /// name
                    resultRelate.push({artist: relatedArtist, url: relatedUrl}); /// add to result list
                }
                relatedFlag = true; /// set flag

                twitterSearch(artist); /// call twitterSearch function using aritist as parameter

            }, function (err) {
                console.log('related search failed ' + err.message);
                /// if error occurs, render home page and notify the user
                if (err.message == 'Bad Request') {
                    res.render('index', {
                        title: 'Searchify',
                        output: 'TRACK NOT FOUND'
                    });
                }
            });

    };


    /// twitter search using artist returend from Spotify API
    var twitterSearch = function (artist) {
        twitter.search({'q': artist, count: 5}, function (error, result) {
            /// if error occurs, render home page and notify the user
            if (error) {
                console.log('twittersearch failed ' + error);
                res.render('index', {
                    title: 'Searchify',
                    output: 'TRACK NOT FOUND'
                });
            }
            if (result) {
                var tweets = result.statuses;

                /// parse response from API
                for (var i = 0; i < tweets.length; i++) {
                    var username = tweets[i].user.name; /// username to respective tweet
                    var userID = tweets[i].user.screen_name; /// userID
                    var text = tweets[i].text; /// tweet text
                    var tweetID = tweets[i].id_str; /// tweet ID
                    resultTweet.push({user: username, user_id: userID, tweet: text, tweet_id: tweetID}); /// add result to list
                    twitterFlag = true; /// set flag
                }

            }
        });

    };


    var main = function () {
        trackRec = req.query.result_span; /// retrieve value of input from client side
        /// check whether input is valid
        if ((trackRec == 'TAP TO RECORD') || (trackRec == '') || (trackRec == 'NOT VALID SEARCH') || (trackRec == 'TRACK NOT FOUND')) {
            res.render('index', {
                title: 'Searchify',
                output: 'NOT VALID SEARCH'
            });
            res.end();
        } else {
            searchTrack(trackRec); /// call search function
            setInterval(function () {
                /// checks if all flags is true
                if ((spotifyFlag == true) && (twitterFlag == true) && (relatedFlag == true)) {
                    res.render('searched',
                        {
                            title: 'Searchify - ' + trackName,
                            trackPlay: trackUri,
                            trackArtist: artist,
                            tweets: resultTweet,
                            track: trackName,
                            album: album,
                            relatedArtist: resultRelate
                        });
                    res.end();
                    clearInterval(this);
                }
            }, 400)
        }
    };

    main();
});


module.exports = router;
