const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')

//@desc Get all notes
//@route GET /notes
//@access private
const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find().lean();
    if (!notes?.length) {
        return res.status(404).json({ message: 'No notes found' })
    }

    // Add username to each note before sending the response 
    // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE 
    // You could also do this with a for...of loop
    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return { ...note, username: user.username }
    }))

    res.json(notesWithUser)
    res.json(notes)

})


//@desc  Create new Note
//@route POST /notes
//@access private
const createNewNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body;
    // Validate
    if (!user || !title || !text) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    //Find user
    const foundUser = await User.findById(user);
    if (!foundUser) {
        return res.status(400).json({ message: 'User not found' })
    }
    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }

    //Create note object
    const noteObject = { user: userId, title, text }

    //Create a new Note
    const note = await Note.create(noteObject);
    console.log(note);
    if (note) {
        res.status(201).json({ messaage: `New Note ${note.title} created` })
    } else {
        res.status(400).json({ message: 'Invalid note data received!' })
    }
})

//@desc  Update Note
//@route Patch /notes
//@access private
const updateNote = asyncHandler(async (req, res) => {
    const { id, user, title, text, completed } = req.body;

    //Validate fields
    if (!id || !user || !title || !text || !completed) {
        return res.status(400).json({ message: 'All fields are required!' })
    }

    //Find User
    const foundUser = await User.findById(user);
    if (!foundUser) {
        return res.status(400).json({ message: 'User not found' })
    }


    //Find Note
    const note = await Note.findById(id).exec();

    if (!note) {
        return res.status(400).json({ messaage: 'No note found!' })
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).lean().exec()

    // Allow renaming of the original note 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }

    note.user = user;
    note.title = title;
    note.text = text;
    note.completed = completed;
    const updatedNote = await note.save();
    res.json({ message: `${updatedNote.title} updated!` })

})


//@desc Delete a note
//@route DELETE /notes
//@access private
const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body;
    //Validate fields
    if (!id) {
        return res.status(400).json({ message: 'Note ID Required' })
    }
    //Find Note
    const note = await Note.findById(id).exec();
    if (!note) {
        return res.status(400).json({ message: 'Note not found!' })
    }
    //Delete Note
    const result = await note.deleteOne()
    const reply = `Note ${result.title} with ID ${result._id} deleted`
    res.json(reply)
})

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}