const fs = require('fs');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const inputFilePath = path.join(__dirname, '../public/Db/quizzes.json');
const outputFilePath = path.join(__dirname, '../public/Db/encrypted_quizzes.json');

const saltRounds = 10; // Adjust the number of salt rounds as needed

const encryptionKey = process.env.REACT_APP_SECRET_KEY;

function hashData(data, encryptionKey) {
    const hashedData = [...data];

    hashedData.forEach((quiz) => {
        if (quiz.correct_index) {
            const textToHash = quiz.correct_index + '_' + encryptionKey;
            quiz.correct_index = bcrypt.hashSync(textToHash, saltRounds);
        }
    });

    return hashedData;
}

function saveDataToFile(data, filePath) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

try {
    // Read the JSON data from the input file
    const rawData = fs.readFileSync(inputFilePath);
    const jsonData = JSON.parse(rawData);

    if (!encryptionKey) {
        console.error('Encryption key not found in environment variables.');
    } else {
        // Hash the data
        const hashedData = hashData(jsonData, encryptionKey);

        // Write the hashed data to the output file
        saveDataToFile(hashedData, outputFilePath);

        console.log('Data hashing and writing to file completed successfully.');
    }
} catch (error) {
    console.error('An error occurred:', error);
    process.exit(1); // Exit the script with an error code
}
