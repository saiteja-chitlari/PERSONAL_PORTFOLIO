import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'portfolio_jwt_secret_token_change_in_production_123!';

// --- AUTHENTICATION ---

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { userId: user.id || user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/auth/verify
router.get('/auth/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});


// --- PROJECTS ---

// GET /api/projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await db.getProjects();
    res.json(projects);
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ message: 'Error retrieving projects' });
  }
});

// POST /api/projects
router.post('/projects', authMiddleware, async (req, res) => {
  const { title, description, longDescription, category, technologies, image, githubUrl, liveUrl } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ message: 'Title, description, and category are required' });
  }

  try {
    const newProject = await db.createProject({
      title,
      description,
      longDescription: longDescription || '',
      category,
      technologies: Array.isArray(technologies) ? technologies : [],
      image: image || '/assets/placeholder.jpg',
      githubUrl: githubUrl || '',
      liveUrl: liveUrl || ''
    });
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Error creating project' });
  }
});

// PUT /api/projects/:id
router.put('/projects/:id', authMiddleware, async (req, res) => {
  try {
    const updated = await db.updateProject(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Error updating project' });
  }
});

// DELETE /api/projects/:id
router.delete('/projects/:id', authMiddleware, async (req, res) => {
  try {
    await db.deleteProject(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Error deleting project' });
  }
});


// --- SKILLS ---

// GET /api/skills
router.get('/skills', async (req, res) => {
  try {
    const skills = await db.getSkills();
    res.json(skills);
  } catch (error) {
    console.error('Fetch skills error:', error);
    res.status(500).json({ message: 'Error retrieving skills' });
  }
});

// POST /api/skills
router.post('/skills', authMiddleware, async (req, res) => {
  const { name, category, proficiency, iconName } = req.body;

  if (!name || !category || proficiency === undefined) {
    return res.status(400).json({ message: 'Name, category, and proficiency are required' });
  }

  try {
    const newSkill = await db.createSkill({
      name,
      category,
      proficiency: Number(proficiency),
      iconName: iconName || 'Code'
    });
    res.status(201).json(newSkill);
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({ message: 'Error creating skill' });
  }
});

// PUT /api/skills/:id
router.put('/skills/:id', authMiddleware, async (req, res) => {
  try {
    const updated = await db.updateSkill(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ message: 'Error updating skill' });
  }
});

// DELETE /api/skills/:id
router.delete('/skills/:id', authMiddleware, async (req, res) => {
  try {
    await db.deleteSkill(req.params.id);
    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ message: 'Error deleting skill' });
  }
});


// --- MESSAGES (CONTACT) ---

// POST /api/messages (Public form submission)
router.post('/messages', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required' });
  }

  try {
    const newMessage = await db.createMessage({
      name,
      email,
      subject: subject || 'General Inquiry',
      message
    });
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ message: 'Error submitting message' });
  }
});

// GET /api/messages (Admin Inbox)
router.get('/messages', authMiddleware, async (req, res) => {
  try {
    const messages = await db.getMessages();
    res.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ message: 'Error retrieving messages' });
  }
});

// PUT /api/messages/:id/read (Toggle read status)
router.put('/messages/:id/read', authMiddleware, async (req, res) => {
  const { read } = req.body;
  if (read === undefined) {
    return res.status(400).json({ message: 'Read status value is required' });
  }

  try {
    const updated = await db.updateMessageReadStatus(req.params.id, read);
    res.json(updated);
  } catch (error) {
    console.error('Update message read error:', error);
    res.status(500).json({ message: 'Error updating message read status' });
  }
});

// DELETE /api/messages/:id (Delete from inbox)
router.delete('/messages/:id', authMiddleware, async (req, res) => {
  try {
    await db.deleteMessage(req.params.id);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

export default router;
