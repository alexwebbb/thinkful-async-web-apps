/* global $ */

var App = (function () {
    
    const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
    
    const currentState = {
        queryString: '',
        queryResult: {}
    };
    
    const updateString = function( qString ) {
        currentState.queryResult = qString;
    }
    
    const updateResult = function( qResult ) {
        currentState.queryResult = qResult;
    }
    
    const getDataFromApi = function( searchTerm, callback, pageToken = null ) {
        
        const query = {
            part: 'snippet',
            q: `${searchTerm}`,
            maxResults: 6,
            type: 'video',
            nextPageToken: pageToken,
            key: 'AIzaSyCEO_Lc9GBl5vjSoGYq-BpXE3VS3x-XhIc'
        };
        $.getJSON(YOUTUBE_SEARCH_URL, query, callback);
    }
    
    
    const handleInput = function() {
        
        
        $('#js-search-form').submit(function( event ) {
            event.preventDefault();
            
            const field = $('#top-search');
            
            updateString(field.val());
            
            getDataFromApi(field.val(), renderResult);
        });
    }
    
    const handleClick = function() {
        
        
        $('.js-figure').click(function( event ) {
            
            console.log($(this).attr('data-item'));
        });
        
    }
    
    
    const renderResult = function( result ) {
        console.log(result);
        
        updateResult(result);
        
        $('#js-main').html(
            result.items.reduce(
                (s, v) => s + returnArticle(v),
                '')
            );
            
        handleClick();
    }
    
    const returnArticle = function( item ) {
        
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
  
  return {
      handleInput: handleInput
  };

})();




function main () {
    
    App.handleInput();
    
    return 0;
}

$(main);