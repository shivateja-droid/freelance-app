import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import adminRoutes from './routes/adminRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import freelancerRoutes from './routes/freelancerRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import SocketHandler from './SocketHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.json({ message: "KaamSetu Backend Live 🚀" });
});

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));
app.use(cors());

app.use(authRoutes);
app.use(freelancerRoutes);
app.use(projectRoutes);
app.use(applicationRoutes);
app.use(adminRoutes);
app.use(chatRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

io.on('connection', (socket) => {
  SocketHandler(socket);
});



const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Running @ ${PORT}`);
    });
  } catch (error) {
    console.log(`Error in db connection ${error}`);
  }
};

startServer();
