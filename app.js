const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');


// Create an Express app
const app = express();
const PORT = 5000; // Choose any port

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));


// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/testing', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });


// Define Schema for Sticky Notes
const stickyNoteSchema = new mongoose.Schema({
    title: String,
    content: [String], // Changed content to be an array of strings
});

const StickyNote = mongoose.model('StickyNote', stickyNoteSchema);


//module schema
const moduleSchema = new mongoose.Schema({
    title: String,
    content: [
        {
            className: String, // Class name like "class1"
            filePath: String // Path to the associated file
        }
    ]
});

const Module = mongoose.model('Module', moduleSchema);




// Routes
// Route to add a Sticky Note
app.post('/sticky-notes', async (req, res) => {
    const { title, content } = req.body;
    const newNote = new StickyNote({ title, content });
    await newNote.save();
    res.status(201).json(newNote);
});

// Route to get all Sticky Notes
app.get('/sticky-notes', async (req, res) => {
    const notes = await StickyNote.find();
    res.status(200).json(notes);
});

app.post('/modules', upload.array('files'), async (req, res) => {
    const { title, content } = req.body;

    const contentArray = JSON.parse(content); // Parse the content array

    // Associate the content with the uploaded files
    const moduleContent = contentArray.map((className, index) => ({
        className: className,
        filePath: req.files[index] ? req.files[index].path : null // Save the file path
    }));

    const newModule = new Module({
        title: title,
        content: moduleContent
    });

    await newModule.save();
    res.status(201).json(newModule);
});

app.get('/modules', async (req, res) => {
    const modules = await Module.find();
    res.status(200).json(modules);
});



// Route to delete a Sticky Note
app.delete('/sticky-notes/:id', async (req, res) => {
    const { id } = req.params;
    const deletedNote = await StickyNote.findByIdAndDelete(id);
    if (deletedNote) {
        res.status(200).json(deletedNote);
    } else {
        res.status(404).json({ message: 'Sticky Note not found' });
    }
});



// DELETE endpoint to delete a module by its ID
app.delete('/modules/:id', async (req, res) => {
    try {
        const moduleId = req.params.id; // Get module ID from URL parameters

        // Find and delete the module by its ID
        const deletedModule = await Module.findByIdAndDelete(moduleId);

        // If no module is found, send a 404 error
        if (!deletedModule) {
            return res.status(404).json({ message: 'Module not found' });
        }

        // Respond with a success message if the deletion is successful
        res.status(200).json({ message: 'Module deleted successfully' });
    } catch (error) {
        // Handle server errors and send a 500 response
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});




// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
