/* global $ */

const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

const currentState = {
    queryString: '',
    queryResult: {}
};

function updateString( qString ) {
    currentState.queryResult = qString;
}

function updateResult( qResult ) {
    currentState.queryResult = qResult;
}

function getDataFromApi( searchTerm, callback, pageToken = null ) {
    
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


function handleInput() {
    
    
    $('#js-search-form').submit(function( event ) {
        event.preventDefault();
        
        const field = $('#top-search');
        
        updateString(field.val());
        
        getDataFromApi(field.val(), renderResult);
    });
}

function handleClick() {
    
    
    $('.js-figure').click(function( event ) {
        
        console.log($(this).attr('data-item'));
    });
    
}


function renderResult( result ) {
    console.log(result);
    
    updateResult(result);
    
    $('#js-main').html(
        result.items.reduce(
            (s, v) => s + returnArticle(v),
            '')
        );
        
    handleClick();
}

function returnArticle( item ) {
    
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


function main () {
    
    handleInput();
    handleClick();
    
    
    
    return 0;
}

$(main);