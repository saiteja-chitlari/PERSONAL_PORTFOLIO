import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

// File paths for JSON fallback
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const SKILLS_FILE = path.join(DATA_DIR, 'skills.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Mongoose Models definitions
let ProjectModel, SkillModel, MessageModel, UserModel;
let dbMode = 'JSON'; // Default to JSON

// Default Seed Data
const initialProjects = [
  {
    title: "AI Analytics Platform",
    description: "Real-time AI data extraction and visualization dashboard utilizing predictive forecasting models.",
    longDescription: "A comprehensive SaaS platform that ingests raw business transaction streams, processes them using specialized machine learning regression algorithms, and renders sub-second interactive analytics. Features automated reporting, visual anomaly highlighting, and multi-tenant billing integrations.",
    category: "Full-Stack",
    technologies: ["React", "Node.js", "Express", "D3.js", "MongoDB", "Python"],
    image: "/assets/project_ai_analytics.jpg",
    githubUrl: "https://github.com",
    liveUrl: "https://example.com"
  },
  {
    title: "Vivid Sound Streamer",
    description: "Sleek, audio-spatial streaming player with automated transcript generation and real-time waveform visualizers.",
    longDescription: "A high-performance audio web player developed for creators. Utilizing Web Audio API nodes for spatialized sound delivery, WebSockets for concurrent collaborative queues, and natural language API triggers for caption generation. Fully optimized for high-bandwidth accessibility.",
    category: "Frontend",
    technologies: ["HTML5", "CSS3", "JavaScript", "Vite", "Web Audio API"],
    image: "/assets/project_sound_streamer.jpg",
    githubUrl: "https://github.com",
    liveUrl: "https://example.com"
  },
  {
    title: "IoT Smart Green House",
    description: "Centralized industrial greenhouse dashboard linking atmospheric microcontrollers directly to the cloud.",
    longDescription: "An end-to-end IoT platform supporting microclimate monitoring. Ingests humidity, soil saturation, and solar radiation statistics. The application triggers automated server actions (water pump actuation, blind adjustments) based on historical optimal growth conditions.",
    category: "Full-Stack",
    technologies: ["Node.js", "SQLite", "React", "WebSockets", "MQTT", "Chart.js"],
    image: "/assets/project_iot_greenhouse.jpg",
    githubUrl: "https://github.com",
    liveUrl: "https://example.com"
  }
];

const initialSkills = [
  { name: "React.js", category: "Frontend", proficiency: 92, iconName: "React" },
  { name: "JavaScript (ES6+)", category: "Frontend", proficiency: 95, iconName: "Code" },
  { name: "HTML5 & CSS3", category: "Frontend", proficiency: 98, iconName: "Layers" },
  { name: "Node.js", category: "Backend", proficiency: 88, iconName: "Server" },
  { name: "Express.js", category: "Backend", proficiency: 90, iconName: "Cpu" },
  { name: "MongoDB", category: "Backend", proficiency: 85, iconName: "Database" },
  { name: "SQL (SQLite/Postgres)", category: "Backend", proficiency: 80, iconName: "Terminal" },
  { name: "Git & Version Control", category: "Tools", proficiency: 92, iconName: "GitBranch" },
  { name: "Docker", category: "Tools", proficiency: 75, iconName: "Container" },
  { name: "Figma (UI/UX Design)", category: "Tools", proficiency: 82, iconName: "Figma" }
];

// Helper to check and read JSON files
async function readJsonFile(filePath, defaultData = []) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    throw error;
  }
}

