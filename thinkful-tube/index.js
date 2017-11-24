/* global $ */
'use strict';

var App = (function() {


    const createYoutubeScript = function() {

        // 2. This code loads the IFrame Player API code asynchronously.
        let tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        let firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    }

















    const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

    const currentState = {
        queryString: '',
        queryResult: {},
        pages: [''],
        pageIndex: 0
    };

    const defaultDescription = {
        id: {
            videoId: ''
        },
        snippet: {
            title: "Cool Youtube Browser",
            description: "Make a search and click one of the results!"
        }
    }


    const _setString = function(qString) {
        currentState.queryString = qString;
    }

    const _setResult = function(qResult) {

        const s = currentState;

        s.queryResult = qResult;



        if (!s.pages.includes(s.queryResult.nextPageToken)) {
            s.pages.push(s.queryResult.nextPageToken);
        }
    }

    const _getQueryString = function() {
        return currentState.queryString;
    }

    const _getEntry = function(qDataID) {
        const result = currentState.queryResult.items.find((e, i, a) => {
            return e.id.videoId === qDataID;
        });

        return result;
    }

    const _getPrevPageToken = function() {

        if (currentState.pageIndex > 0) {
            return currentState.pages[currentState.pageIndex - 1];
        } else {
            return currentState.pages[0];
        }
    }

    const _getNextPageToken = function() {

        if (currentState.pageIndex < currentState.pages.length - 1) {
            return currentState.pages[currentState.pageIndex + 1];
        } else {
            return currentState.pages[currentState.pages.length - 1]
        }
    }

    const _getDataFromApi = function(searchTerm, callback, nextPageToken = null) {

        const s = currentState;


        if (nextPageToken === null) {
            s.pageIndex = 0;
        } else if (s.pages.includes(nextPageToken)) {
            s.pageIndex = s.pages.indexOf(nextPageToken);
        } else {
            s.pages.push(nextPageToken);
            s.pageIndex++;
        }

        const query = {
            part: 'snippet',
            q: `${searchTerm}`,
            maxResults: 6,
            type: 'video',
            pageToken: nextPageToken,
            key: 'AIzaSyCEO_Lc9GBl5vjSoGYq-BpXE3VS3x-XhIc'
        };
        $.getJSON(YOUTUBE_SEARCH_URL, query, callback);
    }


    const _returnArticle = function(item) {

        const s = item.snippet;

        return `
            <article>
                <figure class="js-figure" data-item="${item.id.videoId}">
                    <img 
                        src="${s.thumbnails.medium.url}" 
                        alt="${s.description}"
                        >
                    <figcaption>
                        <h1>
                            ${s.title}
                        </h1>
                    </figcaption>
                </figure>
            </article>
        `;
    }

    const _returnAside = function(item) {

        const s = item.snippet;

        return `
            <section class="aside-container">
                <section class="aside-text">
                    <h1>
                        ${s.title}
                    </h1>
                    <p>
                        ${s.description}
                    </p>
                </section>
                <section class="aside-buttons">
                    <button 
                        class="js-pagination button" 
                        data-pagination="${_getPrevPageToken()}"
                        >
                        Prev Page
                    </button>
                    <button
                        class="js-play-button button"
                        data-playID="${item.id.videoId}"
                        >
                        Play
                    </button>
                    <button 
                        class="js-pagination button" 
                        data-pagination="${_getNextPageToken()}"
                        >
                        Next Page
                    </button>
                </section>  
            </section>
        `;
    }

    const _renderResult = function(result) {
        console.log(result);

        _setResult(result);
        _renderDescription(defaultDescription);
        _renderPageNum();

        $('#js-main').html(
            result.items.reduce(
                (s, v) => s + _returnArticle(v),
                '')
        );

        _handleFigureClick();
    }

    const _renderDescription = function(item) {

        $('#js-aside').html(_returnAside(item));

        _handlePaginationClick();
        _handlePlayClick();
    }

    const _renderPageNum = function() {
        $('#pagination-value').text(currentState.pageIndex + 1);
    }


    // YOUTUBE FUNCTIONS
    const _YT_onPlayerReady = function(event) {
        event.target.playVideo();
    }


    const _YT_stopVideo = function() {
        player.stopVideo();
    }

    const _YT_onPlayerStateChange = function(event) {

        let done = false;

        if (event.data == YT.PlayerState.PLAYING && !done) {
            setTimeout(_YT_stopVideo, 6000);
            done = true;
        }
    }

    const _renderVideoPlayer = function(ID) {
        // initialize player
        let player = new YT.Player('player', {
            height: '390',
            width: '640',
            videoId: ID,
            events: {
                'onReady': _YT_onPlayerReady,
                'onStateChange': _YT_onPlayerStateChange
            }
        });
    }


    const _handleFigureClick = function() {


        $('.js-figure').click(function(event) {

            $('.js-figure').removeClass('highlight');

            $(this).addClass('highlight');

            _renderDescription(_getEntry($(this).attr('data-item')));
        });

    }

    const _handlePaginationClick = function() {


        $('.js-pagination').click(function(event) {

            _getDataFromApi(
                _getQueryString(),
                _renderResult,
                $(this).attr('data-pagination')
            );


        });

    }

    const _handlePlayClick = function() {

        $('.js-play-button').click(function(event) {

            console.log("play button pressed");
            _renderVideoPlayer($(this).attr('data-playID'));
        });
    }

    const handleInput = function() {


        $('#js-search-form').submit(function(event) {
            event.preventDefault();

            const field = $('#top-search');

            _setString(field.val());

            _getDataFromApi(field.val(), _renderResult);
        });
    }

    return {
        handleInput: handleInput,
        createYoutubeScript: createYoutubeScript
    };

})();


function onYouTubeIframeAPIReady() {

}




function main() {

    App.createYoutubeScript();
    App.handleInput();

    return 0;
}

$(main);