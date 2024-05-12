const readline = require('readline'); // Import the readline module
const sqlite3 = require('sqlite3').verbose(); // Import the sqlite3 module with verbose mode enabled
const rl = readline.createInterface({ // Create an interface for reading input from the console
    input: process.stdin, // Set the input stream to the standard input
    output: process.stdout // Set the output stream to the standard output
});

// Initialize the database
const db = new sqlite3.Database(':memory:'); // Initialize a new SQLite database in memory, can be changed to a file path for a permanent database

// Create the users table if it doesn't exist
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, balance REAL)"); // Execute a SQL statement to create the users table if it doesn't exist
});

// Function for topping up user's balance
function topUp(userID, amount) {
    return new Promise((resolve, reject) => {
        // Retrieving user's name and balance from the database
        db.get("SELECT name, balance FROM users WHERE id = ?", [userID], (err, row) => {
            if (err) {
                // Rejecting promise if there's an error in fetching data
                reject(err);
            } else if (!row) {
                // Rejecting promise if user is not found
                reject(new Error("User not found"));
            } else {
                // Calculating new balance after top-up
                const newBalance = row.balance + amount;
                // Updating user's balance in the database
                db.run("UPDATE users SET balance = ? WHERE id = ?", [newBalance, userID], (err) => {
                    if (err) {
                        // Rejecting promise if there's an error in updating balance
                        reject(err);
                    } else {
                        // Resolving promise with success message if balance is updated successfully
                        resolve(`Successfully topped up ${amount} for user ${row.name}. New balance: ${newBalance}`);
                    }
                });
            }
        });
    });
}

// Function for withdrawing user's balance
function withdraw(userID, amount) {
    return new Promise((resolve, reject) => {
        // Retrieving user's name and balance from the database
        db.get("SELECT name, balance FROM users WHERE id = ?", [userID], (err, row) => {
            if (err) {
                // Rejecting promise if there's an error in fetching data
                reject(err);
            } else if (!row) {
                // Rejecting promise if user is not found
                reject(new Error("User not found"));
            } else if (row.balance < amount) {
                // Rejecting promise if user's balance is insufficient
                reject(new Error("Insufficient balance"));
            } else {
                // Calculating new balance after withdrawal
                const newBalance = row.balance - amount;
                // Updating user's balance in the database
                db.run("UPDATE users SET balance = ? WHERE id = ?", [newBalance, userID], (err) => {
                    if (err) {
                        // Rejecting promise if there's an error in updating balance
                        reject(err);
                    } else {
                        // Resolving promise with success message if balance is updated successfully
                        resolve(`Successfully withdrew ${amount} from user ${row.name}. New balance: ${newBalance}`);
                    }
                });
            }
        });
    });
}


// Function to display menu and receive input from the user
function displayMenu() {
    rl.question('1. Check Balance\n2. Top Up\n3. Withdraw\nChoose an option: ', (option) => {
        switch (parseInt(option)) {
            case 1:
                // Check Balance
                db.get("SELECT name, balance FROM users WHERE id = ?", [userID], (err, row) => {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log(`User ${row.name} balance: ${row.balance}`);
                        askForContinue(rl);
                    }
                });
                break;
            case 2:
                // Top Up
                rl.question('Enter top up amount: ', (amount) => {
                    topUp(userID, parseFloat(amount))
                        .then((message) => {
                            console.log(message);
                            askForContinue(rl);
                        })
                        .catch((error) => {
                            console.error("Error:", error.message);
                            askForContinue(rl);
                        });
                });
                break;
            case 3:
                // Withdraw
                rl.question('Enter withdrawal amount: ', (amount) => {
                    withdraw(userID, parseFloat(amount))
                        .then((message) => {
                            console.log(message);
                            askForContinue(rl);
                        })
                        .catch((error) => {
                            console.error("Error:", error.message);
                            askForContinue(rl);
                        });
                });
                break;
            default:
                console.log('Invalid option');
                askForContinue(rl);
                break;
        }
    });
}
// Function to ask whether the user wants to choose another menu
function askForContinue(rl) {
    rl.question('Do you want to choose another menu? (yes/no): ', (answer) => {
        if (answer.toLowerCase() === 'yes') {
            displayMenu(); // Calling back the menu if the user wants to choose again
        } else {
            rl.close(); // Closing the readline interface if the user chooses to exit
            db.close(); // Closing the database connection
            console.log('Goodbye!');
            process.exit(); // Exiting the Node.js process
        }
    });
}

// Example of usage
const userID = 1;
const userName = "John Doe"; // User's name

db.run("INSERT INTO users (id, name, balance) VALUES (?, ?, ?)", [userID, userName, 100.0], (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Welcome to the banking app!');
        displayMenu();
    }
});