// Helper to write JSON files
async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Database Connection & Initialization
export async function initializeDatabase() {
  // Ensure DATA_DIR exists for JSON files
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    // Already exists
  }

  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(mongoUri);
      console.log('MongoDB connected successfully!');
      dbMode = 'MONGO';

      // Define schemas and models
      const projectSchema = new mongoose.Schema({
        title: String,
        description: String,
        longDescription: String,
        category: String,
        technologies: [String],
        image: String,
        githubUrl: String,
        liveUrl: String,
        createdAt: { type: Date, default: Date.now }
      });

      const skillSchema = new mongoose.Schema({
        name: String,
        category: String,
        proficiency: Number,
        iconName: String,
        createdAt: { type: Date, default: Date.now }
      });

      const messageSchema = new mongoose.Schema({
        name: String,
        email: String,
        subject: String,
        message: String,
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
      });

      const userSchema = new mongoose.Schema({
        username: { type: String, unique: true, required: true },
        password: { type: String, required: true }
      });

      ProjectModel = mongoose.model('Project', projectSchema);
      SkillModel = mongoose.model('Skill', skillSchema);
      MessageModel = mongoose.model('Message', messageSchema);
      UserModel = mongoose.model('User', userSchema);

      // Seed initial items if empty
      const projectCount = await ProjectModel.countDocuments();
      if (projectCount === 0) {
        await ProjectModel.insertMany(initialProjects);
        console.log('Seeded initial projects to MongoDB.');
      }

      const skillCount = await SkillModel.countDocuments();
      if (skillCount === 0) {
        await SkillModel.insertMany(initialSkills);
        console.log('Seeded initial skills to MongoDB.');
      }

    } catch (error) {
      console.warn('MongoDB connection failed. Falling back to local JSON files.');
      console.error(error.message);
      dbMode = 'JSON';
    }
  } else {
    console.log('No MONGODB_URI found. Initializing local JSON database...');
    dbMode = 'JSON';
  }

  if (dbMode === 'JSON') {
    // Seed JSON files
    const projects = await readJsonFile(PROJECTS_FILE, initialProjects);
    let updatedProj = false;
    projects.forEach((p, idx) => {
      if (!p.id && !p._id) {
        p.id = `seed_proj_${idx + 1}`;
        p.createdAt = p.createdAt || new Date().toISOString();
        updatedProj = true;
      }
    });
    if (updatedProj) await writeJsonFile(PROJECTS_FILE, projects);

    const skills = await readJsonFile(SKILLS_FILE, initialSkills);
    let updatedSkill = false;
    skills.forEach((s, idx) => {
      if (!s.id && !s._id) {
        s.id = `seed_skill_${idx + 1}`;
        s.createdAt = s.createdAt || new Date().toISOString();
        updatedSkill = true;
      }
    });
    if (updatedSkill) await writeJsonFile(SKILLS_FILE, skills);

    await readJsonFile(MESSAGES_FILE, []);
    await readJsonFile(USERS_FILE, []);
    console.log('JSON database initialized successfully.');
  }

  // Create default administrator if none exists
  await ensureAdminExists();
}

async function ensureAdminExists() {
  const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
  const defaultPassword = process.env.ADMIN_PASSWORD || 'password123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  if (dbMode === 'MONGO') {
    const adminCount = await UserModel.countDocuments();
    if (adminCount === 0) {
      const admin = new UserModel({
        username: defaultUsername,
        password: hashedPassword
      });
      await admin.save();
      console.log(`Default administrator account created: Username="${defaultUsername}"`);
    }
  } else {
    const users = await readJsonFile(USERS_FILE, []);
    if (users.length === 0) {
      users.push({
        id: Date.now().toString(),
        username: defaultUsername,
        password: hashedPassword
      });
      await writeJsonFile(USERS_FILE, users);
      console.log(`Default administrator account created: Username="${defaultUsername}"`);
    }
  }
}

