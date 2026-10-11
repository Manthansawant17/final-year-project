import mongoose from 'mongoose'

// 1. User Schema
export const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    avatar: { type: String },
    role: { type: String, default: 'developer' },
    githubToken: { type: String },
    provider: { type: String, default: 'local' },
    providerId: { type: String },
  },
  { timestamps: true }
)

// 2. Project Schema
export const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    repoUrl: { type: String },
    defaultBranch: { type: String, default: 'main' },
    owner: { type: String, default: 'DevUser' },
    language: { type: String, default: 'Java' },
    framework: { type: String, default: 'Spring Boot' },
  },
  { timestamps: true }
)

// 3. AI Session Schema
export const AISessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    userId: { type: String, default: 'guest' },
    model: { type: String, default: 'gemini-3.8-flash' },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant', 'system', 'tool'], required: true },
        content: { type: String, required: true },
        code: { type: String },
        codeLanguage: { type: String },
        actions: [{ type: String }],
        toolCalls: [{ type: mongoose.Schema.Types.Mixed }],
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
)

// 4. Task Schema
export const TaskSchema = new mongoose.Schema(
  {
    taskId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    assignee: { type: String, default: 'DevUser' },
    projectId: { type: String, default: 'default' },
  },
  { timestamps: true }
)

// 5. Activity Schema
export const ActivitySchema = new mongoose.Schema(
  {
    userId: { type: String, default: 'DevUser' },
    action: { type: String, required: true }, // 'git_commit', 'ai_chat', 'task_created', 'doc_updated', 'mcp_called'
    details: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// 6. Documentation Schema
export const DocumentationSchema = new mongoose.Schema(
  {
    docId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, default: 'General' },
    content: { type: String, required: true },
    tags: [{ type: String }],
    projectId: { type: String, default: 'default' },
  },
  { timestamps: true }
)

// 7. Issue Schema
export const IssueSchema = new mongoose.Schema(
  {
    issueId: { type: String, required: true, unique: true },
    number: { type: Number },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    labels: [{ type: String }],
    projectId: { type: String, default: 'default' },
  },
  { timestamps: true }
)

export const User = mongoose.models.User || mongoose.model('User', UserSchema)
export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema)
export const AISession = mongoose.models.AISession || mongoose.model('AISession', AISessionSchema)
export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema)
export const Activity = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema)
export const Documentation = mongoose.models.Documentation || mongoose.model('Documentation', DocumentationSchema)
export const Issue = mongoose.models.Issue || mongoose.model('Issue', IssueSchema)

export default { User, Project, AISession, Task, Activity, Documentation, Issue }
