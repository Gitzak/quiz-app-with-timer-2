const fs = require('fs');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const inputFilePath = path.join(__dirname, '../public/data/quizzes.json');
const outputFilePath = path.join(__dirname, '../public/data/encrypted_quizzes.json');


const saltRounds = 10; // Adjust the number of salt rounds as needed

const encryptionKey = process.env.REACT_APP_SECRET_KEY;

function hashData(data) {
    const hashedData = { ...data };

    if (hashedData.quizzes) {
        hashedData.quizzes.forEach((quiz) => {
            if (quiz.correct_index) {
                quiz.correct_index = bcrypt.hashSync(quiz.correct_index, saltRounds);
            }
        });
    }

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
        const hashedData = hashData(jsonData);

        // Write the hashed data to the output file
        saveDataToFile(hashedData, outputFilePath);

        console.log('Data hashing and writing to file completed successfully.');
    }
} catch (error) {
    console.error('An error occurred:', error);
    process.exit(1); // Exit the script with an error code
}
