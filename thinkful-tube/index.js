/* global $ */

var App = (function () {
    
    const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
    
    const currentState = {
        queryString: '',
        queryResult: {}
    };
    
    const _setString = function( qString ) {
        currentState.queryResult = qString;
    }
    
    const _setResult = function( qResult ) {
        currentState.queryResult = qResult;
    }
    
    const _getEntry = function( qDataID ) {
        const result = currentState.queryResult.items.find((e, i, a) => {
            return e.id.videoId === qDataID;
        });
        
        console.log(result);
        
        return result;
    }
    
    const _getDataFromApi = function( searchTerm, callback, pageToken = null ) {
        
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
    
    
    const _returnArticle = function( item ) {
        
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
    
    const _renderResult = function( result ) {
        console.log(result);
        
        _setResult(result);
        
        $('#js-main').html(
            result.items.reduce(
                (s, v) => s + _returnArticle(v),
                '')
            );
            
        handleClick();
    }
    
    const handleClick = function() {
        
        
        $('.js-figure').click(function( event ) {
            
            _getEntry($(this).attr('data-item'));
        });
        
    }
    
    const handleInput = function() {
        
        
        $('#js-search-form').submit(function( event ) {
            event.preventDefault();
            
            const field = $('#top-search');
            
            _setString(field.val());
            
            _getDataFromApi(field.val(), _renderResult);
        });
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