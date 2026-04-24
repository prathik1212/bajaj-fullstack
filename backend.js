const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ── CONFIG: update these before deploying ──
const USER_ID = "PRATIK KALYAN INGAWALE";
const EMAIL_ID = "pi6269@srmist.edu.in";
const COLLEGE_ROLL_NUMBER = "RA2311004050008";

// ── VALIDATION ──────────────────────────────────────────────────────────────
function isValidEdge(s) {
  // Trim first, then validate X->Y (single uppercase letters)
  const trimmed = s.trim();
  return /^[A-Z]->[A-Z]$/.test(trimmed);
}

function isSelfLoop(s) {
  const trimmed = s.trim();
  const m = trimmed.match(/^([A-Z])->([A-Z])$/);
  return m && m[1] === m[2];
}

// ── PROCESSING ───────────────────────────────────────────────────────────────
function processData(data) {
  const invalidEntries = [];
  const duplicateEdges = [];
  const seenEdges = new Set();
  const validEdges = [];

  for (const raw of data) {
    const entry = typeof raw === 'string' ? raw : String(raw);
    const trimmed = entry.trim();

    // Check self-loop first (A->A)
    if (isSelfLoop(trimmed)) {
      invalidEntries.push(entry);
      continue;
    }

    if (!isValidEdge(trimmed)) {
      invalidEntries.push(entry);
      continue;
    }

    // It's valid format
    const edge = trimmed; // e.g. "A->B"
    if (seenEdges.has(edge)) {
      // Only push to duplicate_edges once (first repeat)
      if (!duplicateEdges.includes(edge)) {
        duplicateEdges.push(edge);
      }
    } else {
      seenEdges.add(edge);
      validEdges.push(edge);
    }
  }

  // ── BUILD ADJACENCY ──────────────────────────────────────────────────────
  // Diamond rule: first-encountered parent wins
  const childToParent = {}; // child -> first parent
  const parentToChildren = {}; // parent -> [children]
  const allNodes = new Set();

  for (const edge of validEdges) {
    const [parent, child] = edge.split('->');
    allNodes.add(parent);
    allNodes.add(child);

    if (childToParent[child] === undefined) {
      // First parent wins
      childToParent[child] = parent;
      if (!parentToChildren[parent]) parentToChildren[parent] = [];
      parentToChildren[parent].push(child);
    }
    // else: silently discard multi-parent subsequent edges
  }

  // ── FIND CONNECTED COMPONENTS ────────────────────────────────────────────
  // Build undirected adjacency for grouping
  const adj = {};
  for (const node of allNodes) adj[node] = new Set();
  for (const edge of validEdges) {
    const [p, c] = edge.split('->');
    adj[p].add(c);
    adj[c].add(p);
  }

  const visited = new Set();
  const components = [];

  for (const node of allNodes) {
    if (!visited.has(node)) {
      const comp = [];
      const queue = [node];
      while (queue.length) {
        const cur = queue.shift();
        if (visited.has(cur)) continue;
        visited.add(cur);
        comp.push(cur);
        for (const nb of adj[cur]) queue.push(nb);
      }
      components.push(comp);
    }
  }

  // ── BUILD HIERARCHIES ────────────────────────────────────────────────────
  const hierarchies = [];

  for (const comp of components) {
    const compSet = new Set(comp);

    // Determine root(s): nodes in comp that are not a child of anyone
    const roots = comp.filter(n => childToParent[n] === undefined);

    // Determine root
    let root;
    if (roots.length === 0) {
      // Pure cycle – use lex smallest
      root = comp.slice().sort()[0];
    } else {
      root = roots.sort()[0]; // lex smallest root
    }

    // Detect cycle using DFS
    function hasCycle(startNode, compSet) {
      const stack = [startNode];
      const inStack = new Set();
      const visitedLocal = new Set();

      function dfs(node) {
        visitedLocal.add(node);
        inStack.add(node);
        const children = (parentToChildren[node] || []).filter(c => compSet.has(c));
        for (const child of children) {
          if (!visitedLocal.has(child)) {
            if (dfs(child)) return true;
          } else if (inStack.has(child)) {
            return true;
          }
        }
        inStack.delete(node);
        return false;
      }

      return dfs(startNode);
    }

    const cycleDetected = hasCycle(root, compSet);

    if (cycleDetected) {
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });
    } else {
      // Build nested tree object
      function buildTree(node) {
        const children = (parentToChildren[node] || []).filter(c => compSet.has(c));
        const obj = {};
        for (const child of children.sort()) {
          obj[child] = buildTree(child);
        }
        return obj;
      }

      // Calculate depth (longest root-to-leaf path, counting nodes)
      function calcDepth(node) {
        const children = (parentToChildren[node] || []).filter(c => compSet.has(c));
        if (children.length === 0) return 1;
        return 1 + Math.max(...children.map(calcDepth));
      }

      const tree = {};
      tree[root] = buildTree(root);
      const depth = calcDepth(root);

      hierarchies.push({ root, tree, depth });
    }
  }

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  const nonCyclic = hierarchies.filter(h => !h.has_cycle);
  const cyclic = hierarchies.filter(h => h.has_cycle);

  let largest_tree_root = "";
  if (nonCyclic.length > 0) {
    const maxDepth = Math.max(...nonCyclic.map(h => h.depth));
    const candidates = nonCyclic.filter(h => h.depth === maxDepth).map(h => h.root).sort();
    largest_tree_root = candidates[0];
  }

  const summary = {
    total_trees: nonCyclic.length,
    total_cycles: cyclic.length,
    largest_tree_root
  };

  return {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary
  };
}

// ── ROUTES ───────────────────────────────────────────────────────────────────
app.post('/bfhl', (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Request body must have a "data" array.' });
    }
    const result = processData(data);
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/', (req, res) => res.json({ status: 'BFHL API running. POST /bfhl' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
