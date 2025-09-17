const { ImageAnnotatorClient } = require('@google-cloud/vision');
const stringSimilarity = require('string-similarity');

// Initialize the client
const client = new ImageAnnotatorClient({
    keyFilename: 'google-credentials.json' // Path to your key file
});

// Helper function to find the best name match in a block of text
function findBestNameMatch(name, textBlock) {
    const nameParts = name.trim().split(/\s+/);
    const textLines = textBlock.split('\n');
    let bestMatch = '';
    let highestScore = 0;

    for (const line of textLines) {
        // A simple check: if a line contains the first name, consider it a candidate
        if (line.toLowerCase().includes(nameParts[0].toLowerCase())) {
            const score = stringSimilarity.compareTwoStrings(name.toLowerCase(), line.toLowerCase());
            if (score > highestScore) {
                highestScore = score;
                bestMatch = line.trim();
            }
        }
    }
    return bestMatch || 'Name not found';
}

/**
 * @desc     Reusable function to verify text from an ID image
 */
const verifyGuestIdText = async (imageUrl, nameEntered) => {
    if (!imageUrl || !nameEntered) {
        return {
            match: false,
            message: 'Image URL and the name entered are required.'
        };
    }

    try {
        const [result] = await client.textDetection(imageUrl);
        const detections = result.textAnnotations;

        if (!detections || detections.length === 0) {
            return {
                match: false,
                message: 'No text found on the ID card.'
            };
        }

        const fullText = detections[0].description;
        const nameOnId = findBestNameMatch(nameEntered, fullText);

        const similarity = stringSimilarity.compareTwoStrings(
            nameEntered.toLowerCase(), 
            nameOnId.toLowerCase()
        );

        if (similarity > 0.7) { // 70% similarity threshold
            return {
                match: true,
                nameOnId: nameOnId,
                similarity: Math.round(similarity * 100),
                message: 'Name successfully verified.'
            };
        } else {
            return {
                match: false,
                nameOnId: nameOnId,
                similarity: Math.round(similarity * 100),
                message: 'Name does not match the ID. Please review.'
            };
        }
    } catch (error) {
        // console.error('Google Vision API Error:', error);
        return {
            match: false,
            message: 'Failed to process ID card image.'
        };
    }
};

module.exports = { verifyGuestIdText };