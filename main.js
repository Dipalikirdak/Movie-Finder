// ==============================
// OMDb API Configuration
// ==============================
const API_KEY = '5b9b7798';
const API_URL = `https://www.omdbapi.com/?apikey=${API_KEY}`;


// ==============================
// DOM Elements
// ==============================
const resultsContainer = document.getElementById('resultsContainer');
const themeToggle = document.getElementById('themeToggle');
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const trendingTags = document.querySelectorAll('.trending-tag');
const noResults = document.getElementById('noResults');
const resultsTitle = document.getElementById('resultsTitle');
const pagination = document.getElementById('pagination');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const mainContainer = document.getElementById('mainContainer');
const movieDetailContainer = document.getElementById('movieDetailContainer');
const backButton = document.getElementById('backButton');
const detailPoster = document.getElementById('detailPoster');
const detailTitle = document.getElementById('detailTitle');
const detailYear = document.getElementById('detailYear');
const detailRating = document.getElementById('detailRating');
const detailRuntime = document.getElementById('detailRuntime');
const detailPlot = document.getElementById('detailPlot');
const detailDirector = document.getElementById('detailDirector');
const detailActors = document.getElementById('detailActors');
const detailGenre = document.getElementById('detailGenre');
const detailLanguage = document.getElementById('detailLanguage');
const detailAwards = document.getElementById('detailAwards');


// ==============================
// App State
// ==============================
let currentPage = 1;
let totalPages = 1;
let currentSearch = '';


// ==============================
// Poster Themes
// ==============================
const posterThemes = [
    { bg: 'bg-gradient-to-br from-indigo-500 to-purple-700', text: 'text-white' },
    { bg: 'bg-gradient-to-br from-red-500 to-orange-500', text: 'text-white' },
    { bg: 'bg-gradient-to-br from-blue-400 to-teal-500', text: 'text-white' },
    { bg: 'bg-gradient-to-br from-yellow-400 to-orange-500', text: 'text-gray-900' },
    { bg: 'bg-gradient-to-br from-green-500 to-emerald-700', text: 'text-white' },
    { bg: 'bg-gradient-to-br from-pink-500 to-rose-500', text: 'text-white' },
    { bg: 'bg-gradient-to-br from-cyan-400 to-blue-600', text: 'text-white' },
    { bg: 'bg-gradient-to-br from-amber-500 to-yellow-500', text: 'text-gray-900' }
];


// ==============================
// Initialization
// ==============================
function init() {
    fetchPopularMovies();
    setupEventListeners();
    checkDarkModePreference();
}


// ==============================
// Fetch Functions
// ==============================

// Fetch popular movies on initial load
function fetchPopularMovies() {
    showLoadingSkeleton();
    const popularTerms = ['avengers', 'inception', 'star wars', 'batman', 'harry potter', 'jurassic park'];
    const randomTerm = popularTerms[Math.floor(Math.random() * popularTerms.length)];
    fetchMovies(randomTerm, 1);
}

