
const express = require('express');
const axios = require('axios');
const books = require('./booksdb.js');
const isValid = require('./auth_users.js').isValid;
const users = require('./auth_users.js').users;

const public_users = express.Router();

const API_BASE_URL = 'http://localhost:5000';

// Axios functions using async/await
async function getAllBooks() {
    const response = await axios.get(`${API_BASE_URL}/`);
    return response.data;
}

async function getBookByISBN(isbn) {
    const response = await axios.get(
        `${API_BASE_URL}/isbn/${encodeURIComponent(isbn)}`
    );
    return response.data;
}

async function getBooksByAuthor(author) {
    const response = await axios.get(
        `${API_BASE_URL}/author/${encodeURIComponent(author)}`
    );
    return response.data;
}

async function getBooksByTitle(title) {
    const response = await axios.get(
        `${API_BASE_URL}/title/${encodeURIComponent(title)}`
    );
    return response.data;
}

async function getBookReview(isbn) {
    const response = await axios.get(
        `${API_BASE_URL}/review/${encodeURIComponent(isbn)}`
    );
    return response.data;
}

// Register a new user
public_users.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: 'Username and password are required'
        });
    }

    if (isValid(username)) {
        return res.status(409).json({
            message: 'Username already exists'
        });
    }

    users.push({ username, password });

    return res.status(201).json({
        message: 'User successfully registered'
    });
});

// Get all books
public_users.get('/', (req, res) => {
    return res.status(200).json(books);
});

// Get book by ISBN
public_users.get('/isbn/:isbn', (req, res) => {
    const book = books[req.params.isbn];

    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(book);
});

// Get books by author
public_users.get('/author/:author', (req, res) => {
    const author = req.params.author.toLowerCase();

    const result = Object.values(books).filter(book =>
        book.author &&
        book.author.toLowerCase().includes(author)
    );

    return res.status(200).json(result);
});

// Get books by title
public_users.get('/title/:title', (req, res) => {
    const title = req.params.title.toLowerCase();

    const result = Object.values(books).filter(book =>
        book.title &&
        book.title.toLowerCase().includes(title)
    );

    return res.status(200).json(result);
});

// Get reviews for a book
public_users.get('/review/:isbn', (req, res) => {
    const book = books[req.params.isbn];

    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(book.reviews || {});
});

// Export router and Axios functions
module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
module.exports.getBookReview = getBookReview;

// Run Axios functions directly from the command line
if (require.main === module) {
    async function main() {
        const action = process.argv[2];
        const value = process.argv.slice(3).join(' ');

        try {
            let result;

            switch (action) {
                case 'all':
                    result = await getAllBooks();
                    break;
                case 'isbn':
                    result = await getBookByISBN(value);
                    break;
                case 'author':
                    result = await getBooksByAuthor(value);
                    break;
                case 'title':
                    result = await getBooksByTitle(value);
                    break;
                case 'review':
                    result = await getBookReview(value);
                    break;
                default:
                    console.log(
                        'Usage: node router/general.js all|isbn <ISBN>|author <name>|title <title>|review <ISBN>'
                    );
                    return;
            }

            console.log(JSON.stringify(result, null, 2));
        } catch (error) {
            console.error(
                'Request failed:',
                error.response?.data || error.message
            );
            process.exitCode = 1;
        }
    }

    main();
}
