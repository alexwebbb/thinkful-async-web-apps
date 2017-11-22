/* global $ */

var App = (function () {
    
    const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
    
    const currentState = {
        queryString: '',
        queryResult: {},
        pages: [''],
        pageIndex: 0
    };
    
    const defaultDescription = {
        snippet: {
            title: "Cool Youtube Browser",
            description: "Make a search and click one of the results!"
        }
    }
    
    
    const _setString = function( qString ) {
        currentState.queryString = qString;
    }
    
    const _setResult = function( qResult ) {
        
        const s = currentState;
        
        s.queryResult = qResult;
        
        if(!s.pages.includes(s.queryResult.nextPageToken)){
            s.pages.push(s.queryResult.nextPageToken);
        } 
    }
    
    const _getQueryString = function() {
        return currentState.queryString;
    }
    
    const _getEntry = function( qDataID ) {
        const result = currentState.queryResult.items.find((e, i, a) => {
            return e.id.videoId === qDataID;
        });
        
        return result;
    }
    
    const _getPrevPageToken = function() {
        
        return currentState.pages[currentState.pageIndex - 1];
        
    }
    
    const _getNextPageToken = function() {
        
        console.log(currentState.pages);
        
        
        return currentState.pages[currentState.pageIndex + 1];
        
    }
    
    const _getDataFromApi = function( searchTerm, callback, nextPageToken = null ) {
        
        
        console.log(nextPageToken);
        
        const s = currentState;
        
        if(nextPageToken === null) {
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
    
    const _returnAside = function( item ) {
        
        console.log(item);
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
    				    class="js-pagination" 
    				    data-pagination="${_getPrevPageToken()}"
    				    >
    					Prev Page
    				</button>
    				<button>
    					Play
    				</button>
    				<button 
    				    class="js-pagination" 
    				    data-pagination="${_getNextPageToken()}"
    				    >
    					Next Page
    				</button>
    			</section>	
    		</section>
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
            
        _handleFigureClick();
    }
    
    const _renderDescription = function( item ) {
        
        $('#js-aside').html(_returnAside(item));
        
        _handlePaginationClick();
    }
    
    const _handleFigureClick = function() {
        
        
        $('.js-figure').click(function( event ) {
            
            $('.js-figure').removeClass('highlight');
            
            $(this).addClass('highlight');
            
            _renderDescription(_getEntry($(this).attr('data-item')));
        });
        
    }
    
    const _handlePaginationClick = function() {
        
        
        $('.js-pagination').click(function( event ) {
            
            // console.log(currentState);
            _getDataFromApi(
                _getQueryString(), 
                _renderResult, 
                $(this).attr('data-pagination')
            );
            
            // need to supply a dummy description for initial state
            _renderDescription(defaultDescription);
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