// Fetch movies from OMDb API
async function fetchMovies(searchTerm, page = 1) {
    try {
        showLoadingSkeleton();
        currentSearch = searchTerm;
        currentPage = page;

        const response = await fetch(`${API_URL}&s=${encodeURIComponent(searchTerm)}&page=${page}`);
        const data = await response.json();

        if (data.Response === 'True') {
            const totalResults = parseInt(data.totalResults);
            totalPages = Math.ceil(totalResults / 10);

            const movieDetails = await Promise.all(
                data.Search.map(movie => fetchMovieDetails(movie.imdbID))
            );
            renderMovies(movieDetails);

            updatePagination();
            resultsTitle.textContent = `Search Results for "${searchTerm}"`;
            noResults.classList.add('hidden');
        } else {
            resultsContainer.innerHTML = '';
            noResults.classList.remove('hidden');
            resultsTitle.textContent = `Search Results for "${searchTerm}"`;
            pagination.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error fetching movies:', error);
        showError('Failed to fetch movies. Please try again later.');
    }
}

// Fetch detailed movie information
async function fetchMovieDetails(imdbID) {
    try {
        const response = await fetch(`${API_URL}&i=${imdbID}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching movie details:', error);
        return null;
    }
}


// ==============================
// Rendering Functions
// ==============================

// Render movies to the grid
function renderMovies(moviesArray) {
    resultsContainer.innerHTML = '';

    moviesArray.forEach((movie, index) => {
        if (!movie || movie.Response === 'False') return;

        const theme = posterThemes[index % posterThemes.length];
        const rating = parseFloat(movie.imdbRating) || 0;
        const ratingColor =
            rating >= 8.5 ? 'bg-green-500' :
            rating >= 7.5 ? 'bg-yellow-500' :
            rating >= 6.0 ? 'bg-orange-500' : 'bg-red-500';

        const card = document.createElement('div');
        card.className = 'movie-card bg-white dark:bg-dark-800 rounded-2xl overflow-hidden shadow-xl cursor-pointer relative';
        card.dataset.id = movie.imdbID;
        card.innerHTML = `
            <div class="h-64 relative overflow-hidden">
                ${movie.Poster && movie.Poster !== 'N/A' ? 
                    `<img src="${movie.Poster}" alt="${movie.Title}" class="movie-poster h-full w-full object-cover">` : 
                    `<div class="movie-poster ${theme.bg} h-full w-full flex items-center justify-center">
                        <span class="${theme.text} text-5xl font-bold">${movie.Title.split(' ').map(word => word[0]).join('')}</span>
                    </div>`
                }
                <div class="rating-badge ${ratingColor} text-white px-3 py-1 rounded-full font-bold text-sm">
                    ${rating > 0 ? rating.toFixed(1) : 'N/A'}
                </div>
            </div>
            <div class="p-5">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white truncate" title="${movie.Title}">${movie.Title}</h3>
                <div class="flex justify-between items-center mt-3">
                    <span class="text-gray-600 dark:text-gray-400">${movie.Year}</span>
                    <div class="flex items-center">${generateStarRating(rating)}</div>
                </div>
                <p class="mt-4 text-gray-600 dark:text-gray-300 text-sm line-clamp-2">${movie.Plot || 'No description available'}</p> 
            </div>
        `;

        card.addEventListener('click', () => showMovieDetail(movie.imdbID));
        resultsContainer.appendChild(card);
    });

    pagination.classList.remove('hidden');
}

// Show movie detail view
async function showMovieDetail(imdbID) {
    mainContainer.classList.add('hidden');

    movieDetailContainer.innerHTML = `
        <div class="container mx-auto px-4 py-8 max-w-6xl">
            <button id="backButton" class="back-button mb-8 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full flex items-center">
                <i class="fas fa-arrow-left mr-2"></i> Back to Movies
            </button>
            <div class="flex justify-center items-center h-96">
                <div class="text-center">
                    <div class="skeleton-loader bg-gray-700 w-64 h-96 rounded-xl mx-auto mb-6"></div>
                    <div class="skeleton-loader bg-gray-700 w-48 h-6 rounded mx-auto mb-2"></div>
                    <div class="skeleton-loader bg-gray-700 w-32 h-4 rounded mx-auto mb-4"></div>
                    <div class="skeleton-loader bg-gray-700 w-64 h-4 rounded mx-auto mb-1"></div>
                    <div class="skeleton-loader bg-gray-700 w-64 h-4 rounded mx-auto mb-1"></div>
                    <div class="skeleton-loader bg-gray-700 w-48 h-4 rounded mx-auto"></div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('backButton').addEventListener('click', hideMovieDetail);

    movieDetailContainer.classList.remove('hidden');
    movieDetailContainer.classList.add('active');

    try {
        const movie = await fetchMovieDetails(imdbID);
        if (movie && movie.Response === 'True') {
            const rating = parseFloat(movie.imdbRating) || 0;
            movieDetailContainer.innerHTML = `
                <div class="container mx-auto px-4 py-8 max-w-6xl">
                    <button id="backButton" class="back-button mb-8 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full flex items-center">
                        <i class="fas fa-arrow-left mr-2"></i> Back to Movies
                    </button>
                    <div class="detail-grid">
                        <div>
                            <img id="detailPoster" src="${movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : ''}" alt="${movie.Title}" class="relativedetail-postr w-full rounded-xl">
                        </div>
                        <div class="detail-info">
                            <h2 id="detailTitle" class="text-3xl md:text-4xl font-bold text-white mb-2">${movie.Title}</h2>
                            <div class="flex flex-wrap items-center gap-4 mb-6">
                                <div class="flex items-center bg-indigo-800 px-3 py-1 rounded-full">
                                    <span id="detailYear" class="text-white text-sm font-medium">${movie.Year}</span>
                                </div>
                                <div class="flex items-center bg-amber-600 px-3 py-1 rounded-full">
                                    <i class="fas fa-star text-yellow-300 mr-1"></i>
                                    <span id="detailRating" class="text-white text-sm font-medium">${rating > 0 ? `${rating}/10` : 'N/A'}</span>
                                </div>
                                <div class="flex items-center bg-green-700 px-3 py-1 rounded-full">
                                    <span id="detailRuntime" class="text-white text-sm font-medium">${movie.Runtime || 'N/A'}</span>
                                </div>
                            </div>
                            <div class="detail-section">
                                <h3 class="text-xl font-bold text-indigo-300 mb-3">Plot</h3>
                                <p id="detailPlot" class="text-gray-300 leading-relaxed">${movie.Plot || 'No description available'}</p>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div class="detail-section">
                                    <h3 class="text-xl font-bold text-indigo-300 mb-3">Director</h3>
                                    <p id="detailDirector" class="text-gray-300">${movie.Director || 'N/A'}</p>
                                </div>
                                <div class="detail-section">
                                    <h3 class="text-xl font-bold text-indigo-300 mb-3">Cast</h3>
                                    <p id="detailActors" class="text-gray-300">${movie.Actors || 'N/A'}</p>
                                </div>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div class="detail-section">
                                    <h3 class="text-xl font-bold text-indigo-300 mb-3">Genre</h3>
                                    <p id="detailGenre" class="text-gray-300">${movie.Genre || 'N/A'}</p>
                                </div>
                                <div class="detail-section">
                                    <h3 class="text-xl font-bold text-indigo-300 mb-3">Language</h3>
                                    <p id="detailLanguage" class="text-gray-300">${movie.Language || 'N/A'}</p>
                                </div>
                                <div class="detail-section">
                                    <h3 class="text-xl font-bold text-indigo-300 mb-3">Awards</h3>
                                    <p id="detailAwards" class="text-gray-300">${movie.Awards || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('backButton').addEventListener('click', hideMovieDetail);
        } else {
            showError('Failed to load movie details.');
        }
    } catch (error) {
        console.error('Error loading movie details:', error);
        showError('Failed to load movie details.');
    }
}


// ==============================
// Helper Functions
// ==============================
function hideMovieDetail() {
    movieDetailContainer.classList.add('hidden');
    movieDetailContainer.classList.remove('active');
    mainContainer.classList.remove('hidden');
}

function showLoadingSkeleton() {
    resultsContainer.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'movie-card bg-white dark:bg-dark-800 rounded-2xl overflow-hidden shadow-xl';
        skeleton.innerHTML = `
            <div class="h-64 skeleton-loader bg-gray-200 dark:bg-dark-700"></div>
            <div class="p-5">
                <div class="h-6 w-3/4 skeleton-loader bg-gray-200 dark:bg-dark-700 rounded mb-3"></div>
                <div class="flex justify-between mt-4">
                    <div class="h-4 w-1/4 skeleton-loader bg-gray-200 dark:bg-dark-700 rounded"></div>
                    <div class="h-4 w-1/4 skeleton-loader bg-gray-200 dark:bg-dark-700 rounded"></div>
                </div>
            </div>
        `;
        resultsContainer.appendChild(skeleton);
    }
}

function generateStarRating(rating) {
    if (!rating || rating === 0) return '<span class="text-gray-500">No rating</span>';

    const fullStars = Math.floor(rating / 2);
    const halfStar = rating % 2 >= 1 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fas fa-star text-yellow-400"></i>';
    if (halfStar) starsHTML += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
    for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="far fa-star text-yellow-400"></i>';

    return starsHTML;
}

function showError(message) {
    resultsContainer.innerHTML = `
        <div class="col-span-4 text-center py-16">
            <i class="fas fa-exclamation-triangle text-red-500 text-6xl mb-4"></i>
            <h3 class="text-2xl font-bold text-gray-700 dark:text-gray-300">Error</h3>
            <p class="text-gray-600 dark:text-gray-400 mt-2">${message}</p>
        </div>
    `;
}

function updatePagination() {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}


// ==============================
// Event Listeners
// ==============================
function setupEventListeners() {
    // Dark mode toggle
    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const icon = themeToggle.querySelector('i');
        if (document.documentElement.classList.contains('dark')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('darkMode', 'disabled');
        }
    });

    // Search functionality
    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) fetchMovies(searchTerm, 1);
    });
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) fetchMovies(searchTerm, 1);
        }
    });

    // Trending tags
    trendingTags.forEach(tag => {
        tag.addEventListener('click', () => {
            searchInput.value = tag.textContent;
            fetchMovies(tag.textContent, 1);
        });
    });

    // Pagination
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) fetchMovies(currentSearch, currentPage - 1);
    });
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) fetchMovies(currentSearch, currentPage + 1);
    });

    // Back button for detail view
    backButton.addEventListener('click', hideMovieDetail);
}


// ==============================
// Dark Mode Preference
// ==============================
function checkDarkModePreference() {
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const icon = themeToggle.querySelector('i');

    if (savedMode === 'enabled' || (savedMode === null && prefersDark)) {
        document.documentElement.classList.add('dark');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        document.documentElement.classList.remove('dark');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
    // Form submission handler
    var form = document.getElementById("my-form");
        
    async function handleSubmit(event) {
        event.preventDefault();
        var status = document.getElementById("my-form-status");
        var data = new FormData(event.target);
        fetch(event.target.action, {
            method: form.method,
            body: data,
            headers: {
                'Accept':
                'application/json'
                }
            }).then(response => {
                if (response.ok) {
                    status.innerHTML = "Thanks for your submission!";
                    status.classList.add("success");
                    status.classList.remove("error");
                    form.reset();
                } else {
                    response.json().then(data => {
                        if (Object.hasOwn(data, 'errors')) {
                            status.innerHTML = data["errors"].map(error => error["message"]).join(", ");
                        } else {
                            status.innerHTML = "Oops! There was a problem submitting your form";
                        }
                        status.classList.add("error");
                        status.classList.remove("success");
                    });
                }
            }).catch(error => {
                status.innerHTML = "Oops! There was a problem submitting your form";
                status.classList.add("error");
                status.classList.remove("success");
            });
        }
        form.addEventListener("submit", handleSubmit);
    }


// ==============================
// Start App
// ==============================
document.addEventListener('DOMContentLoaded', init);

