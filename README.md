# TrajViz

`ssh -L 8080:localhost:5173 MHGIN-strato-hengyu`

## Dev

### client

cd client
npm run dev

### server

cd server
uvicorn src.main:app --reload --port 4000
