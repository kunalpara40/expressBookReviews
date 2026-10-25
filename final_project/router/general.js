
const express = require('express');
const axios = require('axios');
const books = require('./booksdb.js');
const auth = require('./auth_users.js');

const public_users = express.Router();
const API_BASE_URL = 'http://localhost:5000';

// Internal data endpoints prevent Axios requests from calling
// the same public retrieval route recursively.
public_users.get('/__data/books', (req, res) => {
    res.status(200).json(books);
});

public_users.get('/__data/books/:isbn', (req, res) => {
    const book = books[req.params.isbn];

    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(book);
});

// Axios helper: retrieve all books
async function getAllBooks() {
    const response = await axios.get(`${API_BASE_URL}/__data/books`);
    return response.data;
}

// Axios helper: retrieve a book by ISBN
async function getBookByISBN(isbn) {
    const response = await axios.get(
        `${API_BASE_URL}/__data/books/${encodeURIComponent(isbn)}`
    );
    return response.data;
}

// Axios helper: retrieve books by author
async function getBooksByAuthor(author) {
    const allBooks = await getAllBooks();
    const search = author.toLowerCase();

    return Object.values(allBooks).filter(book =>
        book.author &&
        book.author.toLowerCase().includes(search)
    );
}

// Axios helper: retrieve books by title
async function getBooksByTitle(title) {
    const allBooks = await getAllBooks();
    const search = title.toLowerCase();

    return Object.values(allBooks).filter(book =>
        book.title &&
        book.title.toLowerCase().includes(search)
    );
}

// Register a user
public_users.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: 'Username and password are required'
        });
    }

    if (auth.isValid(username)) {
        return res.status(409).json({
            message: 'Username already exists'
        });
    }

    auth.users.push({ username, password });

    return res.status(200).json({
        message: 'User successfully registered. Now you can login'
    });
});

// Retrieve all books using Axios
public_users.get('/', async (req, res) => {
    try {
        const result = await getAllBooks();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: 'Unable to retrieve books',
            error: error.response?.data?.message || error.message
        });
    }
});

// Retrieve a book by ISBN using Axios
public_users.get('/isbn/:isbn', async (req, res) => {
    try {
        const book = await getBookByISBN(req.params.isbn);
        return res.status(200).json(book);
    } catch (error) {
        const status = error.response?.status || 500;
        return res.status(status).json({
            message: status === 404 ? 'Book not found' : 'Unable to retrieve book',
            error: error.response?.data?.message || error.message
        });
    }
});

// Retrieve books by author using Axios
public_users.get('/author/:author', async (req, res) => {
    try {
        const result = await getBooksByAuthor(req.params.author);

        if (result.length === 0) {
            return res.status(404).json({
                message: 'No books found for this author'
            });
        }

        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: 'Unable to retrieve books by author',
            error: error.response?.data?.message || error.message
        });
    }
});

// Retrieve books by title using Axios
public_users.get('/title/:title', async (req, res) => {
    try {
        const result = await getBooksByTitle(req.params.title);

        if (result.length === 0) {
            return res.status(404).json({
                message: 'No books found with this title'
            });
        }

        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            message: 'Unable to retrieve books by title',
            error: error.response?.data?.message || error.message
        });
    }
});

// Retrieve reviews for a book
public_users.get('/review/:isbn', (req, res) => {
    const book = books[req.params.isbn];

    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(book.reviews || {});
});

// Export router and retrieval helpers
module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
