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
    clientId: 'c07ef8ba3cee4340987342b66bd4ef3a',
    clientSecret: '3252c1d3d7c2452f9b93c24f7f0e4a26',
    redri: '/'
});

/// Twitter API
var TwitterAPI = require('node-twitter');

/// credentials for Twitter API
var twitter = new TwitterAPI.SearchClient(
    '24MuESZ6OILlpeXhOpXfrIgGP',
    'QsUkTBCTHIpFNUoHVGXTLfgrXrFvyFPeHoHC8Btq14V1ScArp4',
    '772612067484282880-p8ej2I2XoRuUtBnYO4mE1xJAHMI6goH',
    'G6pqyluZgPVoMH5Ybdcg041p0XDtQgl88TOs1xh9HRg8n'
);


router.use('/public', express.static(__dirname + '/public'));

router.get('/', function (req, res, next) {
    res.render('index.ejs', {
        title: 'Searchify',
        output: 'TAP TO RECORD'});
    res.end();
});



router.get('/submitSpeech', function (req, res, next) {
    /// initialize
    var init = function () {
        trackRec = '';
        trackName = '';
        trackUri = '';
        artist = '';
        artistID = '';
        album = '';
        resultRelate = [];
        resultTweet = [];
        spotifyFlag = false;
        twitterFlag = false;
        relatedFlag = false;
    };

    init();

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
                    artist = track.artists[index].name;
                    artistID = track.artists[index].id;

                    spotifyFlag = true; /// set flag
                });
                twitterSearch(artist); /// call twitterSearch function using aritist as parameter
                relatedSearch(artistID); /// call relatedSearch function using artistID as parameter
            }, function (err) {
                console.log('Something went wrong!', err);
                res.render('index.ejs', {
                    title: 'Searchify',
                    output: 'NO TRACK FOUND'});
            });
    };


    /// search for related artists
    var relatedSearch = function(artistID) {
        spotifyApi.getArtistRelatedArtists(artistID)
            .then(function(data) {
                var firstpage = data.body.artists;

                /// parse through json response from API
                for(i=0; i < firstpage.length; i++) {
                    var relatedUrl = firstpage[i].external_urls.spotify; /// url to spotify profile
                    var relatedArtist = firstpage[i].name; /// name
                    resultRelate.push({artist:relatedArtist,url:relatedUrl}); /// add to result list
                }
                relatedFlag = true; /// set flag
                console.log(resultRelate);
            }, function(err) {
                res.render('index.ejs', {
                    title: 'Searchify',
                    output: 'NO TRACK FOUND'});
            });
    };


    /// twitter search using artist returend from Spotify API
    var twitterSearch = function (artist) {
        twitter.search({'q': artist, count: 5})
            .then(function(data) {
                var firstpage = data.body.artists;

                /// parse through json response from API
                for(i=0; i < firstpage.length; i++) {
                    var relatedUrl = firstpage[i].external_urls.spotify; /// url to spotify profile
                    var relatedArtist = firstpage[i].name; /// name
                    resultRelate.push({artist:relatedArtist,url:relatedUrl}); /// add to result list
                }
                relatedFlag = true; /// set flag
                console.log(resultRelate);
            }, function(err) {
                res.render('index.ejs', {
                    title: 'Searchify',
                    output: 'NO TRACK FOUND'});
            });



        , function (error, result) {
            if (error) {
                res.render('index.ejs', {
                    title: 'Searchify',
                    output: 'NO'});
            }
            if (result) {
                var tweets = result.statuses;

                /// parse response from API
                for (var i = 0; i < tweets.length; i++) {
                    var username = tweets[i].user.name; /// username to respective tweet
                    var userID = tweets[i].user.screen_name; /// userID
                    var text = tweets[i].text; /// tweet text
                    var tweetID = tweets[i].id_str; /// tweet ID
                    resultTweet.push({user:username,user_id: userID, tweet: text, tweet_id: tweetID}); /// add result to list
                    twitterFlag = true; /// set flag
                }

            }
        });

};


var main = function () {
    var trackRec = req.query.result_span; /// retrieve value of input from client side
    /// check whether input is valid
    if ((trackRec == 'TAP TO RECORD') || (trackRec == '')  || (trackRec == 'NOT VALID SEARCH')) {
        res.render('index.ejs', {
            title: 'Searchify',
            output: 'NOT VALID SEARCH'
        });
        res.end();
    } else {
        searchTrack(trackRec); /// call search function
        setInterval(function() {
            /// checks if all flags is true
            if((spotifyFlag == true) && (twitterFlag == true) && (relatedFlag == true)) {
                res.render('searched.ejs',
                    {
                        title: 'Searchify - ' + trackName,
                        trackPlay: trackUri,
                        trackArtist: artist,
                        tweets: resultTweet,
                        track: trackName,
                        album: album,
                        relatedArtist: resultRelate
                    });
                init();
                res.end();
                clearInterval(this);
            }
        }, 400)
    }
};

main();
}, function errorHandler(err, req, res, next) {
    res.status(500);
    res.render('error', { error: err });
});


module.exports = router;