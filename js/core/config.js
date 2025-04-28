/**
 * Configuration settings for the Wedding Bingo application
 */
const config = {
    // Board dimensions
    boardSize: 5,
    
    // Path to the JSON file containing bingo tasks
    tasksJsonPath: 'json/tasks.json',
    
    // Free space configuration
    freeSpace: {
        text: '', // Empty text as requested
        position: 12 // Center position in a 5x5 grid (0-based index)
    },
    
    // Animation settings
    confetti: {
        duration: 5000, // Duration of confetti animation in milliseconds
        particleCount: 100
    }
};

export default config;
