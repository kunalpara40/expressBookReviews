
const express = require('express');
const jwt = require('jsonwebtoken');
const books = require('./booksdb.js');

const regd_users = express.Router();
let users = [];

// Returns true if the username already exists
const isValid = (username) => {
    return users.some(user => user.username === username);
};

// Check username and password
const authenticatedUser = (username, password) => {
    return users.some(
        user => user.username === username &&
                user.password === password
    );
};

// User login
regd_users.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: 'Username and password are required'
        });
    }

    if (!authenticatedUser(username, password)) {
        return res.status(401).json({
            message: 'Invalid username or password'
        });
    }

    const token = jwt.sign(
        { username },
        'fingerprint_customer',
        { expiresIn: '1h' }
    );

    return res.status(200).json({
        message: 'Login successful',
        token
    });
});

// Add or update a book review
regd_users.put('/auth/review/:isbn', (req, res) => {
    const username = req.user.username;
    const isbn = req.params.isbn;
    const review = req.body.review;

    if (!review) {
        return res.status(400).json({
            message: 'Review is required'
        });
    }

    const book = books[isbn];

    if (!book) {
        return res.status(404).json({
            message: 'Book not found'
        });
    }

    if (!book.reviews) {
        book.reviews = {};
    }

    book.reviews[username] = review;

    return res.status(200).json({
        message: 'Review added or updated successfully',
        reviews: book.reviews
    });
});

 // Delete a book review
regd_users.delete('/auth/review/:isbn', (req, res) => {
    const username = req.user.username;
    const isbn = req.params.isbn;
    const book = books[isbn];

    if (!book) {
        return res.status(404).json({
            message: 'Book not found'
        });
    }

    if (!book.reviews || !book.reviews[username]) {
        return res.status(404).json({
            message: 'Review not found'
        });
    }

    delete book.reviews[username];

    return res.status(200).json({
        message: 'Review deleted successfully'
    });
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
