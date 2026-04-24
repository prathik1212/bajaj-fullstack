# BFHL — SRM Full Stack Challenge

REST API + Frontend for the SRM Full Stack Engineering Challenge.

## Live URLs
- **API:** `https://your-backend.onrender.com/bfhl`
- **Frontend:** `https://your-frontend.netlify.app`

## Project Structure
```
bfhl-project/
├── backend/
│   └── index.js        # Express API (POST /bfhl)
├── frontend/
│   └── index.html      # Single-page frontend
├── package.json
└── render.yaml         # Render deploy config
```

## Local Development

### Backend
```bash
npm install
npm start
# → http://localhost:3000
```

### Frontend
Just open `frontend/index.html` in a browser.  
Set the API URL to `http://localhost:3000/bfhl`.

### Test the API
```bash
curl -X POST http://localhost:3000/bfhl \
  -H "Content-Type: application/json" \
  -d '{
    "data": ["A->B","A->C","B->D","C->E","E->F",
             "X->Y","Y->Z","Z->X","P->Q","Q->R",
             "G->H","G->H","G->I","hello","1->2","A->"]
  }'
```

## Deploy Backend to Render (Free)
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo
4. Build Command: `npm install`
5. Start Command: `node backend/index.js`
6. Deploy — get URL like `https://bfhl-xxx.onrender.com`

## Deploy Frontend to Netlify (Free)
1. Go to [netlify.com](https://netlify.com) → Add new site → Deploy manually
2. Drag and drop the `frontend/` folder
3. Get URL like `https://xxx.netlify.app`
4. Update the API URL in the frontend input field

## API Specification

### POST /bfhl
**Request:**
```json
{ "data": ["A->B", "A->C", "B->D"] }
```

**Response:**
```json
{
  "user_id": "fullname_ddmmyyyy",
  "email_id": "your@email.edu",
  "college_roll_number": "XXXXXX",
  "hierarchies": [...],
  "invalid_entries": [...],
  "duplicate_edges": [...],
  "summary": {
    "total_trees": 3,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

## Rules Implemented
- ✅ Valid format: `X->Y` (single uppercase letters only)
- ✅ Self-loop (`A->A`) treated as invalid
- ✅ Whitespace trimmed before validation
- ✅ Duplicate edge tracking (first occurrence kept, rest → duplicate_edges)
- ✅ Multi-parent (diamond): first-encountered parent wins
- ✅ Cycle detection with DFS
- ✅ Pure cycles → lex smallest node as root
- ✅ Depth = nodes on longest root-to-leaf path
- ✅ largest_tree_root tiebreaker: lex smaller root
- ✅ CORS enabled
- ✅ Responds in &lt;3 seconds for 50 nodes
