import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { createMemoryUser, findMemoryUserByEmail } from '../store/inMemoryStore.js';

const createToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret-token-key', { expiresIn: '7d' });

export async function registerUser(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    let existingUser;
    if (mongoose.connection.readyState === 1) {
      existingUser = await User.findOne({ email: normalizedEmail });
    } else {
      existingUser = findMemoryUserByEmail(normalizedEmail);
    }

    if (existingUser) {
      return res.status(400).json({ message: 'An account with that email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = mongoose.connection.readyState === 1
      ? await User.create({ name, email: normalizedEmail, password: hashedPassword })
      : createMemoryUser({ name, email: normalizedEmail, password: hashedPassword });
    const token = createToken(user);

    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create account.', error: error.message });
  }
}

export async function loginUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email: email.trim().toLowerCase() });
    } else {
      user = findMemoryUserByEmail(email.trim().toLowerCase());
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = createToken(user);
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed.', error: error.message });
  }
}

export async function getCurrentUser(req, res) {
  return res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email } });
}
