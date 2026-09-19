const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['company', 'agent'],
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  
  // Specific to Company
  companyName: {
    type: String,
    required: function() { return this.role === 'company'; }
  },
  regNumber: {
    type: String,
    required: function() { return this.role === 'company'; }
  },
  managerName: {
    type: String,
    required: function() { return this.role === 'company'; }
  },
  operatorName: {
    type: String, // Optional
    default: ''
  },
  
  // Specific to Agent
  firstName: {
    type: String,
    required: function() { return this.role === 'agent'; }
  },
  lastName: {
    type: String,
    required: function() { return this.role === 'agent'; }
  },
  idNumber: {
    type: String,
    required: function() { return this.role === 'agent'; }
  },
  experience: {
    type: String,
    required: function() { return this.role === 'agent'; }
  },
  specialization: {
    type: String,
    required: function() { return this.role === 'agent'; }
  },
  languages: {
    type: String,
    required: function() { return this.role === 'agent'; }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