// Database Actions Wrapper
export const db = {
  getMode: () => dbMode,

  // PROJECTS
  getProjects: async () => {
    if (dbMode === 'MONGO') {
      return await ProjectModel.find().sort({ createdAt: -1 });
    } else {
      const data = await readJsonFile(PROJECTS_FILE);
      return data.reverse();
    }
  },

  createProject: async (projectData) => {
    if (dbMode === 'MONGO') {
      const project = new ProjectModel(projectData);
      return await project.save();
    } else {
      const projects = await readJsonFile(PROJECTS_FILE);
      const newProject = {
        id: Date.now().toString(),
        ...projectData,
        createdAt: new Date().toISOString()
      };
      projects.push(newProject);
      await writeJsonFile(PROJECTS_FILE, projects);
      return newProject;
    }
  },

  updateProject: async (id, projectData) => {
    if (dbMode === 'MONGO') {
      return await ProjectModel.findByIdAndUpdate(id, projectData, { new: true });
    } else {
      const projects = await readJsonFile(PROJECTS_FILE);
      const idx = projects.findIndex(p => p.id === id || p._id === id);
      if (idx === -1) throw new Error('Project not found');
      projects[idx] = { ...projects[idx], ...projectData };
      await writeJsonFile(PROJECTS_FILE, projects);
      return projects[idx];
    }
  },

  deleteProject: async (id) => {
    if (dbMode === 'MONGO') {
      return await ProjectModel.findByIdAndDelete(id);
    } else {
      const projects = await readJsonFile(PROJECTS_FILE);
      const filtered = projects.filter(p => p.id !== id && p._id !== id);
      await writeJsonFile(PROJECTS_FILE, filtered);
      return { success: true };
    }
  },

  // SKILLS
  getSkills: async () => {
    if (dbMode === 'MONGO') {
      return await SkillModel.find().sort({ createdAt: 1 });
    } else {
      return await readJsonFile(SKILLS_FILE);
    }
  },

  createSkill: async (skillData) => {
    if (dbMode === 'MONGO') {
      const skill = new SkillModel(skillData);
      return await skill.save();
    } else {
      const skills = await readJsonFile(SKILLS_FILE);
      const newSkill = {
        id: Date.now().toString(),
        ...skillData,
        createdAt: new Date().toISOString()
      };
      skills.push(newSkill);
      await writeJsonFile(SKILLS_FILE, skills);
      return newSkill;
    }
  },

  updateSkill: async (id, skillData) => {
    if (dbMode === 'MONGO') {
      return await SkillModel.findByIdAndUpdate(id, skillData, { new: true });
    } else {
      const skills = await readJsonFile(SKILLS_FILE);
      const idx = skills.findIndex(s => s.id === id || s._id === id);
      if (idx === -1) throw new Error('Skill not found');
      skills[idx] = { ...skills[idx], ...skillData };
      await writeJsonFile(SKILLS_FILE, skills);
      return skills[idx];
    }
  },

  deleteSkill: async (id) => {
    if (dbMode === 'MONGO') {
      return await SkillModel.findByIdAndDelete(id);
    } else {
      const skills = await readJsonFile(SKILLS_FILE);
      const filtered = skills.filter(s => s.id !== id && s._id !== id);
      await writeJsonFile(SKILLS_FILE, filtered);
      return { success: true };
    }
  },

  // MESSAGES
  getMessages: async () => {
    if (dbMode === 'MONGO') {
      return await MessageModel.find().sort({ createdAt: -1 });
    } else {
      const data = await readJsonFile(MESSAGES_FILE);
      return data.reverse();
    }
  },

  createMessage: async (messageData) => {
    if (dbMode === 'MONGO') {
      const message = new MessageModel(messageData);
      return await message.save();
    } else {
      const messages = await readJsonFile(MESSAGES_FILE);
      const newMessage = {
        id: Date.now().toString(),
        ...messageData,
        read: false,
        createdAt: new Date().toISOString()
      };
      messages.push(newMessage);
      await writeJsonFile(MESSAGES_FILE, messages);
      return newMessage;
    }
  },

  updateMessageReadStatus: async (id, read) => {
    if (dbMode === 'MONGO') {
      return await MessageModel.findByIdAndUpdate(id, { read }, { new: true });
    } else {
      const messages = await readJsonFile(MESSAGES_FILE);
      const idx = messages.findIndex(m => m.id === id || m._id === id);
      if (idx === -1) throw new Error('Message not found');
      messages[idx].read = read;
      await writeJsonFile(MESSAGES_FILE, messages);
      return messages[idx];
    }
  },

  deleteMessage: async (id) => {
    if (dbMode === 'MONGO') {
      return await MessageModel.findByIdAndDelete(id);
    } else {
      const messages = await readJsonFile(MESSAGES_FILE);
      const filtered = messages.filter(m => m.id !== id && m._id !== id);
      await writeJsonFile(MESSAGES_FILE, filtered);
      return { success: true };
    }
  },

  // USERS / AUTHENTICATION
  getUserByUsername: async (username) => {
    if (dbMode === 'MONGO') {
      return await UserModel.findOne({ username });
    } else {
      const users = await readJsonFile(USERS_FILE);
      return users.find(u => u.username === username) || null;
    }
  }
};
