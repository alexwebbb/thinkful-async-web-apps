/* global $ */

const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

function getDataFromApi( searchTerm, callback ) {
    
    console.log('hello');
    
    const query = {
        part: 'snippet',
        q: `${searchTerm}`,
        key: 'AIzaSyCEO_Lc9GBl5vjSoGYq-BpXE3VS3x-XhIc'
    }
    $.getJSON(YOUTUBE_SEARCH_URL, query, callback);
}


function handleInput() {
    
    
    $('#js-search-form').submit(function( event ) {
        event.preventDefault();
        
        const field = $('#top-search');
        
        getDataFromApi(field.val(), renderResult);
    });
    
}


function renderResult( result ) {
    console.log(result);
}


function main () {
    
    handleInput();
    
    
    
    return 0;
}

$(main);