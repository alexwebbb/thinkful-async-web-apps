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
    
    $('#js-main').html(
        result.items.reduce(
            (s, v) => s + returnArticle(v),
            '')
        );
}

function returnArticle( item ) {
    
    const s = item.snippet;
    
    return `
        
        <article>
			<figure>
				<img 
					src="${s.thumbnails.medium.url}" 
					alt="${s.description}"
					>
				<figcaption>
					<h1>
					    ${s.title}
					</h1>
					<p>
					    ${s.description}
					</p>
				</figcaption>
				<iframe 
					src="" 
					frameborder="0"
					>
					Insertion point for youtube video
				</iframe>
			</figure>
		</article>
        
    `;
}


function main () {
    
    handleInput();
    
    
    
    return 0;
}

$(main);