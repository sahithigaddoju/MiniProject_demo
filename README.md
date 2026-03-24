# CloudOpt — Energy-Aware Workload Scheduler

A full-stack web application for data center administrators to schedule workloads using a multi-dimensional knapsack algorithm with energy-aware pricing.

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
```
Runs on http://localhost:5000

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:3000

## Demo Login
- Enter any 10-digit mobile number
- The OTP is displayed on screen (demo mode)

## Sample Workload CSV
```
id,cpu,memory,duration,priority
w001,4,8,2,normal
w002,8,16,1,high
w003,2,4,3,normal
w004,16,32,1,emergency
```

